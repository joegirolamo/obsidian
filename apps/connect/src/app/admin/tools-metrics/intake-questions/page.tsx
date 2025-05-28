'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { MessageSquare, Plus, Minus } from 'lucide-react';
import { templateQuestions, categories } from './templateQuestions';
import { QuestionType } from './types';

interface Question {
  id: string;
  question: string;
  type: QuestionType;
  options: string[];
  area: string;
  isSelected: boolean;
  order: number;
  isActive: boolean;
  hasAnswer: boolean;
  latestAnswer: string;
  answeredBy: string;
}

interface TemplateQuestion {
  question: string;
  type: QuestionType;
  options: string[];
  area: string;
}

export default function IntakeQuestionsPage() {
  const { data: session } = useSession();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [isAddingCustomQuestion, setIsAddingCustomQuestion] = useState(false);
  const [newCustomQuestion, setNewCustomQuestion] = useState('');
  const [newCustomQuestionCategory, setNewCustomQuestionCategory] = useState('Other');
  const [newCustomQuestionType, setNewCustomQuestionType] = useState<QuestionType>('BOOLEAN');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchQuestions();
    }
  }, [session]);

  const fetchQuestions = async () => {
    try {
      // Get the user's business ID first
      const userResponse = await fetch('/api/user', {
        credentials: 'include', // Ensure cookies are sent with the request
      });
      if (!userResponse.ok) throw new Error('Failed to fetch user data');
      const userData = await userResponse.json();
      
      if (!userData.managedBusinesses?.[0]?.id) {
        throw new Error('No business found');
      }

      const response = await fetch(`/api/intake-questions?businessId=${userData.managedBusinesses[0].id}`, {
        credentials: 'include', // Ensure cookies are sent with the request
      });
      if (!response.ok) throw new Error('Failed to fetch questions');
      const data = await response.json();
      
      // Transform the data to match our Question interface
      const transformedQuestions = data.map((q: any) => ({
        id: q.id,
        question: q.question,
        type: q.type,
        options: q.options,
        area: q.area || 'Other',
        isSelected: true, // Questions from the API are already selected
        order: q.order,
        isActive: q.isActive,
        hasAnswer: q.hasAnswer,
        latestAnswer: q.latestAnswer,
        answeredBy: q.answeredBy
      }));
      
      setSelectedQuestions(transformedQuestions);
      setQuestions([]); // Clear the questions list since they're all selected
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setIsLoading(false);
    }
  };

  const handleAddCustomQuestion = async () => {
    if (!newCustomQuestion.trim()) return;

    try {
      // Get the businessId from URL searchParams
      const urlParams = new URLSearchParams(window.location.search);
      const businessId = urlParams.get('businessId');
      
      if (!businessId) {
        console.error('No businessId found in URL');
      }
      
      console.log(`Adding custom question for business: ${businessId || 'not specified'}`);

      const response = await fetch('/api/intake-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          question: newCustomQuestion.trim(),
          type: newCustomQuestionType,
          options: [],
          area: newCustomQuestionCategory,
          businessId: businessId, // This will be null if not in URL, which is fine with our updated API
          isActive: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create question:', errorData);
        throw new Error(errorData.error || 'Failed to create question');
      }

      const newQuestion = await response.json();
      setSelectedQuestions([...selectedQuestions, {
        ...newQuestion,
        isSelected: true,
        hasAnswer: false,
        latestAnswer: '',
        answeredBy: '',
      }]);

      setNewCustomQuestion('');
      setNewCustomQuestionCategory('Other');
      setNewCustomQuestionType('BOOLEAN');
      setIsAddingCustomQuestion(false);
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Failed to create question. Please try again.');
    }
  };

  const handleToggleQuestion = async (question: Question | TemplateQuestion) => {
    try {
      if ('id' in question) {
        // If the question has an answer and we're trying to deactivate it, prevent that
        if (question.hasAnswer && question.isActive) {
          alert('Cannot deactivate a question that has been answered');
          return;
        }

        // Handle existing question toggle
        const response = await fetch('/api/intake-questions', {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json' 
          },
          credentials: 'include',
          body: JSON.stringify({
            id: question.id,
            isActive: !question.isActive
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to update question:', errorData);
          throw new Error(errorData.error || 'Failed to update question');
        }

        const updatedQuestion = await response.json();
        // If the question was deactivated, remove it from the list
        if (!updatedQuestion.isActive) {
          setSelectedQuestions(prev => prev.filter(q => q.id !== question.id));
        } else {
          setSelectedQuestions(prev =>
            prev.map(q => (q.id === question.id ? updatedQuestion : q))
          );
        }
    } else {
        // Handle template question toggle
        // Get the businessId from URL searchParams
        const urlParams = new URLSearchParams(window.location.search);
        const businessId = urlParams.get('businessId');
        
        if (!businessId) {
          console.log('No businessId found in URL when adding template question');
        }
        
        console.log(`Adding template question for business: ${businessId || 'not specified'}`);
        
        const newQuestion = {
          question: question.question,
          type: question.type,
          options: question.options,
          area: question.area,
          businessId: businessId, // Include businessId from URL
          order: selectedQuestions.length,
          isActive: true
        };

        const response = await fetch('/api/intake-questions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          credentials: 'include',
          body: JSON.stringify(newQuestion)
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to add question:', errorData);
          throw new Error(errorData.error || 'Failed to add question');
        }

        const addedQuestion = await response.json();
        setSelectedQuestions(prev => [...prev, addedQuestion]);
      }
    } catch (error) {
      console.error('Error toggling question:', error);
      alert('Failed to update question. Please try again.');
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    try {
      const response = await fetch(`/api/intake-questions/${questionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete question');
      
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== questionId));
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, isSelected: false } : q
    ));
    } catch (error) {
      console.error('Error removing question:', error);
    }
  };

  const filteredQuestions = selectedCategory === 'All'
    ? questions
    : questions.filter(q => q.area === selectedCategory);

  // Filter out template questions that have already been added
  const filteredTemplateQuestions = (selectedCategory === 'All'
    ? templateQuestions
    : templateQuestions.filter(q => q.area === selectedCategory)
  ).filter(templateQ => 
    !selectedQuestions.some(selectedQ => 
      selectedQ.question === templateQ.question && selectedQ.area === templateQ.area
    )
  );

  const QuestionCard = ({ question, onToggle }: { question: Question | TemplateQuestion; onToggle: (question: Question | TemplateQuestion) => void }) => {
    const isTemplateQuestion = !('id' in question);
    const hasAnswer = !isTemplateQuestion && (question as Question).hasAnswer;
    const isActive = !isTemplateQuestion && (question as Question).isActive;

    // Convert type to title case
    const formatType = (type: string) => {
      return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    };

    return (
      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{question.question}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-500 truncate">{question.area}</p>
            {isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                {formatType(question.type)}
              </span>
            )}
            {hasAnswer && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Answered
              </span>
            )}
          </div>
          {hasAnswer && (
            <p className="text-xs text-gray-600 mt-1">
              <span className="inline-block bg-white p-2 rounded-md">
                Answer: {(question as Question).latestAnswer}
              </span>
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggle(question)}
          className="ml-2"
        >
          {!isTemplateQuestion && (question as Question).isActive ? (
            <Minus className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Selected Questions Section */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Client Intake Questions</h2>
              <p className="text-sm text-gray-500 mt-1">
                These questions will be shown to clients in their portal
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingCustomQuestion(true)}
            >
              Add Custom Question
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : selectedQuestions.length === 0 && !isAddingCustomQuestion ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400" />
              <p className="mt-4 text-sm text-gray-500">Add questions to request here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedQuestions.map((question) => (
                <QuestionCard key={question.id} question={question} onToggle={handleToggleQuestion} />
              ))}

              {isAddingCustomQuestion && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={newCustomQuestion}
                      onChange={(e) => setNewCustomQuestion(e.target.value)}
                      placeholder="Enter your custom question..."
                      className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
                    />
                    <select
                      value={newCustomQuestionCategory}
                      onChange={(e) => setNewCustomQuestionCategory(e.target.value)}
                      className="w-48 text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
                    >
                      {categories.filter(cat => cat !== 'All').map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                    <select
                      value={newCustomQuestionType}
                      onChange={(e) => setNewCustomQuestionType(e.target.value as QuestionType)}
                      className="w-32 text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
                    >
                      <option value="BOOLEAN">Yes/No</option>
                      <option value="TEXT">Text</option>
                      <option value="NUMBER">Number</option>
                      <option value="SELECT">Select</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingCustomQuestion(false);
                        setNewCustomQuestion('');
                        setNewCustomQuestionCategory('Other');
                        setNewCustomQuestionType('BOOLEAN');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddCustomQuestion}
                      disabled={!newCustomQuestion.trim()}
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

      {/* Template Questions Section */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Template Questions</h2>
              <p className="text-sm text-gray-500 mt-1">
                Select questions to add to the client intake
              </p>
            </div>
            <div className="relative inline-block w-48">
              <div 
                className="flex items-center justify-between p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedCategory}
                  </p>
                </div>
                <div className="ml-2">
                  <svg
                    className={`h-5 w-5 text-gray-500 transform transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    {categories.map((category) => (
                      <button
                        key={category}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsDropdownOpen(false);
                        }}
                      >
                      {category}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            {filteredTemplateQuestions.map((question, idx) => (
              <QuestionCard
                key={question.question + question.area}
                question={question}
                onToggle={handleToggleQuestion}
              />
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
} 