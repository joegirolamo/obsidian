/**
 * Report Definitions
 * This file contains standardized definitions for audit report types,
 * including metrics, expected findings categories, and format specifications.
 */

export type MetricDefinition = {
  id: string;
  name: string;
  description: string;
  unit?: string;  // %, $, numeric, text
  targetRange?: {
    min?: number;
    max?: number;
    ideal?: number;
  };
  statusRanges?: {
    good: [number, number];  // Min and max values for "good" status
    warning: [number, number];  // Min and max values for "warning" status
    poor: [number, number];  // Min and max values for "poor" status
  };
  interpretationGuidance?: string;
};

export type FindingCategory = {
  id: string;
  name: string;
  description: string;
};

export type AuditTypeDefinition = {
  id: string;
  name: string;
  description: string;
  bucket: 'Foundation' | 'Acquisition' | 'Conversion' | 'Retention';
  metrics: MetricDefinition[];
  findingCategories: FindingCategory[];
  primaryDataSource: string;
  aiPrompt: string;  // Customized prompt for AI to extract data from this report type
};

// Foundation: Martech Stack Audit
const martechAudit: AuditTypeDefinition = {
  id: 'martech_audit',
  name: 'Martech Stack Audit',
  description: 'Assesses marketing technology stack, integration quality, and identifies gaps or redundancies',
  bucket: 'Foundation',
  primaryDataSource: 'Wappalyzer/BuiltWith API',
  metrics: [
    {
      id: 'tech_stack_coverage',
      name: 'Tech Stack Coverage',
      description: 'Percentage of marketing functions covered by technology solutions',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 90 },
      statusRanges: {
        good: [80, 100],
        warning: [50, 79],
        poor: [0, 49]
      },
      interpretationGuidance: 'Higher is better. Measures comprehensiveness of martech stack.'
    },
    {
      id: 'tool_redundancy',
      name: 'Tool Redundancy Score',
      description: 'Measures degree of overlapping functionality in the martech stack',
      unit: 'numeric',
      targetRange: { min: 0, max: 100, ideal: 10 },
      statusRanges: {
        good: [0, 20],
        warning: [21, 50],
        poor: [51, 100]
      },
      interpretationGuidance: 'Lower is better. High scores indicate wasteful tool overlap.'
    },
    {
      id: 'missing_essential_tools',
      name: 'Missing Essential Tools',
      description: 'Count of essential marketing tools missing from the stack',
      unit: 'numeric',
      targetRange: { min: 0, max: 10, ideal: 0 },
      statusRanges: {
        good: [0, 1],
        warning: [2, 4],
        poor: [5, 10]
      },
      interpretationGuidance: 'Lower is better. Zero indicates all essential tools are present.'
    },
    {
      id: 'integration_quality',
      name: 'Integration Quality',
      description: 'How well marketing tools are integrated with each other',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 90 },
      statusRanges: {
        good: [80, 100],
        warning: [50, 79],
        poor: [0, 49]
      },
      interpretationGuidance: 'Higher is better. Measures data flow between systems.'
    }
  ],
  findingCategories: [
    {
      id: 'tool_gaps',
      name: 'Tool Gaps',
      description: 'Missing or inadequate tools in the martech stack'
    },
    {
      id: 'redundancies',
      name: 'Redundancies',
      description: 'Overlapping tools that serve similar functions'
    },
    {
      id: 'integration_issues',
      name: 'Integration Issues',
      description: 'Problems with data flow between marketing tools'
    },
    {
      id: 'legacy_systems',
      name: 'Legacy Systems',
      description: 'Outdated tools that should be replaced or upgraded'
    }
  ],
  aiPrompt: `
    Extract and structure information from this Martech Stack Audit report.
    
    1. Identify key metrics:
       - Tech Stack Coverage (%)
       - Tool Redundancy Score
       - Missing Essential Tools (count)
       - Integration Quality (%)
    
    2. Extract findings related to:
       - Tool Gaps
       - Redundancies
       - Integration Issues
       - Legacy Systems
    
    3. Extract recommendations in priority order.
    
    4. Provide an executive summary of the report.
    
    Format your response as a structured JSON object.
  `
};

