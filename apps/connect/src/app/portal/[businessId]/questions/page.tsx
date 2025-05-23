'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { NavigationButtons } from '../NavigationButtons';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';

type QuestionType = 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT';

interface Question {
  id: string;
  question: string;
  type: QuestionType;
  options: string[];
  area: string;
  order: number;
  savedAnswer: string;
}

interface GroupedQuestions {
  [key: string]: Question[];
}

export default function QuestionsPage() {
  const { businessId } = useParams();
  const router = useRouter();
  const [questions, setQuestions] = useState<GroupedQuestions>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`/api/portal/intake-questions?businessId=${businessId}`);
        if (!response.ok) throw new Error('Failed to fetch questions');
        const data = await response.json() as GroupedQuestions;
        setQuestions(data);
        
        // Initialize answers with saved responses
        const initialAnswers = Object.values(data).flat().reduce<Record<string, string>>((acc, question) => {
          if (question.savedAnswer) {
            acc[question.id] = question.savedAnswer;
          }
          return acc;
        }, {});
        
        setAnswers(initialAnswers);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [businessId]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/portal/intake-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          answers,
        }),
      });

      if (!response.ok) throw new Error('Failed to save answers');
      
      // Navigate to the next step
      router.push(`/portal/${businessId}/thank-you`);
    } catch (error) {
      console.error('Error saving answers:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsSaving(false);
    }
  };

  const renderQuestionInput = (question: Question) => {
    switch (question.type) {
      case 'TEXT':
        return (
          <input
            type="text"
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter your answer..."
          />
        );
      case 'NUMBER':
        return (
          <input
            type="number"
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter a number..."
          />
        );
      case 'BOOLEAN':
        return (
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={question.id}
                value="true"
                checked={answers[question.id] === 'true'}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={question.id}
                value="false"
                checked={answers[question.id] === 'false'}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="mr-2"
              />
              No
            </label>
          </div>
        );
      case 'SELECT':
        return (
          <select
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select an option...</option>
            {question.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Check if there are no questions
  const hasQuestions = Object.keys(questions).length > 0;
  
  if (!hasQuestions) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState type="questions" message="No questions available at this time." />
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={() => router.push(`/portal/${businessId}/tools`)}
            className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => router.push(`/portal/${businessId}/thank-you`)}
            className="px-4 py-2 text-sm font-medium rounded-md border border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {Object.entries(questions).map(([area, areaQuestions]) => (
        <Card key={area}>
          <Card.Header>
            <h2 className="text-lg font-medium">{area}</h2>
          </Card.Header>
          <Card.Body>
            <div className="space-y-6">
              {areaQuestions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {question.question}
                  </label>
                  {renderQuestionInput(question)}
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      ))}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => router.push(`/portal/${businessId}/tools`)}
          className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium rounded-md border border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSaving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
} 