'use client';

import { useState, useEffect } from 'react';
import { Target, BarChart2 } from 'lucide-react';
import Card from '@/components/shared/Card';
import Button from '@/components/shared/Button';
import { useSearchParams } from 'next/navigation';
import { 
  getBusinessGoalsAction, 
  addGoalAction, 
  deleteGoalAction, 
  getBusinessKPIsAction, 
  addKPIAction, 
  deleteKPIAction 
} from '@/app/actions/serverActions';

interface Goal {
  id: string;
  name: string;
  description: string | null;
  status: string;
  targetDate: Date | null;
}

interface KPI {
  id: string;
  name: string;
  description: string | null;
  target: string | null;
  current: string | null;
  unit: string | null;
}

export default function GoalsPage() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId') || '';
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [kpis, setKPIs] = useState<KPI[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingKPI, setIsAddingKPI] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', description: '' });
  const [newKPI, setNewKPI] = useState({ name: '', description: '', target: '', current: '', unit: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) {
      setError('No business selected');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        // Load goals
        const goalsResult = await getBusinessGoalsAction(businessId);
        if (goalsResult.success) {
          setGoals(goalsResult.goals);
        }

        // Load KPIs
        const kpisResult = await getBusinessKPIsAction(businessId);
        if (kpisResult.success) {
          setKPIs(kpisResult.kpis);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [businessId]);

  const handleAddGoal = async () => {
    if (newGoal.name.trim() && businessId) {
      try {
        const result = await addGoalAction(businessId, newGoal);
        if (result.success) {
          setGoals([result.goal, ...goals]);
          setNewGoal({ name: '', description: '' });
        } else {
          setError(result.error || 'Failed to add goal');
        }
      } catch (error) {
        console.error('Error adding goal:', error);
        setError('An unexpected error occurred');
      }
      setIsAddingGoal(false);
    }
  };

  const handleAddKPI = async () => {
    if (newKPI.name.trim() && businessId) {
      try {
        const result = await addKPIAction(businessId, newKPI);
        if (result.success) {
          setKPIs([result.kpi, ...kpis]);
          setNewKPI({ name: '', description: '', target: '', current: '', unit: '' });
        } else {
          setError(result.error || 'Failed to add KPI');
        }
      } catch (error) {
        console.error('Error adding KPI:', error);
        setError('An unexpected error occurred');
      }
      setIsAddingKPI(false);
    }
  };

  const handleRemoveGoal = async (id: string) => {
    try {
      const result = await deleteGoalAction(id);
      if (result.success) {
        setGoals(goals.filter(goal => goal.id !== id));
      } else {
        setError(result.error || 'Failed to delete goal');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      setError('An unexpected error occurred');
    }
  };

  const handleRemoveKPI = async (id: string) => {
    try {
      const result = await deleteKPIAction(id);
      if (result.success) {
        setKPIs(kpis.filter(kpi => kpi.id !== id));
      } else {
        setError(result.error || 'Failed to delete KPI');
      }
    } catch (error) {
      console.error('Error deleting KPI:', error);
      setError('An unexpected error occurred');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  if (!businessId) {
    return <div className="text-center">Please select a business</div>;
  }

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
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{goal.name}</p>
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {goal.status.replace('_', ' ')}
                      </span>
                    </div>
                    {goal.description && (
                      <p className="text-xs text-gray-500 truncate">{goal.description}</p>
                    )}
                    {goal.targetDate && (
                      <p className="text-xs text-gray-500">
                        Target: {new Date(goal.targetDate).toLocaleDateString()}
                      </p>
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
                    <div className="flex items-center gap-2 mt-1">
                      {kpi.current && (
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                          Current: {kpi.current}{kpi.unit ? ` ${kpi.unit}` : ''}
                        </span>
                      )}
                      {kpi.target && (
                        <span className="text-xs bg-green-100 px-2 py-0.5 rounded text-green-700">
                          Target: {kpi.target}{kpi.unit ? ` ${kpi.unit}` : ''}
                        </span>
                      )}
                    </div>
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
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={newKPI.current}
                        onChange={(e) => setNewKPI({ ...newKPI, current: e.target.value })}
                        placeholder="Current value"
                        className="text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
                      />
                      <input
                        type="text"
                        value={newKPI.target}
                        onChange={(e) => setNewKPI({ ...newKPI, target: e.target.value })}
                        placeholder="Target value"
                        className="text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
                      />
                      <input
                        type="text"
                        value={newKPI.unit}
                        onChange={(e) => setNewKPI({ ...newKPI, unit: e.target.value })}
                        placeholder="Unit (e.g. %)"
                        className="text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 self-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingKPI(false);
                        setNewKPI({ name: '', description: '', target: '', current: '', unit: '' });
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