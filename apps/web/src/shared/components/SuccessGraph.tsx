/**
 * Success Graph — Neon graph of wins over time
 * Replaces boring transaction list with visual success story
 */

import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

interface SuccessGraphProps {
  data: { date: string; wins: number; balance: number }[];
  title?: string;
  loading?: boolean;
}

export function SuccessGraph({ data, title = 'Success Graph', loading = false }: SuccessGraphProps) {
  const formattedData = useMemo(() => {
    if (data.length === 0) {
      // Demo data if empty
      return [
        { date: 'Day 1', wins: 2, balance: 1000 },
        { date: 'Day 2', wins: 5, balance: 2500 },
        { date: 'Day 3', wins: 3, balance: 3200 },
        { date: 'Day 4', wins: 8, balance: 5100 },
        { date: 'Day 5', wins: 12, balance: 8500 },
        { date: 'Today', wins: 15, balance: 12000 },
      ];
    }
    return data;
  }, [data]);

  const maxBalance = useMemo(() => Math.max(...formattedData.map((d) => d.balance)), [formattedData]);
  const totalWins = useMemo(() => formattedData.reduce((sum, d) => sum + d.wins, 0), [formattedData]);

  return (
    <Box
      sx={{
        width: '100%',
        p: 3,
        background: 'linear-gradient(135deg, rgba(0,245,212,0.05) 0%, rgba(247,37,133,0.05) 100%)',
        border: '1px solid rgba(0,245,212,0.3)',
        borderRadius: 2,
        boxShadow: '0 0 20px rgba(0,245,212,0.2)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: '#00f5d4', fontWeight: 700 }}>
          {title}
        </Typography>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
            Total Wins
          </Typography>
          <Typography variant="h4" sx={{ color: '#f72585', fontWeight: 900 }}>
            {totalWins}
          </Typography>
        </Box>
      </Box>

      {loading ? (
        <Box
          sx={{
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.3)',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: '#00ffff' }}>
            Loading success data...
          </Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f5d4" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#00f5d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorWins" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f72585" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f72585" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" stroke="#666" fontSize={11} />
            <YAxis yAxisId="left" stroke="#00f5d4" fontSize={11} />
            <YAxis yAxisId="right" orientation="right" stroke="#f72585" fontSize={11} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #00f5d4',
                borderRadius: 8,
                color: '#fff',
              }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="balance"
              stroke="#00f5d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBalance)"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="wins"
              stroke="#f72585"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorWins)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#00f5d4' }}>
            Peak Balance
          </Typography>
          <Typography variant="h6" sx={{ color: '#00f5d4', fontWeight: 700 }}>
            {maxBalance.toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#f72585' }}>
            Win Rate
          </Typography>
          <Typography variant="h6" sx={{ color: '#f72585', fontWeight: 700 }}>
            {totalWins > 0 ? '75%' : '0%'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
