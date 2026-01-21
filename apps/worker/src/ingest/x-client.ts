import { config } from '../config.js';
import { recentSearchRateLimiter, fullArchiveRateLimiter } from './rate-limiter.js';
import type { XPost, XUser, XSearchParams, XSearchResponse } from '@event-monitor/shared';

const X_API_BASE = 'https://api.twitter.com/2';

export class XApiClient {
  private bearerToken: string;

  constructor() {
    this.bearerToken = config.xApi.bearerToken;
  }

  /**
   * Search recent posts (last 7 days) using X API v2
   */
  async searchRecentPosts(params: XSearchParams): Promise<XSearchResponse> {
    await recentSearchRateLimiter.acquire();

    const searchParams = new URLSearchParams({
      query: params.query,
      max_results: String(params.maxResults),
      'tweet.fields': 'id,text,author_id,created_at,public_metrics,attachments',
      'user.fields': 'id,username,public_metrics,verified,created_at',
      expansions: 'author_id,attachments.media_keys',
      'media.fields': 'url,preview_image_url,type',
    });

    if (params.sinceId) {
      searchParams.set('since_id', params.sinceId);
    }
    if (params.startTime) {
      searchParams.set('start_time', params.startTime);
    }

    const response = await fetch(
      `${X_API_BASE}/tweets/search/recent?${searchParams}`,
      {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`X API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return this.transformResponse(data);
  }

  /**
   * Search full archive (Pro tier) using X API v2
   */
  async searchFullArchive(params: XSearchParams): Promise<XSearchResponse> {
    await fullArchiveRateLimiter.acquire();

    const searchParams = new URLSearchParams({
      query: params.query,
      max_results: String(params.maxResults),
      'tweet.fields': 'id,text,author_id,created_at,public_metrics,attachments',
      'user.fields': 'id,username,public_metrics,verified,created_at',
      expansions: 'author_id,attachments.media_keys',
      'media.fields': 'url,preview_image_url,type',
    });

    if (params.sinceId) {
      searchParams.set('since_id', params.sinceId);
    }
    if (params.startTime) {
      searchParams.set('start_time', params.startTime);
    }
    if (params.endTime) {
      searchParams.set('end_time', params.endTime);
    }

    const response = await fetch(
      `${X_API_BASE}/tweets/search/all?${searchParams}`,
      {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`X API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return this.transformResponse(data);
  }

  /**
   * Get user details for quality filtering
   */
  async getUsers(userIds: string[]): Promise<Map<string, XUser>> {
    await recentSearchRateLimiter.acquire();

    const users = new Map<string, XUser>();
    const chunks = this.chunkArray(userIds, 100); // API limit: 100 users per request

    for (const chunk of chunks) {
      const params = new URLSearchParams({
        ids: chunk.join(','),
        'user.fields': 'id,username,public_metrics,verified,created_at',
      });

      const response = await fetch(`${X_API_BASE}/users?${params}`, {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch users: ${response.status}`);
        continue;
      }

      const data = await response.json();

      for (const user of data.data ?? []) {
        users.set(user.id, {
          id: user.id,
          username: user.username,
          followersCount: user.public_metrics?.followers_count ?? 0,
          verified: user.verified ?? false,
          createdAt: user.created_at,
        });
      }
    }

    return users;
  }

  private transformResponse(data: any): XSearchResponse {
    const posts: XPost[] = [];
    const users = new Map<string, any>();
    const media = new Map<string, any>();

    // Index included users and media
    for (const user of data.includes?.users ?? []) {
      users.set(user.id, user);
    }
    for (const m of data.includes?.media ?? []) {
      media.set(m.media_key, m);
    }

    for (const tweet of data.data ?? []) {
      const author = users.get(tweet.author_id);
      const mediaUrls: string[] = [];

      // Extract media URLs
      if (tweet.attachments?.media_keys) {
        for (const key of tweet.attachments.media_keys) {
          const m = media.get(key);
          if (m?.url || m?.preview_image_url) {
            mediaUrls.push(m.url ?? m.preview_image_url);
          }
        }
      }

      posts.push({
        id: tweet.id,
        text: tweet.text,
        authorId: tweet.author_id,
        authorUsername: author?.username,
        createdAt: tweet.created_at,
        publicMetrics: {
          likeCount: tweet.public_metrics?.like_count ?? 0,
          retweetCount: tweet.public_metrics?.retweet_count ?? 0,
          replyCount: tweet.public_metrics?.reply_count ?? 0,
        },
        mediaUrls,
      });
    }

    return {
      posts,
      nextToken: data.meta?.next_token,
      resultCount: data.meta?.result_count ?? 0,
    };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export const xApiClient = new XApiClient();
