import { distance } from 'ml-distance';
import type { PostWithEmbedding, Cluster, ClusterConfig } from '@event-monitor/shared';

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  return 1 - distance.cosine(a, b);
}

/**
 * Compute centroid of a set of embeddings
 */
function computeCentroid(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return [];

  const dim = embeddings[0].length;
  const centroid = new Array(dim).fill(0);

  for (const embedding of embeddings) {
    for (let i = 0; i < dim; i++) {
      centroid[i] += embedding[i];
    }
  }

  const magnitude = Math.sqrt(centroid.reduce((sum, x) => sum + x * x, 0));
  return centroid.map((x) => x / magnitude);
}

/**
 * Simple DBSCAN-style clustering algorithm
 * Uses cosine similarity to group similar posts
 */
export function clusterPosts(
  posts: PostWithEmbedding[],
  config: ClusterConfig
): Cluster[] {
  if (posts.length === 0) return [];

  const { similarityThreshold, minClusterSize, maxClusters } = config;

  // Track which posts have been assigned to a cluster
  const assigned = new Set<number>();
  const clusters: Cluster[] = [];

  // Sort posts by engagement (higher engagement posts become cluster seeds)
  const sortedIndices = posts
    .map((_, i) => i)
    .sort((a, b) => {
      const engA = posts[a].likes + posts[a].retweets + posts[a].replies;
      const engB = posts[b].likes + posts[b].retweets + posts[b].replies;
      return engB - engA;
    });

  for (const seedIdx of sortedIndices) {
    if (assigned.has(seedIdx)) continue;
    if (clusters.length >= maxClusters) break;

    const seed = posts[seedIdx];
    const clusterPosts: PostWithEmbedding[] = [seed];
    const clusterSimilarities: number[] = [1.0];
    assigned.add(seedIdx);

    // Find all similar posts
    for (let i = 0; i < posts.length; i++) {
      if (assigned.has(i)) continue;

      const similarity = cosineSimilarity(seed.embedding, posts[i].embedding);

      if (similarity >= similarityThreshold) {
        clusterPosts.push(posts[i]);
        clusterSimilarities.push(similarity);
        assigned.add(i);
      }
    }

    // Only keep clusters with enough posts
    if (clusterPosts.length >= minClusterSize) {
      const embeddings = clusterPosts.map((p) => p.embedding);
      const centroid = computeCentroid(embeddings);

      clusters.push({
        id: `cluster-${clusters.length}`,
        posts: clusterPosts,
        similarities: clusterSimilarities,
        centroid,
        size: clusterPosts.length,
      });
    } else {
      // Release posts back to the pool if cluster is too small
      for (const post of clusterPosts) {
        const idx = posts.indexOf(post);
        if (idx !== seedIdx) {
          assigned.delete(idx);
        }
      }
    }
  }

  return clusters;
}

/**
 * Find existing events that match new clusters
 */
export function matchClustersToEvents(
  clusters: Cluster[],
  existingEventCentroids: Array<{ eventId: string; centroid: number[] }>,
  threshold: number
): Map<string, string> {
  const matches = new Map<string, string>();

  for (const cluster of clusters) {
    let bestMatch: { eventId: string; similarity: number } | null = null;

    for (const event of existingEventCentroids) {
      const similarity = cosineSimilarity(cluster.centroid, event.centroid);

      if (similarity >= threshold) {
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { eventId: event.eventId, similarity };
        }
      }
    }

    if (bestMatch) {
      matches.set(cluster.id, bestMatch.eventId);
    }
  }

  return matches;
}
