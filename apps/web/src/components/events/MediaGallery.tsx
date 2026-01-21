'use client';

import { Box, ImageList, ImageListItem } from '@mui/material';

interface MediaGalleryProps {
  urls: string[];
}

export function MediaGallery({ urls }: MediaGalleryProps) {
  if (urls.length === 0) {
    return null;
  }

  return (
    <ImageList cols={2} gap={8} sx={{ mt: 0 }}>
      {urls.slice(0, 6).map((url, index) => (
        <ImageListItem key={index}>
          <Box
            component="img"
            src={url}
            alt={`Media ${index + 1}`}
            sx={{
              width: '100%',
              height: 100,
              objectFit: 'cover',
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8,
              },
            }}
            onClick={() => window.open(url, '_blank')}
          />
        </ImageListItem>
      ))}
    </ImageList>
  );
}
