'use client';

import { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  ExternalLink 
} from 'lucide-react';
import { Button } from '@/components';

type Finding = {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  recommendedAction?: string;
  impact?: string;
  effort?: 'low' | 'medium' | 'high';
};

type ReportMetric = {
  name: string;
  value: number | string;
  target?: number | string;
  status?: 'good' | 'warning' | 'poor';
  description?: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
};

type Report = {
  id: string;
  title: string;
  auditType: string;
  score: number;
  summary: string;
  metrics: ReportMetric[];
  findings: Finding[];
  recommendations: string[];
  createdAt: Date;
  businessId: string;
};

interface StandardizedReportOutputProps {
  report: Report;
  onExport?: () => void;
}

export default function StandardizedReportOutput({ report, onExport }: StandardizedReportOutputProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'findings' | 'action'>('summary');
  const [expandedFindings, setExpandedFindings] = useState<string[]>([]);

  const toggleFinding = (id: string) => {
    if (expandedFindings.includes(id)) {
      setExpandedFindings(expandedFindings.filter(f => f !== id));
    } else {
      setExpandedFindings([...expandedFindings, id]);
    }
  };

  const getSeverityColor = (severity: Finding['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'info': return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status?: ReportMetric['status']) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{report.title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {report.auditType} • Generated on {formatDate(report.createdAt)}
            </p>
          </div>
          <div className="flex items-center">
            <div className="text-3xl font-bold mr-4 flex items-center">
              <span 
                className={
                  report.score >= 80 ? 'text-green-600' : 
                  report.score >= 60 ? 'text-yellow-600' : 
                  'text-red-600'
                }
              >
                {report.score}
              </span>
              <span className="text-sm text-gray-500 ml-1">/100</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'summary' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Summary & Metrics
          </button>
          <button
            onClick={() => setActiveTab('findings')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'findings' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Detailed Findings
          </button>
          <button
            onClick={() => setActiveTab('action')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'action' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Action Plan
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Summary Section */}
            <div>
              <h3 className="text-lg font-medium mb-2">Executive Summary</h3>
              <div className="bg-gray-50 p-4 rounded-md text-gray-700">
                <p>{report.summary}</p>
              </div>
            </div>

            {/* Metrics Dashboard */}
            <div>
              <h3 className="text-lg font-medium mb-2">Key Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.metrics.map((metric, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-3 bg-white">
                    <div className="flex justify-between items-start">
                      <div className="text-sm text-gray-500">{metric.name}</div>
                      {metric.trend && (
                        <div className={`flex items-center text-xs ${
                          metric.trend === 'up' ? 'text-green-600' : 
                          metric.trend === 'down' ? 'text-red-600' : 
                          'text-gray-500'
                        }`}>
                          {metric.trend === 'up' && <ChevronUp className="h-3 w-3 mr-0.5" />}
                          {metric.trend === 'down' && <ChevronDown className="h-3 w-3 mr-0.5" />}
                          {metric.trendValue}
                        </div>
                      )}
                    </div>
                    <div className="mt-1 flex items-baseline">
                      <div className={`text-xl font-bold ${getStatusColor(metric.status)}`}>
                        {metric.value}
                      </div>
                      {metric.target && (
                        <div className="text-xs text-gray-500 ml-1">
                          / {metric.target}
                        </div>
                      )}
                    </div>
                    {metric.description && (
                      <div className="mt-1 text-xs text-gray-500">
                        {metric.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Top Recommendations Preview */}
            <div>
              <h3 className="text-lg font-medium mb-2">Top Recommendations</h3>
              <ul className="space-y-2">
                {report.recommendations.slice(0, 3).map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{recommendation}</span>
                  </li>
                ))}
                {report.recommendations.length > 3 && (
                  <li className="text-sm text-blue-600 cursor-pointer" onClick={() => setActiveTab('action')}>
                    + {report.recommendations.length - 3} more recommendations
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Findings Tab */}
        {activeTab === 'findings' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-2">Detailed Findings</h3>
            
            {/* Filter by Severity (could be implemented) */}
            
            {/* Findings List */}
            <div className="space-y-3">
              {report.findings.map(finding => (
                <div 
                  key={finding.id} 
                  className="border border-gray-200 rounded-md overflow-hidden"
                >
                  <div 
                    className="flex justify-between items-center p-3 cursor-pointer"
                    onClick={() => toggleFinding(finding.id)}
                  >
                    <div className="flex items-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs mr-2 ${getSeverityColor(finding.severity)}`}>
                        {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)}
                      </span>
                      <span className="font-medium">{finding.title}</span>
                    </div>
                    <div>
                      {expandedFindings.includes(finding.id) ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {expandedFindings.includes(finding.id) && (
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                      <div className="text-sm text-gray-700 mb-2">
                        {finding.description}
                      </div>
                      
                      {finding.recommendedAction && (
                        <div className="mb-2">
                          <div className="text-xs font-medium text-gray-500 mb-1">Recommended Action</div>
                          <div className="text-sm text-gray-700">{finding.recommendedAction}</div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-4 mt-3 text-xs">
                        <div>
                          <span className="text-gray-500">Category: </span>
                          <span className="font-medium">{finding.category}</span>
                        </div>
                        
                        {finding.impact && (
                          <div>
                            <span className="text-gray-500">Impact: </span>
                            <span className="font-medium">{finding.impact}</span>
                          </div>
                        )}
                        
                        {finding.effort && (
                          <div>
                            <span className="text-gray-500">Effort: </span>
                            <span className={`font-medium ${
                              finding.effort === 'low' ? 'text-green-600' :
                              finding.effort === 'medium' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {finding.effort.charAt(0).toUpperCase() + finding.effort.slice(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Plan Tab */}
        {activeTab === 'action' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-2">Recommended Action Plan</h3>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-blue-800 text-sm mb-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                <div>
                  This action plan is generated based on the audit findings and prioritized by impact and effort.
                  Consider working with your marketing team to implement these recommendations.
                </div>
              </div>
            </div>
            
            <ol className="space-y-4">
              {report.recommendations.map((recommendation, index) => (
                <li key={index} className="flex">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 mt-0.5">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{recommendation}</div>
                    {/* Additional details like timeline, resources needed, etc. could be added here */}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
} 