// Foundation: Analytics Infrastructure Audit
const analyticsAudit: AuditTypeDefinition = {
  id: 'analytics_audit',
  name: 'Analytics Infrastructure Audit',
  description: 'Evaluates data collection setup, tracking implementation, and reporting capabilities',
  bucket: 'Foundation',
  primaryDataSource: 'Google Analytics/Adobe Analytics',
  metrics: [
    {
      id: 'data_quality_score',
      name: 'Data Quality Score',
      description: 'Overall quality and reliability of analytics data',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 95 },
      statusRanges: {
        good: [85, 100],
        warning: [60, 84],
        poor: [0, 59]
      },
      interpretationGuidance: 'Higher is better. Measures accuracy and completeness of data.'
    },
    {
      id: 'tracking_coverage',
      name: 'Tracking Coverage',
      description: 'Percentage of key user interactions being tracked',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 100 },
      statusRanges: {
        good: [90, 100],
        warning: [70, 89],
        poor: [0, 69]
      },
      interpretationGuidance: 'Higher is better. Ideally all key interactions are tracked.'
    },
    {
      id: 'event_implementation',
      name: 'Essential Event Implementation',
      description: 'Implementation quality of critical tracking events',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 100 },
      statusRanges: {
        good: [90, 100],
        warning: [70, 89],
        poor: [0, 69]
      },
      interpretationGuidance: 'Higher is better. Measures correct implementation of key events.'
    },
    {
      id: 'reporting_utilization',
      name: 'Reporting Utilization',
      description: 'Extent to which available data is being leveraged in reporting',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 85 },
      statusRanges: {
        good: [75, 100],
        warning: [40, 74],
        poor: [0, 39]
      },
      interpretationGuidance: 'Higher is better. Measures effective use of collected data.'
    }
  ],
  findingCategories: [
    {
      id: 'tracking_gaps',
      name: 'Tracking Gaps',
      description: 'Missing or incomplete tracking implementations'
    },
    {
      id: 'data_quality_issues',
      name: 'Data Quality Issues',
      description: 'Problems with data accuracy, completeness, or reliability'
    },
    {
      id: 'implementation_errors',
      name: 'Implementation Errors',
      description: 'Technical errors in analytics implementation'
    },
    {
      id: 'reporting_limitations',
      name: 'Reporting Limitations',
      description: 'Insufficient use of data in reporting and analysis'
    }
  ],
  aiPrompt: `
    Extract and structure information from this Analytics Infrastructure Audit report.
    
    1. Identify key metrics:
       - Data Quality Score (%)
       - Tracking Coverage (%)
       - Essential Event Implementation (%)
       - Reporting Utilization (%)
    
    2. Extract findings related to:
       - Tracking Gaps
       - Data Quality Issues
       - Implementation Errors
       - Reporting Limitations
    
    3. Extract recommendations in priority order.
    
    4. Provide an executive summary of the report.
    
    Format your response as a structured JSON object.
  `
};

