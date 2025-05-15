'use client';

import { useState } from 'react';
import Card from "@obsidian/ui/Card";
import Heading from "@obsidian/ui/Heading";
import Button from "@obsidian/ui/Button";
import Badge from "@obsidian/ui/Badge";

interface Tool {
  name: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

export default function ToolAccess() {
  const [tools] = useState<Tool[]>([
    {
      name: 'Google Analytics',
      description: 'Access to website analytics and user behavior data',
      status: 'pending',
      requestedAt: '2024-03-15'
    },
    {
      name: 'Google Ads',
      description: 'Access to advertising campaign data and performance metrics',
      status: 'approved',
      requestedAt: '2024-03-10'
    },
    {
      name: 'Meta Business Manager',
      description: 'Access to Facebook and Instagram business data',
      status: 'rejected',
      requestedAt: '2024-03-05'
    }
  ]);

  const getStatusColor = (status: Tool['status']) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <Card.Header>
        <Heading level={2}>Tool Access Requests</Heading>
      </Card.Header>
      <Card.Body>
        <div className="space-y-4">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="space-y-1">
                <h3 className="font-medium">{tool.name}</h3>
                <p className="text-sm text-gray-500">{tool.description}</p>
                <p className="text-xs text-gray-400">
                  Requested on {new Date(tool.requestedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={getStatusColor(tool.status)}>
                  {tool.status.charAt(0).toUpperCase() + tool.status.slice(1)}
                </Badge>
                {tool.status === 'pending' && (
                  <Button variant="outline" size="sm">
                    Review
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
} 