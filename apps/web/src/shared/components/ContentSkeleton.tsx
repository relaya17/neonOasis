import { Box, Skeleton } from '@mui/material';

type ContentSkeletonProps = {
  rows?: number;
  rowHeight?: number;
};

/** Loading skeleton for feed/content — placeholder rows with neon-style pulse */
export function ContentSkeleton({ rows = 4, rowHeight = 140 }: ContentSkeletonProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={rowHeight}
          sx={{
            bgcolor: 'rgba(0, 255, 255, 0.08)',
            '&::after': {
              background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.12), transparent)',
            },
          }}
        />
      ))}
    </Box>
  );
}