// Acquisition: SEO Audit
const seoAudit: AuditTypeDefinition = {
  id: 'seo_audit',
  name: 'SEO Audit',
  description: 'Evaluates technical SEO, content performance, keyword positioning, and backlink profile',
  bucket: 'Acquisition',
  primaryDataSource: 'Ahrefs/SEMrush/Moz',
  metrics: [
    {
      id: 'domain_authority',
      name: 'Domain Authority',
      description: 'Overall strength of the domain for SEO purposes',
      unit: 'numeric',
      targetRange: { min: 0, max: 100, ideal: 60 },
      statusRanges: {
        good: [50, 100],
        warning: [30, 49],
        poor: [0, 29]
      },
      interpretationGuidance: 'Higher is better. Measures domain strength relative to competitors.'
    },
    {
      id: 'backlink_quality',
      name: 'Backlink Quality',
      description: 'Quality and relevance of backlinks to the site',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 80 },
      statusRanges: {
        good: [70, 100],
        warning: [40, 69],
        poor: [0, 39]
      },
      interpretationGuidance: 'Higher is better. Measures the quality rather than quantity of backlinks.'
    },
    {
      id: 'organic_visibility',
      name: 'Organic Search Visibility',
      description: 'Visibility of the site in organic search results',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 75 },
      statusRanges: {
        good: [60, 100],
        warning: [30, 59],
        poor: [0, 29]
      },
      interpretationGuidance: 'Higher is better. Measures presence in SERPs for target keywords.'
    },
    {
      id: 'technical_seo_score',
      name: 'Technical SEO Score',
      description: 'Quality of technical SEO implementation',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 95 },
      statusRanges: {
        good: [85, 100],
        warning: [65, 84],
        poor: [0, 64]
      },
      interpretationGuidance: 'Higher is better. Measures technical optimization of the site.'
    }
  ],
  findingCategories: [
    {
      id: 'technical_issues',
      name: 'Technical Issues',
      description: 'Technical SEO problems affecting crawling, indexing, or rendering'
    },
    {
      id: 'content_gaps',
      name: 'Content Gaps',
      description: 'Missing or underperforming content for target keywords'
    },
    {
      id: 'backlink_problems',
      name: 'Backlink Problems',
      description: 'Issues with the backlink profile or link building strategy'
    },
    {
      id: 'keyword_targeting',
      name: 'Keyword Targeting',
      description: 'Problems with keyword research, selection, or implementation'
    }
  ],
  aiPrompt: `
    Extract and structure information from this SEO Audit report.
    
    1. Identify key metrics:
       - Domain Authority (0-100)
       - Backlink Quality (%)
       - Organic Search Visibility (%)
       - Technical SEO Score (%)
    
    2. Extract findings related to:
       - Technical Issues
       - Content Gaps
       - Backlink Problems
       - Keyword Targeting
    
    3. Extract recommendations in priority order.
    
    4. Provide an executive summary of the report.
    
    Format your response as a structured JSON object.
  `
};

// Conversion: Website Performance Audit
const websitePerformanceAudit: AuditTypeDefinition = {
  id: 'website_performance_audit',
  name: 'Website Performance Audit',
  description: 'Analyzes website speed, mobile experience, and technical performance issues',
  bucket: 'Conversion',
  primaryDataSource: 'Google PageSpeed Insights/Lighthouse',
  metrics: [
    {
      id: 'page_load_time',
      name: 'Page Load Time',
      description: 'Average time for pages to load completely',
      unit: 'seconds',
      targetRange: { min: 0, max: 10, ideal: 2 },
      statusRanges: {
        good: [0, 2.5],
        warning: [2.6, 5],
        poor: [5.1, 10]
      },
      interpretationGuidance: 'Lower is better. Under 2.5 seconds is considered good.'
    },
    {
      id: 'core_web_vitals',
      name: 'Core Web Vitals',
      description: 'Google\'s Core Web Vitals compliance score',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 90 },
      statusRanges: {
        good: [75, 100],
        warning: [50, 74],
        poor: [0, 49]
      },
      interpretationGuidance: 'Higher is better. Measures LCP, FID, and CLS performance.'
    },
    {
      id: 'mobile_responsiveness',
      name: 'Mobile Responsiveness Score',
      description: 'Quality of mobile experience',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 95 },
      statusRanges: {
        good: [85, 100],
        warning: [60, 84],
        poor: [0, 59]
      },
      interpretationGuidance: 'Higher is better. Measures quality of mobile user experience.'
    },
    {
      id: 'accessibility_score',
      name: 'Accessibility Score',
      description: 'Compliance with web accessibility standards',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 90 },
      statusRanges: {
        good: [80, 100],
        warning: [60, 79],
        poor: [0, 59]
      },
      interpretationGuidance: 'Higher is better. Measures compliance with WCAG guidelines.'
    }
  ],
  findingCategories: [
    {
      id: 'speed_issues',
      name: 'Speed Issues',
      description: 'Problems affecting page load speed'
    },
    {
      id: 'mobile_issues',
      name: 'Mobile Issues',
      description: 'Problems specific to mobile experience'
    },
    {
      id: 'accessibility_issues',
      name: 'Accessibility Issues',
      description: 'Problems affecting users with disabilities'
    },
    {
      id: 'technical_performance',
      name: 'Technical Performance',
      description: 'Technical issues affecting overall site performance'
    }
  ],
  aiPrompt: `
    Extract and structure information from this Website Performance Audit report.
    
    1. Identify key metrics:
       - Page Load Time (seconds)
       - Core Web Vitals (%)
       - Mobile Responsiveness Score (%)
       - Accessibility Score (%)
    
    2. Extract findings related to:
       - Speed Issues
       - Mobile Issues
       - Accessibility Issues
       - Technical Performance
    
    3. Extract recommendations in priority order.
    
    4. Provide an executive summary of the report.
    
    Format your response as a structured JSON object.
  `
};

