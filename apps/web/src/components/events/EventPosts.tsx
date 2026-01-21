'use client';

import { Box, Typography, Link, Chip } from '@mui/material';
import { FavoriteBorder, Repeat, ChatBubbleOutline } from '@mui/icons-material';
import type { EventPostWithDetails } from '@event-monitor/shared';

interface EventPostsProps {
  posts: EventPostWithDetails[];
}

export function EventPosts({ posts }: EventPostsProps) {
  if (posts.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No posts available
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {posts.slice(0, 5).map((ep) => {
        const post = ep.post;
        if (!post) return null;

        return (
          <Box
            key={post.id}
            sx={{
              p: 1.5,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="body2" fontWeight={600}>
                @{post.author_username ?? 'unknown'}
              </Typography>
              {ep.similarity_score !== null && (
                <Chip
                  label={`${Math.round(ep.similarity_score * 100)}% match`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              )}
            </Box>

            <Typography variant="body2" sx={{ mb: 1 }}>
              {post.content}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                color: 'text.secondary',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FavoriteBorder sx={{ fontSize: 14 }} />
                <Typography variant="caption">{post.likes ?? 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Repeat sx={{ fontSize: 14 }} />
                <Typography variant="caption">{post.retweets ?? 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ChatBubbleOutline sx={{ fontSize: 14 }} />
                <Typography variant="caption">{post.replies ?? 0}</Typography>
              </Box>

              {post.x_post_id && (
                <Link
                  href={`https://x.com/i/status/${post.x_post_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ ml: 'auto', fontSize: '0.75rem' }}
                >
                  View on X
                </Link>
              )}
            </Box>
          </Box>
        );
      })}

      {posts.length > 5 && (
        <Typography variant="caption" color="text.secondary">
          +{posts.length - 5} more posts
        </Typography>
      )}
    </Box>
  );
}
