import { GrokClient } from '../grok/client.js';
import type { XPost, XUser, QualityConfig, QualityResult } from '@event-monitor/shared';

/**
 * Calculate days since a given date
 */
function daysSince(dateString: string | undefined): number {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Score a post's quality based on multiple signals
 */
export async function scorePostQuality(
  post: XPost,
  author: XUser | undefined,
  config: QualityConfig,
  grokClient: GrokClient
): Promise<QualityResult> {
  let score = 0;

  // Engagement score (0-0.3)
  const engagement =
    post.publicMetrics.likeCount +
    post.publicMetrics.retweetCount +
    post.publicMetrics.replyCount;

  const engagementScore = Math.min(engagement / config.minEngagement, 1) * 0.3;
  score += engagementScore;

  // Account score (0-0.3)
  if (author) {
    const accountAge = daysSince(author.createdAt);

    // Follower score (0-0.15)
    const followerScore =
      Math.min(author.followersCount / config.minFollowers, 1) * 0.15;
    score += followerScore;

    // Account age score (0-0.1)
    const ageScore =
      Math.min(accountAge / config.minAccountAgeDays, 1) * 0.1;
    score += ageScore;

    // Verification bonus (0-0.05)
    if (author.verified) {
      score += 0.05;
    }
  }

  // Content score via Grok (0-0.4)
  if (config.enableContentScoring) {
    try {
      const contentScore = await grokClient.scoreContent(post.text);
      score += contentScore * 0.4;
    } catch (error) {
      console.error('Error scoring content:', error);
      // Default score if content scoring fails
      score += 0.2;
    }
  } else {
    // Default if content scoring is disabled
    score += 0.2;
  }

  return {
    score,
    passed: score >= config.minContentScore,
    breakdown: {
      engagement: engagementScore,
      account: author
        ? Math.min(author.followersCount / config.minFollowers, 1) * 0.15 +
          Math.min(daysSince(author.createdAt) / config.minAccountAgeDays, 1) * 0.1 +
          (author.verified ? 0.05 : 0)
        : 0,
      content: config.enableContentScoring ? score - engagementScore - 0.3 : 0.2,
    },
  };
}

/**
 * Filter posts by quality
 */
export async function filterPostsByQuality(
  posts: XPost[],
  users: Map<string, XUser>,
  config: QualityConfig,
  grokClient: GrokClient
): Promise<Array<{ post: XPost; quality: QualityResult }>> {
  const results: Array<{ post: XPost; quality: QualityResult }> = [];

  for (const post of posts) {
    const author = users.get(post.authorId);
    const quality = await scorePostQuality(post, author, config, grokClient);

    if (quality.passed) {
      results.push({ post, quality });
    }
  }

  return results;
}
