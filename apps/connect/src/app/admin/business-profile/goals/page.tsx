'use client';

import { useState, useEffect } from 'react';
import { Target, BarChart2 } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useSearchParams } from 'next/navigation';
import { 
  getBusinessGoalsAction, 
  addGoalAction, 
  deleteGoalAction, 
  getBusinessKPIsAction, 
  addKPIAction, 
  deleteKPIAction,
  updateGoalAction,
  updateKPIAction
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
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingKPIId, setEditingKPIId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<typeof newGoal | null>(null);
  const [editingKPI, setEditingKPI] = useState<typeof newKPI | null>(null);
  const [newGoal, setNewGoal] = useState({ 
    name: '', 
    description: '', 
    status: 'IN_PROGRESS' as const, 
    targetDate: undefined as Date | undefined 
  });
  const [newKPI, setNewKPI] = useState({ 
    name: '', 
    description: '', 
    target: '', 
    current: '', 
    unit: '' 
  });
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
          setNewGoal({ name: '', description: '', status: 'IN_PROGRESS', targetDate: undefined });
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

  const handleEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditingGoal({
      name: goal.name,
      description: goal.description || '',
      status: goal.status as typeof newGoal.status,
      targetDate: goal.targetDate || undefined
    });
  };

  const handleEditKPI = (kpi: KPI) => {
    setEditingKPIId(kpi.id);
    setEditingKPI({
      name: kpi.name,
      description: kpi.description || '',
      target: kpi.target || '',
      current: kpi.current || '',
      unit: kpi.unit || ''
    });
  };

  const handleUpdateGoal = async (goalId: string, formData: typeof newGoal) => {
    console.log('Updating goal with data:', formData);
    try {
      const result = await updateGoalAction(goalId, {
        name: formData.name,
        description: formData.description || undefined,
        status: formData.status,
        targetDate: formData.targetDate
      });

      if (result.success) {
        console.log('Goal update successful:', result.goal);
        setGoals(goals.map(g => g.id === goalId ? result.goal : g));
        setEditingGoalId(null);
        setEditingGoal(null);
      } else {
        console.error('Goal update failed:', result.error);
        setError(result.error || 'Failed to update goal');
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      setError('An unexpected error occurred');
    }
  };

  const handleUpdateKPI = async (kpiId: string, formData: typeof newKPI) => {
    console.log('Updating KPI with data:', formData);
    try {
      const result = await updateKPIAction(kpiId, {
        name: formData.name,
        description: formData.description || undefined,
        target: formData.target || undefined,
        current: formData.current || undefined,
        unit: formData.unit || undefined
      });

      if (result.success) {
        console.log('KPI update successful:', result.kpi);
        setKPIs(kpis.map(k => k.id === kpiId ? result.kpi : k));
        setEditingKPIId(null);
        setEditingKPI(null);
      } else {
        console.error('KPI update failed:', result.error);
        setError(result.error || 'Failed to update KPI');
      }
    } catch (error) {
      console.error('Error updating KPI:', error);
      setError('An unexpected error occurred');
    }
  };

  const GoalForm = ({ 
    goal, 
    onSave, 
    onCancel, 
    isNew = false 
  }: { 
    goal: typeof newGoal | Goal, 
    onSave: (formData: typeof newGoal) => void, 
    onCancel: () => void,
    isNew?: boolean 
  }) => {
    const [formData, setFormData] = useState(isNew ? newGoal : {
      name: goal.name,
      description: goal.description || '',
      status: goal.status as typeof newGoal.status,
      targetDate: goal.targetDate || undefined
    });

    const handleSave = () => {
      console.log('Saving goal form data:', formData);
      onSave(formData);
    };

    return (
      <div className="flex-1 flex flex-col gap-2">
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Goal name"
          className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
        />
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Goal description (optional)"
          className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
          rows={2}
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof newGoal.status })}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
          >
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="NOT_STARTED">Not Started</option>
          </select>
          <input
            type="date"
            value={formData.targetDate ? new Date(formData.targetDate).toISOString().split('T')[0] : ''}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value ? new Date(e.target.value) : undefined })}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
          />
        </div>
        <div className="flex gap-2 self-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isNew && !formData.name.trim()}
          >
            Save
          </Button>
        </div>
      </div>
    );
  };

  const KPIForm = ({ 
    kpi, 
    onSave, 
    onCancel, 
    isNew = false 
  }: { 
    kpi: typeof newKPI | KPI, 
    onSave: (formData: typeof newKPI) => void, 
    onCancel: () => void,
    isNew?: boolean 
  }) => {
    const [formData, setFormData] = useState(isNew ? newKPI : {
      name: kpi.name,
      description: kpi.description || '',
      target: kpi.target || '',
      current: kpi.current || '',
      unit: kpi.unit || ''
    });

    const handleSave = () => {
      console.log('Saving KPI form data:', formData);
      onSave(formData);
    };

    return (
      <div className="flex-1 flex flex-col gap-2">
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="KPI name"
          className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
        />
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="KPI description (optional)"
          className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
          rows={2}
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            value={formData.current || ''}
            onChange={(e) => setFormData({ ...formData, current: e.target.value })}
            placeholder="Current value"
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
          />
          <input
            type="text"
            value={formData.target || ''}
            onChange={(e) => setFormData({ ...formData, target: e.target.value })}
            placeholder="Target value"
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
          />
          <input
            type="text"
            value={formData.unit || ''}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            placeholder="Unit (e.g. %)"
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
          />
        </div>
        <div className="flex gap-2 self-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isNew && !formData.name.trim()}
          >
            Save
          </Button>
        </div>
      </div>
    );
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
                    {editingGoalId === goal.id ? (
                      <div className="flex items-start gap-2">
                        <GoalForm
                          goal={goal}
                          onSave={(formData) => handleUpdateGoal(goal.id, formData)}
                          onCancel={() => {
                            setEditingGoalId(null);
                            setEditingGoal(null);
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{goal.name}</p>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            goal.status === 'NOT_STARTED' 
                              ? 'bg-red-100 text-red-800'
                              : goal.status === 'IN_PROGRESS'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
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
                      </>
                    )}
                  </div>
                  {editingGoalId !== goal.id && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditGoal(goal)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveGoal(goal.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {isAddingGoal && (
                <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <GoalForm
                    goal={newGoal}
                    onSave={(formData) => {
                      setIsAddingGoal(false);
                      handleAddGoal();
                    }}
                    onCancel={() => {
                      setIsAddingGoal(false);
                      setNewGoal({ name: '', description: '', status: 'IN_PROGRESS', targetDate: undefined });
                    }}
                    isNew
                  />
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
                    {editingKPIId === kpi.id ? (
                      <div className="flex items-start gap-2">
                        <KPIForm
                          kpi={kpi}
                          onSave={(formData) => handleUpdateKPI(kpi.id, formData)}
                          onCancel={() => {
                            setEditingKPIId(null);
                            setEditingKPI(null);
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{kpi.name}</p>
                          {kpi.target && kpi.current && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              {kpi.current}/{kpi.target} {kpi.unit}
                            </span>
                          )}
                        </div>
                        {kpi.description && (
                          <p className="text-xs text-gray-500 truncate">{kpi.description}</p>
                        )}
                      </>
                    )}
                  </div>
                  {editingKPIId !== kpi.id && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditKPI(kpi)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveKPI(kpi.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {isAddingKPI && (
                <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <KPIForm
                    kpi={newKPI}
                    onSave={(formData) => {
                      setIsAddingKPI(false);
                      handleAddKPI();
                    }}
                    onCancel={() => {
                      setIsAddingKPI(false);
                      setNewKPI({ name: '', description: '', target: '', current: '', unit: '' });
                    }}
                    isNew
                  />
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
} 