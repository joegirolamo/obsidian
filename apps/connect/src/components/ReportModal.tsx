'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Download, AlertTriangle, CheckCircle, XCircle, Info, Sparkles, Paperclip } from 'lucide-react';

export interface Metric {
  name: string;
  value: number | string;
  description?: string;
  status?: 'good' | 'warning' | 'poor';
  target?: number | string;
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  recommendedAction?: string;
  effort?: 'low' | 'medium' | 'high';
}

export interface Report {
  id: string;
  auditTypeId: string;
  businessId: string;
  title: string;
  bucket: string;
  score: number;
  summary: string;
  metrics: Metric[];
  findings: Finding[];
  recommendations: string[];
  status: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
  importSource: 'pdf' | 'api' | 'manual' | 'ai';
  insights?: string[];
  contextualAnalysis?: string;
  competitiveInsights?: string;
  supportingFiles?: string[];
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
}

export default function ReportModal({ isOpen, onClose, report }: ReportModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'findings' | 'insights'>('overview');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Reset to overview tab when a new report is selected
  useEffect(() => {
    if (report) {
      setActiveTab('overview');
    }
  }, [report?.id]);
  
  if (!isOpen || !report) return null;
  
  // Check if AI insights are available
  const hasInsights = Boolean(report.insights?.length) || Boolean(report.contextualAnalysis) || Boolean(report.competitiveInsights);
  
  // Helper function to get status icon
  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'poor':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Helper function to get severity badge
  const getSeverityBadge = (severity: string) => {
    const baseClasses = "px-2 py-0.5 text-xs font-medium rounded-full";
    switch (severity) {
      case 'critical':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Critical</span>;
      case 'high':
        return <span className={`${baseClasses} bg-orange-100 text-orange-800`}>High</span>;
      case 'medium':
        return <span className={`${baseClasses} bg-amber-100 text-amber-800`}>Medium</span>;
      case 'low':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Low</span>;
      case 'info':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Info</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{severity}</span>;
    }
  };
  
  // Helper function to get effort badge
  const getEffortBadge = (effort: string | undefined) => {
    if (!effort) return null;
    
    const baseClasses = "px-2 py-0.5 text-xs font-medium rounded-full";
    switch (effort) {
      case 'high':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>High Effort</span>;
      case 'medium':
        return <span className={`${baseClasses} bg-amber-100 text-amber-800`}>Medium Effort</span>;
      case 'low':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Low Effort</span>;
      default:
        return null;
    }
  };
  
  const handleDeleteReport = async () => {
    if (!report || !report.id || isDeleting) return;
    
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      const response = await fetch(`/api/business/${report.businessId}/reports/${report.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Close the modal and reload the page to refresh the reports list
        onClose();
        window.location.reload();
      } else {
        const data = await response.json();
        setDeleteError(data.error || 'Failed to delete report');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      setDeleteError('An error occurred while deleting the report');
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-lg">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold">{report.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* AI Badge & Score Banner */}
        <div className="bg-blue-50 border-b border-blue-100 p-4 flex justify-between items-center">
          <div>
            <div className="text-sm text-blue-700 font-medium">Overall Score</div>
            <div className="text-3xl font-bold text-blue-800">{report.score}<span className="text-lg">/100</span></div>
          </div>
          <div className="flex gap-4">
            <div>
              <div className="text-sm text-gray-500">Analysis Method</div>
              <div className="text-sm font-medium flex items-center">
                {report.importSource === 'ai' ? (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 flex items-center">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500 mr-1" />
                    AI Analysis
                  </span>
                ) : report.importSource === 'pdf' ? 'PDF Upload' : 
                   report.importSource === 'api' ? 'API Import' : 'Manual Entry'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Date</div>
              <div className="text-sm font-medium">
                {new Date(report.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className="text-sm font-medium">
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  report.status === 'published' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {report.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'metrics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Metrics
            </button>
            <button
              onClick={() => setActiveTab('findings')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'findings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Findings
            </button>
            {hasInsights && (
              <button
                onClick={() => setActiveTab('insights')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'insights'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                AI Insights
              </button>
            )}
          </nav>
        </div>
        
        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Summary</h3>
                <p className="text-gray-700">{report.summary || 'No summary available.'}</p>
              </div>
              
              {/* Supporting Files Section (if any) */}
              {report.supportingFiles && report.supportingFiles.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Supporting Files</h3>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">
                      The following files were used to support the AI analysis:
                    </p>
                    <div className="space-y-1">
                      {report.supportingFiles.map((file, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <Paperclip className="h-3.5 w-3.5 text-gray-500 mr-2" />
                          <span className="text-gray-700">{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {report.recommendations && report.recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Key Recommendations</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {report.recommendations.map((recommendation, index) => (
                      <li key={index} className="text-gray-700">{recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Top Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(report.metrics as Metric[]).slice(0, 3).map((metric, index) => (
                    <div key={index} className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium text-gray-900">{metric.name}</h4>
                        {getStatusIcon(metric.status)}
                      </div>
                      <div className="mt-1 text-2xl font-bold">{metric.value}</div>
                      {metric.description && (
                        <p className="mt-1 text-xs text-gray-500">{metric.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Critical Findings</h3>
                <div className="space-y-3">
                  {(report.findings as Finding[])
                    .filter(f => f.severity === 'critical' || f.severity === 'high')
                    .slice(0, 2)
                    .map((finding, index) => (
                      <div key={index} className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium text-gray-900">{finding.title}</h4>
                          {getSeverityBadge(finding.severity)}
                        </div>
                        <p className="mt-1 text-sm text-gray-700">{finding.description}</p>
                        {finding.recommendedAction && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Recommended action: </span>
                            {finding.recommendedAction}
                          </div>
                        )}
                      </div>
                  ))}
                  {(report.findings as Finding[]).filter(f => f.severity === 'critical' || f.severity === 'high').length === 0 && (
                    <p className="text-sm text-gray-500 italic">No critical findings.</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'metrics' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">All Metrics</h3>
              <div className="space-y-6">
                {(report.metrics as Metric[]).length > 0 ? (
                  <div className="overflow-hidden border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(report.metrics as Metric[]).map((metric, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{metric.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.value}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                {getStatusIcon(metric.status)}
                                <span className="ml-1.5 capitalize">{metric.status || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{metric.description || 'No description'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No metrics available.</p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'findings' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">All Findings</h3>
              <div className="space-y-4">
                {(report.findings as Finding[]).length > 0 ? (
                  (report.findings as Finding[]).map((finding, index) => (
                    <div key={index} className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-base font-medium text-gray-900">{finding.title}</h4>
                        <div className="flex space-x-2">
                          {getSeverityBadge(finding.severity)}
                          {getEffortBadge(finding.effort)}
                        </div>
                      </div>
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase">Category:</span>
                        <span className="ml-1 text-sm">{finding.category}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{finding.description}</p>
                      {finding.recommendedAction && (
                        <div className="bg-blue-50 p-3 rounded text-sm">
                          <span className="font-medium text-blue-800">Recommended action: </span>
                          <span className="text-blue-700">{finding.recommendedAction}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No findings available.</p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'insights' && hasInsights && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center mb-2">
                  <Sparkles className="h-4 w-4 text-blue-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">AI Insights</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  These insights are generated by AI analysis based on your business data and industry knowledge.
                </p>
                
                {report.insights && report.insights.length > 0 ? (
                  <div className="space-y-4">
                    {report.insights.map((insight, index) => (
                      <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-1">
                            <Info className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-gray-700">{insight}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No AI insights available.</p>
                )}
              </div>
              
              {report.contextualAnalysis && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Contextual Analysis</h3>
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-700 whitespace-pre-line">{report.contextualAnalysis}</p>
                  </div>
                </div>
              )}
              
              {report.competitiveInsights && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Competitive Insights</h3>
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-700 whitespace-pre-line">{report.competitiveInsights}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-between items-center bg-gray-50 rounded-b-lg">
          <div className="text-sm text-gray-500">
            <button 
              onClick={handleDeleteReport}
              disabled={isDeleting}
              className="text-gray-500 hover:text-red-600 hover:underline transition-colors cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete Report'}
            </button>
            {deleteError && <span className="ml-2 text-red-500">{deleteError}</span>}
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center">
            <Download className="h-4 w-4 mr-1" />
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
} 