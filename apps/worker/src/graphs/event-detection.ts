import { StateGraph, END, START } from '@langchain/langgraph';
import { supabase } from '../db.js';
import { xApiClient } from '../ingest/x-client.js';
import { filterPostsByQuality } from '../ingest/quality-filter.js';
import { grokClient } from '../grok/client.js';
import { clusterPosts, matchClustersToEvents } from '../cluster/semantic-cluster.js';
import { geocodeLocation } from '../geocode/mapbox-geocoder.js';
import { qualityConfig, clusterConfig, batchConfig } from '../config.js';
import type {
  PostWithEmbedding,
  Cluster,
  EventSummary,
  GeocodedLocation,
} from '@event-monitor/shared';

// State interface for the graph
interface EventDetectionState {
  batchId: string;
  monitorQuery: string;
  posts: PostWithEmbedding[];
  clusters: Cluster[];
  summaries: Map<string, EventSummary>;
  geocodedLocations: Map<string, GeocodedLocation | null>;
  eventMatches: Map<string, string>;
  errors: string[];
}

// Node: Load and process posts from X API
async function loadPostsNode(
  state: EventDetectionState
): Promise<Partial<EventDetectionState>> {
  console.log('Loading posts from X API...');

  try {
    // Get the last processed post ID
    const { data: lastPost } = await supabase
      .from('posts')
      .select('x_post_id')
      .order('posted_at', { ascending: false })
      .limit(1)
      .single();

    // Search for new posts
    const response = await xApiClient.searchRecentPosts({
      query: state.monitorQuery,
      maxResults: batchConfig.maxPostsPerBatch,
      sinceId: lastPost?.x_post_id,
    });

    if (response.posts.length === 0) {
      console.log('No new posts found');
      return { posts: [] };
    }

    console.log(`Found ${response.posts.length} posts`);

    // Get user details for quality filtering
    const userIds = [...new Set(response.posts.map((p) => p.authorId))];
    const users = await xApiClient.getUsers(userIds);

    // Filter by quality
    const qualityPosts = await filterPostsByQuality(
      response.posts,
      users,
      qualityConfig,
      grokClient
    );

    console.log(`${qualityPosts.length} posts passed quality filter`);

    // Generate embeddings
    const postsWithEmbeddings: PostWithEmbedding[] = [];

    for (const { post, quality } of qualityPosts) {
      const embedding = await grokClient.createEmbedding(post.text);
      const user = users.get(post.authorId);

      postsWithEmbeddings.push({
        xPostId: post.id,
        authorId: post.authorId,
        authorUsername: user?.username ?? null,
        authorFollowers: user?.followersCount ?? null,
        authorVerified: user?.verified ?? false,
        accountCreatedAt: user?.createdAt ?? null,
        content: post.text,
        mediaUrls: post.mediaUrls,
        likes: post.publicMetrics.likeCount,
        retweets: post.publicMetrics.retweetCount,
        replies: post.publicMetrics.replyCount,
        postedAt: post.createdAt,
        embedding,
        qualityScore: quality.score,
      });
    }

    // Store posts in database
    for (const post of postsWithEmbeddings) {
      await supabase.from('posts').upsert({
        x_post_id: post.xPostId,
        author_id: post.authorId,
        author_username: post.authorUsername,
        author_followers: post.authorFollowers,
        author_verified: post.authorVerified,
        account_created_at: post.accountCreatedAt,
        content: post.content,
        media_urls: post.mediaUrls,
        likes: post.likes,
        retweets: post.retweets,
        replies: post.replies,
        posted_at: post.postedAt,
        embedding: JSON.stringify(post.embedding),
        quality_score: post.qualityScore,
        quality_passed: true,
        batch_id: state.batchId,
      });
    }

    return { posts: postsWithEmbeddings };
  } catch (error) {
    console.error('Error loading posts:', error);
    return {
      errors: [...state.errors, `Load posts error: ${error}`],
    };
  }
}

// Node: Cluster posts
async function clusterPostsNode(
  state: EventDetectionState
): Promise<Partial<EventDetectionState>> {
  console.log('Clustering posts...');

  if (state.posts.length === 0) {
    return { clusters: [] };
  }

  const clusters = clusterPosts(state.posts, clusterConfig);
  console.log(`Created ${clusters.length} clusters`);

  return { clusters };
}

// Node: Match existing events
async function matchExistingEventsNode(
  state: EventDetectionState
): Promise<Partial<EventDetectionState>> {
  console.log('Matching existing events...');

  if (state.clusters.length === 0) {
    return { eventMatches: new Map() };
  }

  // Get existing event centroids
  const { data: existingEvents } = await supabase
    .from('events')
    .select('id, centroid_embedding')
    .not('centroid_embedding', 'is', null);

  const existingCentroids =
    existingEvents?.map((e) => ({
      eventId: e.id,
      centroid: JSON.parse(e.centroid_embedding as string),
    })) ?? [];

  const matches = matchClustersToEvents(
    state.clusters,
    existingCentroids,
    clusterConfig.eventMatchThreshold
  );

  console.log(`Found ${matches.size} matches to existing events`);

  return { eventMatches: matches };
}

// Node: Summarize clusters
async function summarizeClustersNode(
  state: EventDetectionState
): Promise<Partial<EventDetectionState>> {
  console.log('Summarizing clusters...');

  const summaries = new Map<string, EventSummary>();

  for (const cluster of state.clusters) {
    try {
      const postTexts = cluster.posts.map((p) => p.content);
      const summary = await grokClient.summarizeCluster(postTexts);
      summaries.set(cluster.id, summary);
    } catch (error) {
      console.error(`Error summarizing cluster ${cluster.id}:`, error);
    }
  }

  return { summaries };
}

