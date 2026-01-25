import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { QualityConfig } from '@event-monitor/shared';

// Load environment variables from root .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenvConfig({ path: resolve(__dirname, '../../../.env.local') });

// Environment variables
export const config = {
  // X API
  xApi: {
    bearerToken: process.env.X_API_BEARER_TOKEN!,
    apiKey: process.env.X_API_KEY!,
    apiSecret: process.env.X_API_SECRET!,
  },

  // Grok API
  grok: {
    apiKey: process.env.GROK_API_KEY!,
    baseUrl: 'https://api.x.ai/v1',
  },

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },

  // Mapbox
  mapbox: {
    geocodingToken: process.env.MAPBOX_GEOCODING_TOKEN!,
  },
};

// Quality filter configuration
export const qualityConfig: QualityConfig = {
  minEngagement: 5,           // Minimum likes + retweets + replies
  minFollowers: 100,          // Minimum follower count
  minAccountAgeDays: 30,      // Minimum account age in days
  requireVerified: false,     // Don't require verification
  enableContentScoring: true, // Use LLM for content quality
  minContentScore: 0.3,       // Minimum quality score to pass
};

// Clustering configuration
export const clusterConfig = {
  minClusterSize: 3,          // Minimum posts per cluster
  similarityThreshold: 0.75,  // Cosine similarity threshold
  maxClusters: 50,            // Maximum clusters per batch
  eventMatchThreshold: 0.85,  // Threshold for matching existing events
};

// Batch configuration
export const batchConfig = {
  maxPostsPerBatch: 1000,     // Maximum posts to fetch per batch
  retentionDays: 7,           // Days to keep data
};
