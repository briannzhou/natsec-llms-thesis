// X API Types

export interface XSearchParams {
  query: string;
  maxResults: number;
  sinceId?: string;
  startTime?: string;
  endTime?: string;
  useFullArchive?: boolean;
}

export interface XPost {
  id: string;
  text: string;
  authorId: string;
  authorUsername?: string;
  createdAt: string;
  publicMetrics: {
    likeCount: number;
    retweetCount: number;
    replyCount: number;
  };
  mediaUrls: string[];
}

export interface XUser {
  id: string;
  username: string;
  followersCount: number;
  verified: boolean;
  createdAt?: string;
}

export interface XSearchResponse {
  posts: XPost[];
  nextToken?: string;
  resultCount: number;
}

// Quality Filter Types

export interface QualityConfig {
  minEngagement: number;
  minFollowers: number;
  minAccountAgeDays: number;
  requireVerified: boolean;
  enableContentScoring: boolean;
  minContentScore: number;
}

export interface QualityResult {
  score: number;
  passed: boolean;
  breakdown: {
    engagement: number;
    account: number;
    content: number;
  };
}

// Clustering Types

export interface ClusterConfig {
  minClusterSize: number;
  similarityThreshold: number;
  maxClusters: number;
  eventMatchThreshold: number;
}

export interface PostWithEmbedding {
  xPostId: string;
  authorId: string;
  authorUsername: string | null;
  authorFollowers: number | null;
  authorVerified: boolean;
  accountCreatedAt: string | null;
  content: string;
  mediaUrls: string[];
  likes: number;
  retweets: number;
  replies: number;
  postedAt: string;
  embedding: number[];
  qualityScore: number;
}

export interface Cluster {
  id: string;
  posts: PostWithEmbedding[];
  similarities: number[];
  centroid: number[];
  size: number;
}

// Event Types

export interface EventSummary {
  title: string;
  summary: string;
  eventType: string;
  confidence: number;
  location: string | null;
}

export interface GeocodedLocation {
  locationName: string;
  country: string | null;
  latitude: number;
  longitude: number;
  h3Indices: {
    res4: string;
    res6: string;
    res8: string;
  };
}

// Database Types

export interface Event {
  id: string;
  version: number;
  model: string | null;
  parent_event_id: string | null;
  title: string;
  summary: string;
  event_type: string | null;
  confidence_score: number | null;
  urgency_score: number;
  post_count: number;
  centroid_embedding: string | null;
  has_location: boolean;
  location_name: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  h3_index_res4: string | null;
  h3_index_res6: string | null;
  h3_index_res8: string | null;
  earliest_post_at: string | null;
  latest_post_at: string | null;
  batch_id: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface Post {
  id: string;
  x_post_id: string;
  author_id: string;
  author_username: string | null;
  author_followers: number | null;
  author_verified: boolean | null;
  account_created_at: string | null;
  content: string;
  media_urls: string[] | null;
  likes: number | null;
  retweets: number | null;
  replies: number | null;
  posted_at: string;
  embedding: string | null;
  quality_score: number | null;
  quality_passed: boolean | null;
  ingested_at: string;
  batch_id: string | null;
}

export interface EventHistory {
  id: string;
  event_id: string;
  version: number;
  title: string | null;
  summary: string | null;
  post_count: number | null;
  changed_at: string;
  change_type: string | null;
}

export interface EventPostWithDetails {
  event_id?: string;
  post_id?: string;
  similarity_score: number | null;
  post: Post | null;
}

export interface EventWithPosts extends Event {
  event_posts?: EventPostWithDetails[];
  event_history?: EventHistory[];
}

// Filter Types

export interface EventFilters {
  searchQuery?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  eventTypes?: string[];
  hasLocation?: boolean;
  model?: string;
}

// Database Schema Type (for Supabase client)

export interface Database {
  public: {
    Tables: {
      monitor_config: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          x_query: string;
          quality_config: Record<string, unknown>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['monitor_config']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['monitor_config']['Insert']>;
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, 'id' | 'ingested_at'>;
        Update: Partial<Database['public']['Tables']['posts']['Insert']>;
      };
      batches: {
        Row: {
          id: string;
          status: string;
          posts_ingested: number;
          posts_passed_quality: number;
          clusters_created: number;
          started_at: string | null;
          completed_at: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['batches']['Row'],
          'id' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['batches']['Insert']>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      event_posts: {
        Row: {
          event_id: string;
          post_id: string;
          similarity_score: number | null;
        };
        Insert: Database['public']['Tables']['event_posts']['Row'];
        Update: Partial<Database['public']['Tables']['event_posts']['Insert']>;
      };
      event_history: {
        Row: EventHistory;
        Insert: Omit<EventHistory, 'id' | 'changed_at'>;
        Update: Partial<Database['public']['Tables']['event_history']['Insert']>;
      };
    };
  };
}
