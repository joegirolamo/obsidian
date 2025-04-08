'use client';

import { useState } from 'react';
import Badge from '../packages/ui/src/components/Badge';
import Button from '../packages/ui/src/components/Button';

interface Score {
  category: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  lastUpdated: string;
}

export default function Scorecard() {
  const [scores] = useState<Score[]>([
    {
      category: 'Digital Presence',
      score: 85,
      maxScore: 100,
      status: 'good',
      lastUpdated: '2024-03-15'
    },
    {
      category: 'Marketing Performance',
      score: 92,
      maxScore: 100,
      status: 'excellent',
      lastUpdated: '2024-03-14'
    },
    {
      category: 'Customer Engagement',
      score: 78,
      maxScore: 100,
      status: 'fair',
      lastUpdated: '2024-03-13'
    }
  ]);

  const getStatusColor = (status: Score['status']) => {
    switch (status) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'primary';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {scores.map((score) => (
        <div key={score.category} className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="heading-2">{score.category}</h2>
              <Badge variant={getStatusColor(score.status)}>
                {score.status}
              </Badge>
            </div>
          </div>
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {score.score}/{score.maxScore}
              </div>
              <Button variant="secondary">View Details</Button>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Last updated: {score.lastUpdated}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 