// Node: Geocode locations
async function geocodeLocationsNode(
  state: EventDetectionState
): Promise<Partial<EventDetectionState>> {
  console.log('Geocoding locations...');

  const geocodedLocations = new Map<string, GeocodedLocation | null>();

  for (const [clusterId, summary] of state.summaries) {
    if (summary.location && summary.location.toLowerCase() !== 'none') {
      const location = await geocodeLocation(summary.location);
      geocodedLocations.set(clusterId, location);
    } else {
      geocodedLocations.set(clusterId, null);
    }
  }

  return { geocodedLocations };
}

// Node: Save events
async function saveEventsNode(
  state: EventDetectionState
): Promise<Partial<EventDetectionState>> {
  console.log('Saving events...');

  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() + batchConfig.retentionDays);

  for (const cluster of state.clusters) {
    const summary = state.summaries.get(cluster.id);
    if (!summary) continue;

    const location = state.geocodedLocations.get(cluster.id);
    const existingEventId = state.eventMatches.get(cluster.id);

    const timestamps = cluster.posts.map((p) => new Date(p.postedAt).getTime());
    const earliestPost = new Date(Math.min(...timestamps)).toISOString();
    const latestPost = new Date(Math.max(...timestamps)).toISOString();

    if (existingEventId) {
      // Update existing event (create new version)
      const { data: existingEvent } = await supabase
        .from('events')
        .select('*')
        .eq('id', existingEventId)
        .single();

      if (existingEvent) {
        // Save history
        await supabase.from('event_history').insert({
          event_id: existingEventId,
          version: existingEvent.version,
          title: existingEvent.title,
          summary: existingEvent.summary,
          post_count: existingEvent.post_count,
          change_type: 'updated',
        });

        // Update event
        await supabase
          .from('events')
          .update({
            version: existingEvent.version + 1,
            title: summary.title,
            summary: summary.summary,
            event_type: summary.eventType,
            confidence_score: summary.confidence,
            post_count: existingEvent.post_count + cluster.size,
            centroid_embedding: JSON.stringify(cluster.centroid),
            latest_post_at: latestPost,
          })
          .eq('id', existingEventId);

        // Link new posts
        for (let i = 0; i < cluster.posts.length; i++) {
          const { data: post } = await supabase
            .from('posts')
            .select('id')
            .eq('x_post_id', cluster.posts[i].xPostId)
            .single();

          if (post) {
            await supabase.from('event_posts').upsert({
              event_id: existingEventId,
              post_id: post.id,
              similarity_score: cluster.similarities[i],
            });
          }
        }
      }
    } else {
      // Create new event
      const { data: newEvent } = await supabase
        .from('events')
        .insert({
          title: summary.title,
          summary: summary.summary,
          event_type: summary.eventType,
          confidence_score: summary.confidence,
          post_count: cluster.size,
          centroid_embedding: JSON.stringify(cluster.centroid),
          has_location: !!location,
          location_name: location?.locationName ?? null,
          country: location?.country ?? null,
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
          h3_index_res4: location?.h3Indices.res4 ?? null,
          h3_index_res6: location?.h3Indices.res6 ?? null,
          h3_index_res8: location?.h3Indices.res8 ?? null,
          earliest_post_at: earliestPost,
          latest_post_at: latestPost,
          batch_id: state.batchId,
          expires_at: retentionDate.toISOString(),
        })
        .select()
        .single();

      if (newEvent) {
        // Save initial history
        await supabase.from('event_history').insert({
          event_id: newEvent.id,
          version: 1,
          title: summary.title,
          summary: summary.summary,
          post_count: cluster.size,
          change_type: 'created',
        });

        // Link posts
        for (let i = 0; i < cluster.posts.length; i++) {
          const { data: post } = await supabase
            .from('posts')
            .select('id')
            .eq('x_post_id', cluster.posts[i].xPostId)
            .single();

          if (post) {
            await supabase.from('event_posts').insert({
              event_id: newEvent.id,
              post_id: post.id,
              similarity_score: cluster.similarities[i],
            });
          }
        }
      }
    }
  }

  console.log('Events saved successfully');
  return {};
}

// Build the graph
function createEventDetectionGraph() {
  const graph = new StateGraph<EventDetectionState>({
    channels: {
      batchId: { value: (x: string) => x },
      monitorQuery: { value: (x: string) => x },
      posts: { value: (x: PostWithEmbedding[]) => x, default: () => [] },
      clusters: { value: (x: Cluster[]) => x, default: () => [] },
      summaries: {
        value: (x: Map<string, EventSummary>) => x,
        default: () => new Map(),
      },
      geocodedLocations: {
        value: (x: Map<string, GeocodedLocation | null>) => x,
        default: () => new Map(),
      },
      eventMatches: {
        value: (x: Map<string, string>) => x,
        default: () => new Map(),
      },
      errors: { value: (x: string[]) => x, default: () => [] },
    },
  });

  graph.addNode('load_posts', loadPostsNode);
  graph.addNode('cluster_posts', clusterPostsNode);
  graph.addNode('match_existing_events', matchExistingEventsNode);
  graph.addNode('summarize_clusters', summarizeClustersNode);
  graph.addNode('geocode_locations', geocodeLocationsNode);
  graph.addNode('save_events', saveEventsNode);

  graph.addEdge(START, 'load_posts');
  graph.addEdge('load_posts', 'cluster_posts');
  graph.addEdge('cluster_posts', 'match_existing_events');
  graph.addEdge('match_existing_events', 'summarize_clusters');
  graph.addEdge('summarize_clusters', 'geocode_locations');
  graph.addEdge('geocode_locations', 'save_events');
  graph.addEdge('save_events', END);

  return graph.compile();
}

export const eventDetectionGraph = createEventDetectionGraph();
