'use client';

import { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Check, AlertTriangle, Calendar, Clock, ChevronDown, ChevronUp, X, Sparkles, Paperclip } from 'lucide-react';
import { Button } from '@/components';
import { ReportModal } from '@/components';
import { Report as ReportType } from './ReportModal';

type AuditType = {
  id: string;
  name: string;
  description: string;
  bucket: 'Foundation' | 'Acquisition' | 'Conversion' | 'Retention';
  metrics: string[];
  source: string;
  status?: 'not_started' | 'in_progress' | 'completed';
  lastUpdated?: Date;
};

// Use the Report type from ReportModal
type Report = ReportType;

// Predefined audit types for each bucket
const AUDIT_TYPES: AuditType[] = [
  // Foundation Bucket
  {
    id: 'martech_audit',
    name: 'Martech Stack Audit',
    description: 'Assesses marketing technology stack, integration quality, and identifies gaps or redundancies',
    bucket: 'Foundation',
    metrics: ['Tech Stack Coverage', 'Tool Redundancy Score', 'Missing Essential Tools'],
    source: 'AI Analysis'
  },
  {
    id: 'analytics_audit',
    name: 'Analytics Infrastructure Audit',
    description: 'Evaluates data collection setup, tracking implementation, and reporting capabilities',
    bucket: 'Foundation',
    metrics: ['Data Quality Score', 'Tracking Coverage', 'Essential Event Implementation'],
    source: 'AI Analysis'
  },
  {
    id: 'brand_audit',
    name: 'Brand Consistency Audit',
    description: 'Analyzes brand consistency across channels, messaging alignment, and visual identity compliance',
    bucket: 'Foundation',
    metrics: ['Brand Consistency Score', 'Messaging Alignment', 'Visual Identity Compliance'],
    source: 'AI Analysis'
  },
  {
    id: 'compliance_audit',
    name: 'Data Privacy & Compliance Audit',
    description: 'Evaluates regulatory compliance, privacy policies, and data handling practices',
    bucket: 'Foundation',
    metrics: ['Compliance Score', 'Risk Assessment', 'GDPR/CCPA Readiness'],
    source: 'AI Analysis'
  },
  
  // Acquisition Bucket
  {
    id: 'seo_audit',
    name: 'SEO Audit',
    description: 'Evaluates technical SEO, content performance, keyword positioning, and backlink profile',
    bucket: 'Acquisition',
    metrics: ['Domain Authority', 'Backlink Quality', 'Organic Search Visibility', 'Technical SEO Score'],
    source: 'AI Analysis'
  },
  {
    id: 'paid_media_audit',
    name: 'Paid Media Audit',
    description: 'Analyzes paid campaign structure, budget allocation, creative performance, and audience targeting',
    bucket: 'Acquisition',
    metrics: ['ROAS', 'CPA Efficiency', 'Quality Score', 'Audience Targeting Effectiveness'],
    source: 'AI Analysis'
  },
  {
    id: 'content_audit',
    name: 'Content Marketing Audit',
    description: 'Assesses content quality, topic coverage, distribution strategy, and performance',
    bucket: 'Acquisition',
    metrics: ['Content Engagement Rate', 'Content Gap Score', 'Topic Authority Rating'],
    source: 'AI Analysis'
  },
  {
    id: 'channel_mix_audit',
    name: 'Channel Mix Audit',
    description: 'Evaluates marketing channel effectiveness, budget allocation, and cross-channel synergy',
    bucket: 'Acquisition',
    metrics: ['Channel Efficiency Score', 'Acquisition Cost by Channel', 'Channel Mix Balance'],
    source: 'AI Analysis'
  },
  
  // Conversion Bucket
  {
    id: 'website_performance_audit',
    name: 'Website Performance Audit',
    description: 'Analyzes website speed, mobile experience, and technical performance issues',
    bucket: 'Conversion',
    metrics: ['Page Load Time', 'Core Web Vitals', 'Mobile Responsiveness Score'],
    source: 'AI Analysis'
  },
  {
    id: 'conversion_path_audit',
    name: 'Conversion Path Audit',
    description: 'Evaluates conversion path friction, form usability, and checkout process',
    bucket: 'Conversion',
    metrics: ['Funnel Conversion Rate', 'Drop-off Points', 'Form Completion Rate'],
    source: 'AI Analysis'
  },
  {
    id: 'ux_audit',
    name: 'User Experience Audit',
    description: 'Assesses navigation usability, information architecture, and content accessibility',
    bucket: 'Conversion',
    metrics: ['User Satisfaction Score', 'Task Completion Rate', 'UX Heuristic Evaluation'],
    source: 'AI Analysis'
  },
  {
    id: 'ab_testing_audit',
    name: 'A/B Testing Maturity Audit',
    description: 'Evaluates testing program effectiveness, experiment design, and implementation quality',
    bucket: 'Conversion',
    metrics: ['Testing Velocity', 'Test Win Rate', 'Implementation Quality'],
    source: 'AI Analysis'
  },
  
  // Retention Bucket
  {
    id: 'customer_loyalty_audit',
    name: 'Customer Loyalty Audit',
    description: 'Analyzes customer satisfaction, loyalty program effectiveness, and repeat purchase behavior',
    bucket: 'Retention',
    metrics: ['Customer Lifetime Value', 'Retention Rate', 'NPS/CSAT Scores'],
    source: 'AI Analysis'
  },
  {
    id: 'email_crm_audit',
    name: 'Email & CRM Audit',
    description: 'Evaluates email program quality, CRM data cleanliness, and automation workflow effectiveness',
    bucket: 'Retention',
    metrics: ['Email Engagement Rates', 'List Health Score', 'Automation Effectiveness'],
    source: 'AI Analysis'
  },
  {
    id: 'customer_support_audit',
    name: 'Customer Support Audit',
    description: 'Assesses support channel effectiveness, issue resolution efficiency, and customer feedback',
    bucket: 'Retention',
    metrics: ['Response Time', 'Resolution Rate', 'Support Satisfaction'],
    source: 'AI Analysis'
  },
  {
    id: 'app_engagement_audit',
    name: 'App Engagement Audit',
    description: 'Evaluates app engagement patterns, feature usage, and retention strategies',
    bucket: 'Retention',
    metrics: ['User Retention', 'Session Frequency', 'Feature Adoption'],
    source: 'AI Analysis'
  },
];

