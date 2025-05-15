'use client';

import { useState } from 'react';
import Badge from "@obsidian/ui/Badge";
import Button from "@obsidian/ui/Button";

interface Opportunity {
  id: string;
  title: string;
  description: string;
  category: 'marketing' | 'sales' | 'operations' | 'technology';
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'completed';
  dueDate: string;
}

export default function Opportunities() {
  const [opportunities] = useState<Opportunity[]>([
    {
      id: '1',
      title: 'Implement Social Media Strategy',
      description: 'Develop and execute a comprehensive social media marketing strategy to increase brand awareness and engagement.',
      category: 'marketing',
      priority: 'high',
      status: 'open',
      dueDate: '2024-04-15'
    },
    {
      id: '2',
      title: 'Optimize Website Performance',
      description: 'Improve website loading speed and user experience to increase conversion rates.',
      category: 'technology',
      priority: 'medium',
      status: 'in-progress',
      dueDate: '2024-04-30'
    },
    {
      id: '3',
      title: 'Expand Sales Team',
      description: 'Hire and train additional sales representatives to increase market coverage.',
      category: 'sales',
      priority: 'high',
      status: 'open',
      dueDate: '2024-05-15'
    }
  ]);

  const getPriorityColor = (priority: Opportunity['priority']) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
    }
  };

  const getStatusColor = (status: Opportunity['status']) => {
    switch (status) {
      case 'open':
        return 'primary';
      case 'in-progress':
        return 'warning';
      case 'completed':
        return 'success';
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
          {opportunities.map((opportunity) => (
        <div key={opportunity.id} className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="heading-2">{opportunity.title}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant={getPriorityColor(opportunity.priority)}>
                  {opportunity.priority}
                  </Badge>
                  <Badge variant={getStatusColor(opportunity.status)}>
                  {opportunity.status}
                  </Badge>
                </div>
              </div>
                </div>
          <div className="card-body">
            <p className="text-gray-600 mb-4">{opportunity.description}</p>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Due: {opportunity.dueDate}
              </div>
              <Button variant="secondary">View Details</Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 