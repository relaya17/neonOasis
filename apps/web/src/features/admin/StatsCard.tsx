import { Card, CardContent, Typography } from '@mui/material';

interface StatsCardProps {
  title: string;
  value: string | number;
  color: string;
  subtitle?: string;
}

/** כרטיס סטטיסטיקה — גבול צבעוני, עיצוב ניאון */
export function StatsCard({ title, value, color, subtitle }: StatsCardProps) {
  return (
    <Card
      sx={{
        borderLeft: `6px solid ${color}`,
        borderRadius: '10px',
        bgcolor: 'rgba(26,26,26,0.9)',
        boxShadow: `0 0 20px ${color}22`,
        '&:hover': { boxShadow: `0 0 28px ${color}44` },
      }}
    >
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