// Retention: Customer Loyalty Audit
const customerLoyaltyAudit: AuditTypeDefinition = {
  id: 'customer_loyalty_audit',
  name: 'Customer Loyalty Audit',
  description: 'Analyzes customer satisfaction, loyalty program effectiveness, and repeat purchase behavior',
  bucket: 'Retention',
  primaryDataSource: 'CRM System/Customer Survey Tools',
  metrics: [
    {
      id: 'customer_ltv',
      name: 'Customer Lifetime Value',
      description: 'Average total value of a customer relationship',
      unit: '$',
      targetRange: { min: 0, max: 10000, ideal: 5000 },
      statusRanges: {
        good: [3000, 10000],
        warning: [1000, 2999],
        poor: [0, 999]
      },
      interpretationGuidance: 'Higher is better. Target varies widely by industry.'
    },
    {
      id: 'retention_rate',
      name: 'Retention Rate',
      description: 'Percentage of customers retained over a given period',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 85 },
      statusRanges: {
        good: [70, 100],
        warning: [40, 69],
        poor: [0, 39]
      },
      interpretationGuidance: 'Higher is better. Industry benchmarks vary significantly.'
    },
    {
      id: 'nps_score',
      name: 'NPS Score',
      description: 'Net Promoter Score measuring customer loyalty',
      unit: 'numeric',
      targetRange: { min: -100, max: 100, ideal: 50 },
      statusRanges: {
        good: [30, 100],
        warning: [0, 29],
        poor: [-100, -1]
      },
      interpretationGuidance: 'Higher is better. Above 30 is generally considered good.'
    },
    {
      id: 'repeat_purchase_rate',
      name: 'Repeat Purchase Rate',
      description: 'Percentage of customers making multiple purchases',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 60 },
      statusRanges: {
        good: [40, 100],
        warning: [20, 39],
        poor: [0, 19]
      },
      interpretationGuidance: 'Higher is better. Indicates strong customer loyalty.'
    }
  ],
  findingCategories: [
    {
      id: 'satisfaction_issues',
      name: 'Satisfaction Issues',
      description: 'Problems affecting customer satisfaction'
    },
    {
      id: 'loyalty_program',
      name: 'Loyalty Program Issues',
      description: 'Problems with loyalty program structure or execution'
    },
    {
      id: 'retention_barriers',
      name: 'Retention Barriers',
      description: 'Obstacles preventing customer retention'
    },
    {
      id: 'engagement_problems',
      name: 'Engagement Problems',
      description: 'Issues with ongoing customer engagement'
    }
  ],
  aiPrompt: `
    Extract and structure information from this Customer Loyalty Audit report.
    
    1. Identify key metrics:
       - Customer Lifetime Value ($)
       - Retention Rate (%)
       - NPS Score (-100 to 100)
       - Repeat Purchase Rate (%)
    
    2. Extract findings related to:
       - Satisfaction Issues
       - Loyalty Program Issues
       - Retention Barriers
       - Engagement Problems
    
    3. Extract recommendations in priority order.
    
    4. Provide an executive summary of the report.
    
    Format your response as a structured JSON object.
  `
};

// Collection of all audit type definitions
export const AUDIT_DEFINITIONS: Record<string, AuditTypeDefinition> = {
  martech_audit: martechAudit,
  analytics_audit: analyticsAudit,
  seo_audit: seoAudit,
  website_performance_audit: websitePerformanceAudit,
  customer_loyalty_audit: customerLoyaltyAudit,
  // Add other audit definitions here
};

// Get audit definition by ID
export function getAuditDefinition(id: string): AuditTypeDefinition | undefined {
  return AUDIT_DEFINITIONS[id];
}

// Get all audit definitions for a specific bucket
export function getAuditDefinitionsByBucket(bucket: string): AuditTypeDefinition[] {
  return Object.values(AUDIT_DEFINITIONS).filter(def => def.bucket === bucket);
} 