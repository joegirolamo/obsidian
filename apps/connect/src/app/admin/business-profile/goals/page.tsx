'use client';

import { useState } from 'react';
import { Target, BarChart2 } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface Goal {
  id: string;
  name: string;
  description: string;
}

interface KPI {
  id: string;
  name: string;
  description: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [kpis, setKPIs] = useState<KPI[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingKPI, setIsAddingKPI] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', description: '' });
  const [newKPI, setNewKPI] = useState({ name: '', description: '' });

  const handleAddGoal = () => {
    if (newGoal.name.trim()) {
      setGoals([...goals, { id: Date.now().toString(), ...newGoal }]);
      setNewGoal({ name: '', description: '' });
    }
    setIsAddingGoal(false);
  };

  const handleAddKPI = () => {
    if (newKPI.name.trim()) {
      setKPIs([...kpis, { id: Date.now().toString(), ...newKPI }]);
      setNewKPI({ name: '', description: '' });
    }
    setIsAddingKPI(false);
  };

  const handleRemoveGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  const handleRemoveKPI = (id: string) => {
    setKPIs(kpis.filter(kpi => kpi.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Business Goals Module */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Business Goals</h2>
              <p className="text-sm text-gray-500 mt-1">
                Define your business objectives and targets
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingGoal(true)}
            >
              Add Goal
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {goals.length === 0 && !isAddingGoal ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Target className="w-12 h-12 text-gray-400" />
              <p className="mt-4 text-sm text-gray-500">Add your first business goal to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {goals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{goal.name}</p>
                    {goal.description && (
                      <p className="text-xs text-gray-500 truncate">{goal.description}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveGoal(goal.id)}
                    className="ml-2"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {isAddingGoal && (
                <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      type="text"
                      value={newGoal.name}
                      onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                      placeholder="Goal name"
                      className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
                    />
                    <textarea
                      value={newGoal.description}
                      onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                      placeholder="Goal description (optional)"
                      className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 self-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingGoal(false);
                        setNewGoal({ name: '', description: '' });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddGoal}
                      disabled={!newGoal.name.trim()}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Metric KPIs Module */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Metric KPIs</h2>
              <p className="text-sm text-gray-500 mt-1">
                Track your key performance indicators
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingKPI(true)}
            >
              Add KPI
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {kpis.length === 0 && !isAddingKPI ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BarChart2 className="w-12 h-12 text-gray-400" />
              <p className="mt-4 text-sm text-gray-500">Add your first KPI to start tracking performance</p>
            </div>
          ) : (
            <div className="space-y-2">
              {kpis.map((kpi) => (
                <div key={kpi.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{kpi.name}</p>
                    {kpi.description && (
                      <p className="text-xs text-gray-500 truncate">{kpi.description}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveKPI(kpi.id)}
                    className="ml-2"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {isAddingKPI && (
                <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      type="text"
                      value={newKPI.name}
                      onChange={(e) => setNewKPI({ ...newKPI, name: e.target.value })}
                      placeholder="KPI name"
                      className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
                    />
                    <textarea
                      value={newKPI.description}
                      onChange={(e) => setNewKPI({ ...newKPI, description: e.target.value })}
                      placeholder="KPI description (optional)"
                      className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 self-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingKPI(false);
                        setNewKPI({ name: '', description: '' });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddKPI}
                      disabled={!newKPI.name.trim()}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
} 