interface ReportManagementProps {
  bucket: 'Foundation' | 'Acquisition' | 'Conversion' | 'Retention';
  businessId: string;
  onReportUpdated?: () => void;
}

export default function ReportManagement({ bucket, businessId, onReportUpdated }: ReportManagementProps) {
  const [selectedAuditType, setSelectedAuditType] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [runningAuditId, setRunningAuditId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAIConfigured, setIsAIConfigured] = useState(false);
  const [aiConfigError, setAIConfigError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  // Check if AI is configured
  useEffect(() => {
    async function checkAIConfiguration() {
      try {
        const response = await fetch('/api/admin/ai-configuration');
        
        if (response.ok) {
          const data = await response.json();
          setIsAIConfigured(data.configurations && data.configurations.length > 0);
        } else {
          setIsAIConfigured(false);
          setAIConfigError('Could not verify AI configuration status');
        }
      } catch (error) {
        console.error('Error checking AI configuration:', error);
        setIsAIConfigured(false);
        setAIConfigError('Error checking AI configuration status');
      }
    }
    
    checkAIConfiguration();
  }, []);
  
  // Filter audit types for the current bucket
  const bucketAuditTypes = AUDIT_TYPES.filter(audit => audit.bucket === bucket);
  
  // Define fetchReports function that can be called from multiple places
  const fetchReports = useCallback(async () => {
    if (!businessId) return;
    
    setIsLoading(true);
    setFetchError(null);
    
    try {
      const response = await fetch(`/api/business/${businessId}/reports?bucket=${bucket}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Ensure we have an array (even if empty)
        if (Array.isArray(data.reports)) {
          setReports(data.reports);
        } else {
          console.warn('API returned non-array reports data, using empty array instead');
          setReports([]);
        }
      } else {
        console.error('Error fetching reports:', response.status);
        
        // Only show alert for actual server errors, not for 404 (which could just mean no reports yet)
        if (response.status >= 500) {
          // For server errors, show a small warning but continue
          console.warn(`Could not fetch reports (${response.status}). Using empty list.`);
          setFetchError(`Unable to load reports (Error ${response.status})`);
        }
        
        // Either way, set an empty reports array
        setReports([]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      // Set error message but use empty list
      setFetchError('Unable to load reports. Please try again later.');
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [businessId, bucket]);
  
  // Fetch existing reports for this business and bucket
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      const newFiles = Array.from(fileList) as File[];
      setFiles(prev => [...prev, ...newFiles]);
    }
  };
  
  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleRunAudit = async () => {
    if (!selectedAuditType) return;
    
    // Check if AI is configured
    if (!isAIConfigured) {
      alert('AI processing is not configured. Please ask an administrator to configure AI in the settings page before running audits.');
      return;
    }
    
    setIsRunningAudit(true);
    setRunningAuditId(selectedAuditType);
    setIsModalOpen(false); // Close the modal immediately
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('auditTypeId', selectedAuditType);
      formData.append('businessId', businessId);
      
      // Add any supporting files
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // Make the API call
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Check if we have a report in the response
        if (data.report) {
          // Add the report to the current list instead of fetching all reports again
          setReports(prev => [data.report, ...prev]);
          
          // Show success message
          setSuccessMessage(`Successfully generated: ${data.report.title || 'new report'}`);
          console.log('Report successfully generated:', data.report.title);
          
          // Clear success message after 5 seconds
          setTimeout(() => setSuccessMessage(null), 5000);
          
          // Refresh the reports list
          fetchReports().catch(err => console.warn('Could not refresh reports list', err));
          
          if (onReportUpdated) onReportUpdated();
          
          // Reset UI state
          setFiles([]);
          setSelectedAuditType(null);
        }
      } else {
        const errorData = await response.json();
        console.error('Error generating report:', errorData);
        alert(`Error: ${errorData.error || 'Failed to generate report'}`);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('An unexpected error occurred');
      }
    } finally {
      setIsRunningAudit(false);
      setRunningAuditId(null);
    }
  };
  
  // Get the selected audit type details
  const selectedAudit = selectedAuditType 
    ? AUDIT_TYPES.find(audit => audit.id === selectedAuditType) 
    : null;
  
  // Add this handler to open the report modal
  const handleReportClick = (report: Report) => {
    setSelectedReport(report);
    setIsReportModalOpen(true);
  };
  
  // Check if there's a completed report for an audit type
  const getAuditStatus = (auditTypeId: string): 'completed' | 'running' | 'not_started' => {
    if (runningAuditId === auditTypeId) return 'running';
    return reports.some(report => report.auditTypeId === auditTypeId) ? 'completed' : 'not_started';
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="p-5">
      <div className="mb-3">
        <h3 className="font-medium uppercase tracking-wider text-gray-500" style={{ fontVariant: 'small-caps', letterSpacing: '0.05em', fontSize: '11px' }}>Audit Reports</h3>
      </div>
      
      {fetchError && (
        <div className="mt-2 text-sm p-2 bg-red-50 border border-red-200 rounded-md text-red-700">
          <AlertTriangle className="h-3.5 w-3.5 inline-block mr-1" />
          {fetchError}
        </div>
      )}
      
      {successMessage && (
        <div className="mt-2 text-sm p-2 bg-green-50 border border-green-200 rounded-md text-green-700">
          <Check className="h-3.5 w-3.5 inline-block mr-1" />
          {successMessage}
        </div>
      )}
      
      {/* Audit Pills */}
      <div className="flex flex-wrap gap-2 mt-2">
        {bucketAuditTypes.map(audit => {
          const status = getAuditStatus(audit.id);
          const completed = status === 'completed';
          const running = status === 'running';
          
          // Remove the word "Audit" from the name and apply specific name mappings
          let displayName = audit.name.replace(/ Audit$/, '');
          
          // Apply specific name mappings
          if (displayName === 'Analytics Infrastructure') {
            displayName = 'Analytics';
          } else if (displayName === 'Brand Consistency') {
            displayName = 'Brand';
          } else if (displayName === 'App Engagement') {
            displayName = 'App';
          } else if (displayName === 'A/B Testing Maturity') {
            displayName = 'A/B Testing';
          } else if (displayName === 'User Experience') {
            displayName = 'UX';
          } else if (displayName === 'Data Privacy & Compliance') {
            displayName = 'Privacy & Compliance';
          }
          
          return (
            <div 
              key={audit.id}
              className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                completed 
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  : running
                    ? 'text-white relative overflow-hidden'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-dashed border-gray-300'
              }`}
              style={running ? {
                background: 'linear-gradient(-45deg, #6366f1, #8b5cf6, #d946ef)',
                backgroundSize: '200% 200%',
                animation: 'gradient 2s ease infinite'
              } : {}}
              onClick={() => {
                // Don't do anything if audit is already running
                if (running) return;
                
                // If there's a report, show it, otherwise open modal to create one
                const existingReport = reports.find(r => r.auditTypeId === audit.id);
                if (existingReport) {
                  setSelectedReport(existingReport);
                  setIsReportModalOpen(true);
                } else {
                  setSelectedAuditType(audit.id);
                  setIsModalOpen(true);
                }
              }}
            >
              {completed && <FileText className="h-3 w-3 inline-block mr-1" />}
              {running && <div className="inline-block mr-1 h-3 w-3 animate-spin rounded-full border-t-2 border-white"></div>}
              {displayName}
              
              {/* Add a dynamic moving gradient if the audit is running */}
              {running && (
                <style jsx>{`
                  @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                  }
                `}</style>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Audit Generation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Run Audit</h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedAuditType(null);
                  setFiles([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Audit Type
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={selectedAuditType || ''}
                  onChange={(e) => setSelectedAuditType(e.target.value || null)}
                >
                  <option value="">Select an audit type...</option>
                  {bucketAuditTypes.map(audit => (
                    <option key={audit.id} value={audit.id}>
                      {audit.name}
                    </option>
                  ))}
                </select>
                {selectedAudit && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedAudit.description}
                  </p>
                )}
              </div>
              
              {selectedAuditType && (
                <>
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                    <div className="flex items-start">
                      <Sparkles className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="ml-2">
                        <p className="text-sm font-medium text-blue-800">AI-First Approach</p>
                        <p className="text-sm text-blue-700 mt-1">
                          This audit will be run using AI to analyze all available data about your business. Supporting files will be used to improve accuracy along with the AI Brain.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supporting Files (Optional)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Attach files to provide additional context and improve the accuracy of the AI analysis.
                    </p>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileChange}
                        multiple
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center justify-center text-gray-500"
                      >
                        <Upload className="h-8 w-8 mb-2" />
                        <span className="font-medium">Click to upload files</span>
                        <span className="text-xs mt-1">or drag and drop</span>
                      </label>
                    </div>
                    
                    {files.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Attached Files</p>
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                            <div className="flex items-center">
                              <Paperclip className="h-4 w-4 text-gray-500 mr-2" />
                              <span className="text-sm truncate max-w-[250px]">{file.name}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveFile(index)}
                              className="text-gray-500 hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-3 flex justify-end gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsModalOpen(false);
                        setSelectedAuditType(null);
                        setFiles([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleRunAudit}
                      disabled={isRunningAudit || !selectedAuditType || !isAIConfigured}
                    >
                      {isRunningAudit ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Running...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-1" />
                          Run Audit
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Report Modal */}
      <ReportModal 
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
      />
    </div>
  );
} 