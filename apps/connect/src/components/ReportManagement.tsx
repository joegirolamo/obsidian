'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, Check, AlertTriangle, Calendar, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components';

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

type Report = {
  id: string;
  auditTypeId: string;
  businessId: string;
  score: number;
  status: 'draft' | 'published';
  findings: any[];
  metrics: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  importSource: 'pdf' | 'api' | 'manual';
};

// Predefined audit types for each bucket
const AUDIT_TYPES: AuditType[] = [
  // Foundation Bucket
  {
    id: 'martech_audit',
    name: 'Martech Stack Audit',
    description: 'Assesses marketing technology stack, integration quality, and identifies gaps or redundancies',
    bucket: 'Foundation',
    metrics: ['Tech Stack Coverage', 'Tool Redundancy Score', 'Missing Essential Tools'],
    source: 'Wappalyzer/BuiltWith API'
  },
  {
    id: 'analytics_audit',
    name: 'Analytics Infrastructure Audit',
    description: 'Evaluates data collection setup, tracking implementation, and reporting capabilities',
    bucket: 'Foundation',
    metrics: ['Data Quality Score', 'Tracking Coverage', 'Essential Event Implementation'],
    source: 'Google Analytics/Adobe Analytics'
  },
  {
    id: 'brand_audit',
    name: 'Brand Consistency Audit',
    description: 'Analyzes brand consistency across channels, messaging alignment, and visual identity compliance',
    bucket: 'Foundation',
    metrics: ['Brand Consistency Score', 'Messaging Alignment', 'Visual Identity Compliance'],
    source: 'Manual Assessment'
  },
  {
    id: 'compliance_audit',
    name: 'Data Privacy & Compliance Audit',
    description: 'Evaluates regulatory compliance, privacy policies, and data handling practices',
    bucket: 'Foundation',
    metrics: ['Compliance Score', 'Risk Assessment', 'GDPR/CCPA Readiness'],
    source: 'OneTrust/TrustArc'
  },
  
  // Acquisition Bucket
  {
    id: 'seo_audit',
    name: 'SEO Audit',
    description: 'Evaluates technical SEO, content performance, keyword positioning, and backlink profile',
    bucket: 'Acquisition',
    metrics: ['Domain Authority', 'Backlink Quality', 'Organic Search Visibility', 'Technical SEO Score'],
    source: 'Ahrefs/SEMrush/Moz'
  },
  {
    id: 'paid_media_audit',
    name: 'Paid Media Audit',
    description: 'Analyzes paid campaign structure, budget allocation, creative performance, and audience targeting',
    bucket: 'Acquisition',
    metrics: ['ROAS', 'CPA Efficiency', 'Quality Score', 'Audience Targeting Effectiveness'],
    source: 'Google Ads/Meta Ads/LinkedIn Ads'
  },
  {
    id: 'content_audit',
    name: 'Content Marketing Audit',
    description: 'Assesses content quality, topic coverage, distribution strategy, and performance',
    bucket: 'Acquisition',
    metrics: ['Content Engagement Rate', 'Content Gap Score', 'Topic Authority Rating'],
    source: 'Content Analysis Tools'
  },
  {
    id: 'channel_mix_audit',
    name: 'Channel Mix Audit',
    description: 'Evaluates marketing channel effectiveness, budget allocation, and cross-channel synergy',
    bucket: 'Acquisition',
    metrics: ['Channel Efficiency Score', 'Acquisition Cost by Channel', 'Channel Mix Balance'],
    source: 'Attribution Tool'
  },
  
  // Conversion Bucket
  {
    id: 'website_performance_audit',
    name: 'Website Performance Audit',
    description: 'Analyzes website speed, mobile experience, and technical performance issues',
    bucket: 'Conversion',
    metrics: ['Page Load Time', 'Core Web Vitals', 'Mobile Responsiveness Score'],
    source: 'Google PageSpeed Insights/Lighthouse'
  },
  {
    id: 'conversion_path_audit',
    name: 'Conversion Path Audit',
    description: 'Evaluates conversion path friction, form usability, and checkout process',
    bucket: 'Conversion',
    metrics: ['Funnel Conversion Rate', 'Drop-off Points', 'Form Completion Rate'],
    source: 'Analytics Platform/Heatmap Tools'
  },
  {
    id: 'ux_audit',
    name: 'User Experience Audit',
    description: 'Assesses navigation usability, information architecture, and content accessibility',
    bucket: 'Conversion',
    metrics: ['User Satisfaction Score', 'Task Completion Rate', 'UX Heuristic Evaluation'],
    source: 'UX Research Tools'
  },
  {
    id: 'ab_testing_audit',
    name: 'A/B Testing Maturity Audit',
    description: 'Evaluates testing program effectiveness, experiment design, and implementation quality',
    bucket: 'Conversion',
    metrics: ['Testing Velocity', 'Test Win Rate', 'Implementation Quality'],
    source: 'Optimize/VWO'
  },
  
  // Retention Bucket
  {
    id: 'customer_loyalty_audit',
    name: 'Customer Loyalty Audit',
    description: 'Analyzes customer satisfaction, loyalty program effectiveness, and repeat purchase behavior',
    bucket: 'Retention',
    metrics: ['Customer Lifetime Value', 'Retention Rate', 'NPS/CSAT Scores'],
    source: 'CRM System/Customer Survey Tools'
  },
  {
    id: 'email_crm_audit',
    name: 'Email & CRM Audit',
    description: 'Evaluates email program quality, CRM data cleanliness, and automation workflow effectiveness',
    bucket: 'Retention',
    metrics: ['Email Engagement Rates', 'List Health Score', 'Automation Effectiveness'],
    source: 'Email Platform/CRM'
  },
  {
    id: 'customer_support_audit',
    name: 'Customer Support Audit',
    description: 'Assesses support channel effectiveness, issue resolution efficiency, and customer feedback',
    bucket: 'Retention',
    metrics: ['Response Time', 'Resolution Rate', 'Support Satisfaction'],
    source: 'Support Platform'
  },
  {
    id: 'app_engagement_audit',
    name: 'App Engagement Audit',
    description: 'Evaluates app engagement patterns, feature usage, and retention strategies',
    bucket: 'Retention',
    metrics: ['User Retention', 'Session Frequency', 'Feature Adoption'],
    source: 'Mobile Analytics Platforms'
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
  const [isImporting, setIsImporting] = useState(false);
  const [importMethod, setImportMethod] = useState<'pdf' | 'api' | 'manual'>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter audit types for the current bucket
  const bucketAuditTypes = AUDIT_TYPES.filter(audit => audit.bucket === bucket);
  
  // Fetch existing reports for this business and bucket
  useEffect(() => {
    async function fetchReports() {
      if (!businessId) return;
      
      setIsLoading(true);
      
      try {
        // This would be replaced with an actual API call
        // const response = await fetch(`/api/business/${businessId}/reports?bucket=${bucket}`);
        // const data = await response.json();
        // if (response.ok) {
        //   setReports(data.reports);
        // }
        
        // For now, simulate empty reports
        setReports([]);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchReports();
  }, [businessId, bucket]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleImportReport = async () => {
    if (!selectedAuditType) return;
    
    setIsImporting(true);
    
    try {
      if (importMethod === 'pdf' && file) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('auditTypeId', selectedAuditType);
        formData.append('businessId', businessId);
        
        // This would be replaced with an actual API call
        // const response = await fetch('/api/reports/import', {
        //   method: 'POST',
        //   body: formData,
        // });
        // 
        // if (response.ok) {
        //   const newReport = await response.json();
        //   setReports([...reports, newReport]);
        //   if (onReportUpdated) onReportUpdated();
        // }
        
        // For now, simulate success
        alert('PDF upload simulation: Report would be processed here in the real implementation');
      } else if (importMethod === 'api') {
        // This would be replaced with an actual API call
        // const response = await fetch('/api/reports/import-from-api', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     auditTypeId: selectedAuditType,
        //     businessId: businessId,
        //   }),
        // });
        // 
        // if (response.ok) {
        //   const newReport = await response.json();
        //   setReports([...reports, newReport]);
        //   if (onReportUpdated) onReportUpdated();
        // }
        
        // For now, simulate success
        alert('API connection simulation: Report would be fetched from the API here in the real implementation');
      } else if (importMethod === 'manual') {
        // Navigate to manual data entry form (would be implemented separately)
        alert('Manual entry simulation: You would be redirected to a data entry form in the real implementation');
      }
    } catch (error) {
      console.error('Error importing report:', error);
    } finally {
      setIsImporting(false);
      setFile(null);
      setIsDropdownOpen(false);
    }
  };
  
  // Get the selected audit type details
  const selectedAudit = selectedAuditType 
    ? AUDIT_TYPES.find(audit => audit.id === selectedAuditType) 
    : null;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 px-5">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium text-gray-600">Audit Reports</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <FileText className="h-4 w-4 mr-1" />
          Import Report
          {isDropdownOpen ? (
            <ChevronUp className="h-4 w-4 ml-1" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-1" />
          )}
        </Button>
      </div>
      
      {isDropdownOpen && (
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Import Method
                  </label>
                  <div className="flex space-x-2">
                    <button
                      className={`px-3 py-1.5 rounded-md text-sm ${
                        importMethod === 'pdf' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                      onClick={() => setImportMethod('pdf')}
                    >
                      PDF Upload
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded-md text-sm ${
                        importMethod === 'api' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                      onClick={() => setImportMethod('api')}
                    >
                      API Connection
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded-md text-sm ${
                        importMethod === 'manual' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                      onClick={() => setImportMethod('manual')}
                    >
                      Manual Entry
                    </button>
                  </div>
                </div>
                
                {importMethod === 'pdf' && (
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center justify-center text-gray-500"
                    >
                      <Upload className="h-10 w-10 mb-2" />
                      {file ? (
                        <span className="text-blue-600">{file.name}</span>
                      ) : (
                        <>
                          <span className="font-medium">Click to upload PDF report</span>
                          <span className="text-xs mt-1">or drag and drop</span>
                        </>
                      )}
                    </label>
                  </div>
                )}
                
                {importMethod === 'api' && (
                  <div className="text-sm text-gray-700">
                    <p className="mb-2">Connect directly to {selectedAudit?.source || 'API source'} to import data.</p>
                    <div className="bg-yellow-50 border border-yellow-200 p-2 rounded-md text-yellow-800">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      API connections will be configured by an administrator.
                    </div>
                  </div>
                )}
                
                {importMethod === 'manual' && (
                  <div className="text-sm text-gray-700">
                    <p>Manually enter audit data through a structured form.</p>
                    <ul className="list-disc pl-5 mt-2 text-gray-600">
                      {selectedAudit?.metrics.map(metric => (
                        <li key={metric}>{metric}</li>
                      )) || <li>No metrics defined</li>}
                    </ul>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setSelectedAuditType(null);
                      setFile(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleImportReport}
                    disabled={importMethod === 'pdf' && !file}
                  >
                    {isImporting ? 'Importing...' : 'Import Report'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* List of existing reports */}
      <div className="space-y-3">
        {reports.length > 0 && (
          reports.map(report => {
            const auditType = AUDIT_TYPES.find(a => a.id === report.auditTypeId);
            return (
              <div 
                key={report.id} 
                className="p-3 bg-white border border-gray-200 rounded-md shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{auditType?.name || 'Unknown Audit'}</h4>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {new Date(report.createdAt).toLocaleDateString()}
                      <span className="mx-2">•</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        report.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xl font-bold">
                    {report.score}/100
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 