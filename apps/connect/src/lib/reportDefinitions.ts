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

// Foundation: Brand Consistency Audit
const brandAudit: AuditTypeDefinition = {
  id: 'brand_audit',
  name: 'Brand Consistency Audit',
  description: 'Analyzes brand consistency across channels, messaging alignment, and visual identity compliance',
  bucket: 'Foundation',
  primaryDataSource: 'Brand Guidelines and Marketing Materials',
  metrics: [
    {
      id: 'brand_consistency_score',
      name: 'Brand Consistency Score',
      description: 'Overall consistency of brand elements across channels',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 90 },
      statusRanges: {
        good: [80, 100],
        warning: [60, 79],
        poor: [0, 59]
      },
      interpretationGuidance: 'Higher is better. Measures consistent application of brand elements.'
    },
    {
      id: 'messaging_alignment',
      name: 'Messaging Alignment',
      description: 'Consistency of brand messaging and tone of voice',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 85 },
      statusRanges: {
        good: [75, 100],
        warning: [50, 74],
        poor: [0, 49]
      },
      interpretationGuidance: 'Higher is better. Measures alignment with core brand messaging.'
    },
    {
      id: 'visual_identity_compliance',
      name: 'Visual Identity Compliance',
      description: 'Adherence to visual brand guidelines',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 95 },
      statusRanges: {
        good: [85, 100],
        warning: [60, 84],
        poor: [0, 59]
      },
      interpretationGuidance: 'Higher is better. Measures compliance with visual style guide.'
    },
    {
      id: 'brand_perception_score',
      name: 'Brand Perception Score',
      description: 'How the brand is perceived by target audience',
      unit: 'numeric',
      targetRange: { min: 0, max: 10, ideal: 8 },
      statusRanges: {
        good: [7, 10],
        warning: [5, 6.9],
        poor: [0, 4.9]
      },
      interpretationGuidance: 'Higher is better. Measures audience perception alignment with brand goals.'
    }
  ],
  findingCategories: [
    {
      id: 'visual_inconsistencies',
      name: 'Visual Inconsistencies',
      description: 'Inconsistencies in visual brand elements across channels'
    },
    {
      id: 'messaging_gaps',
      name: 'Messaging Gaps',
      description: 'Inconsistencies or gaps in brand messaging'
    },
    {
      id: 'channel_specific_issues',
      name: 'Channel-Specific Issues',
      description: 'Brand inconsistencies specific to certain marketing channels'
    },
    {
      id: 'guideline_compliance',
      name: 'Guideline Compliance',
      description: 'Areas where brand guidelines aren\'t being followed'
    }
  ],
  aiPrompt: `
    Extract and structure information from this Brand Consistency Audit report.
    
    1. Identify key metrics:
       - Brand Consistency Score (%)
       - Messaging Alignment (%)
       - Visual Identity Compliance (%)
       - Brand Perception Score (0-10)
    
    2. Extract findings related to:
       - Visual Inconsistencies
       - Messaging Gaps
       - Channel-Specific Issues
       - Guideline Compliance
    
    3. Extract recommendations in priority order.
    
    4. Provide an executive summary of the report.
    
    Format your response as a structured JSON object.
  `
};

// Foundation: Data Privacy & Compliance Audit
const complianceAudit: AuditTypeDefinition = {
  id: 'compliance_audit',
  name: 'Data Privacy & Compliance Audit',
  description: 'Evaluates regulatory compliance, privacy policies, and data handling practices',
  bucket: 'Foundation',
  primaryDataSource: 'Privacy Policies and Data Handling Documentation',
  metrics: [
    {
      id: 'compliance_score',
      name: 'Compliance Score',
      description: 'Overall compliance with applicable regulations',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 95 },
      statusRanges: {
        good: [90, 100],
        warning: [70, 89],
        poor: [0, 69]
      },
      interpretationGuidance: 'Higher is better. Measures adherence to relevant regulations.'
    },
    {
      id: 'risk_assessment',
      name: 'Risk Assessment',
      description: 'Level of risk related to data privacy compliance',
      unit: 'numeric',
      targetRange: { min: 0, max: 10, ideal: 2 },
      statusRanges: {
        good: [0, 3],
        warning: [4, 6],
        poor: [7, 10]
      },
      interpretationGuidance: 'Lower is better. Measures potential compliance risk exposure.'
    },
    {
      id: 'gdpr_ccpa_readiness',
      name: 'GDPR/CCPA Readiness',
      description: 'Level of preparedness for key privacy regulations',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 100 },
      statusRanges: {
        good: [85, 100],
        warning: [60, 84],
        poor: [0, 59]
      },
      interpretationGuidance: 'Higher is better. Measures readiness for key privacy regulations.'
    },
    {
      id: 'data_protection_maturity',
      name: 'Data Protection Maturity',
      description: 'Maturity of data protection practices',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 90 },
      statusRanges: {
        good: [80, 100],
        warning: [60, 79],
        poor: [0, 59]
      },
      interpretationGuidance: 'Higher is better. Measures sophistication of data protection practices.'
    }
  ],
  findingCategories: [
    {
      id: 'policy_gaps',
      name: 'Policy Gaps',
      description: 'Gaps in privacy policies or compliance documentation'
    },
    {
      id: 'implementation_issues',
      name: 'Implementation Issues',
      description: 'Problems with implementation of privacy practices'
    },
    {
      id: 'regulatory_risks',
      name: 'Regulatory Risks',
      description: 'Specific risks related to regulatory requirements'
    },
    {
      id: 'data_handling_problems',
      name: 'Data Handling Problems',
      description: 'Issues with how data is collected, stored, or processed'
    }
  ],
  aiPrompt: `
    Extract and structure information from this Data Privacy & Compliance Audit report.
    
    1. Identify key metrics:
       - Compliance Score (%)
       - Risk Assessment (0-10)
       - GDPR/CCPA Readiness (%)
       - Data Protection Maturity (%)
    
    2. Extract findings related to:
       - Policy Gaps
       - Implementation Issues
       - Regulatory Risks
       - Data Handling Problems
    
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

// Acquisition: Paid Media Audit
const paidMediaAudit: AuditTypeDefinition = {
  id: 'paid_media_audit',
  name: 'Paid Media Audit',
  description: 'Analyzes paid campaign structure, budget allocation, creative performance, and audience targeting',
  bucket: 'Acquisition',
  primaryDataSource: 'Advertising Platforms (Google Ads, Meta Ads, etc.)',
  metrics: [
    {
      id: 'roas',
      name: 'ROAS',
      description: 'Return on ad spend across all campaigns',
      unit: 'ratio',
      targetRange: { min: 0, max: 20, ideal: 5 },
      statusRanges: {
        good: [3, 20],
        warning: [1.5, 2.9],
        poor: [0, 1.4]
      },
      interpretationGuidance: 'Higher is better. Target ROAS varies by industry and business model.'
    },
    {
      id: 'cpa_efficiency',
      name: 'CPA Efficiency',
      description: 'Cost per acquisition relative to target',
      unit: '%',
      targetRange: { min: 0, max: 200, ideal: 80 },
      statusRanges: {
        good: [0, 100],
        warning: [101, 150],
        poor: [151, 200]
      },
      interpretationGuidance: 'Lower is better. Below 100% means CPA is under target.'
    },
    {
      id: 'quality_score',
      name: 'Quality Score',
      description: 'Average quality score across paid search campaigns',
      unit: 'numeric',
      targetRange: { min: 1, max: 10, ideal: 8 },
      statusRanges: {
        good: [7, 10],
        warning: [4, 6],
        poor: [1, 3]
      },
      interpretationGuidance: 'Higher is better. Measures ad relevance and landing page experience.'
    },
    {
      id: 'audience_targeting',
      name: 'Audience Targeting Effectiveness',
      description: 'Effectiveness of audience targeting across campaigns',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 85 },
      statusRanges: {
        good: [70, 100],
        warning: [40, 69],
        poor: [0, 39]
      },
      interpretationGuidance: 'Higher is better. Measures how well campaigns reach intended audience.'
    }
  ],
  findingCategories: [
    {
      id: 'campaign_structure',
      name: 'Campaign Structure Issues',
      description: 'Problems with campaign organization or structure'
    },
    {
      id: 'budget_allocation',
      name: 'Budget Allocation Issues',
      description: 'Inefficiencies in budget allocation across campaigns'
    },
    {
      id: 'creative_performance',
      name: 'Creative Performance Issues',
      description: 'Problems with ad creative performance'
    },
    {
      id: 'targeting_issues',
      name: 'Targeting Issues',
      description: 'Problems with audience targeting or segmentation'
    }
  ],
  aiPrompt: `
    Extract and structure information from this Paid Media Audit report.
    
    1. Identify key metrics:
       - ROAS (ratio)
       - CPA Efficiency (%)
       - Quality Score (1-10)
       - Audience Targeting Effectiveness (%)
    
    2. Extract findings related to:
       - Campaign Structure Issues
       - Budget Allocation Issues
       - Creative Performance Issues
       - Targeting Issues
    
    3. Extract recommendations in priority order.
    
    4. Provide an executive summary of the report.
    
    Format your response as a structured JSON object.
  `
};

// Acquisition: Content Marketing Audit
const contentAudit: AuditTypeDefinition = {
  id: 'content_audit',
  name: 'Content Marketing Audit',
  description: 'Assesses content quality, topic coverage, distribution strategy, and performance',
  bucket: 'Acquisition',
  primaryDataSource: 'Content Management System and Analytics',
  metrics: [
    {
      id: 'content_engagement',
      name: 'Content Engagement Rate',
      description: 'Average engagement rate across content pieces',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 25 },
      statusRanges: {
        good: [15, 100],
        warning: [5, 14.9],
        poor: [0, 4.9]
      },
      interpretationGuidance: 'Higher is better. Measures how engaging content is to the audience.'
    },
    {
      id: 'content_gap_score',
      name: 'Content Gap Score',
      description: 'Coverage of target topics in content strategy',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 90 },
      statusRanges: {
        good: [80, 100],
        warning: [50, 79],
        poor: [0, 49]
      },
      interpretationGuidance: 'Higher is better. Measures coverage of target topics.'
    },
    {
      id: 'topic_authority',
      name: 'Topic Authority Rating',
      description: 'Perceived authority on key topic areas',
      unit: 'numeric',
      targetRange: { min: 0, max: 10, ideal: 8 },
      statusRanges: {
        good: [7, 10],
        warning: [4, 6.9],
        poor: [0, 3.9]
      },
      interpretationGuidance: 'Higher is better. Measures domain expertise in content areas.'
    },
    {
      id: 'conversion_rate',
      name: 'Content Conversion Rate',
      description: 'Rate at which content drives desired actions',
      unit: '%',
      targetRange: { min: 0, max: 20, ideal: 5 },
      statusRanges: {
        good: [3, 20],
        warning: [1, 2.9],
        poor: [0, 0.9]
      },
      interpretationGuidance: 'Higher is better. Measures content effectiveness in driving conversions.'
    }
  ],
  findingCategories: [
    {
      id: 'quality_issues',
      name: 'Quality Issues',
      description: 'Problems with content quality or relevance'
    },
    {
      id: 'topic_coverage',
      name: 'Topic Coverage Gaps',
      description: 'Missing or inadequate coverage of key topics'
    },
    {
      id: 'distribution_problems',
      name: 'Distribution Problems',
      description: 'Issues with content distribution or promotion'
    },
    {
      id: 'performance_issues',
      name: 'Performance Issues',
      description: 'Problems with content performance or conversion'
    }
  ],
  aiPrompt: `
    Extract and structure information from this Content Marketing Audit report.
    
    1. Identify key metrics:
       - Content Engagement Rate (%)
       - Content Gap Score (%)
       - Topic Authority Rating (0-10)
       - Content Conversion Rate (%)
    
    2. Extract findings related to:
       - Quality Issues
       - Topic Coverage Gaps
       - Distribution Problems
       - Performance Issues
    
    3. Extract recommendations in priority order.
    
    4. Provide an executive summary of the report.
    
    Format your response as a structured JSON object.
  `
};

// Acquisition: Channel Mix Audit
const channelMixAudit: AuditTypeDefinition = {
  id: 'channel_mix_audit',
  name: 'Channel Mix Audit',
  description: 'Evaluates marketing channel effectiveness, budget allocation, and cross-channel synergy',
  bucket: 'Acquisition',
  primaryDataSource: 'Marketing Analytics and Attribution Tools',
  metrics: [
    {
      id: 'channel_efficiency',
      name: 'Channel Efficiency Score',
      description: 'Efficiency of marketing spend across channels',
      unit: '%',
      targetRange: { min: 0, max: 200, ideal: 120 },
      statusRanges: {
        good: [100, 200],
        warning: [70, 99],
        poor: [0, 69]
      },
      interpretationGuidance: 'Higher is better. Measures ROI efficiency across channels.'
    },
    {
      id: 'acquisition_cost',
      name: 'Acquisition Cost by Channel',
      description: 'Average cost of acquisition across channels',
      unit: '$',
      targetRange: { min: 0, max: 500, ideal: 50 },
      statusRanges: {
        good: [0, 100],
        warning: [101, 250],
        poor: [251, 500]
      },
      interpretationGuidance: 'Lower is better. Measures cost efficiency of customer acquisition.'
    },
    {
      id: 'channel_balance',
      name: 'Channel Mix Balance',
      description: 'Balance of investment across marketing channels',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 80 },
      statusRanges: {
        good: [70, 100],
        warning: [40, 69],
        poor: [0, 39]
      },
      interpretationGuidance: 'Higher is better. Measures optimal distribution across channels.'
    },
    {
      id: 'attribution_clarity',
      name: 'Attribution Clarity',
      description: 'Clarity of channel attribution in the customer journey',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 85 },
      statusRanges: {
        good: [70, 100],
        warning: [40, 69],
        poor: [0, 39]
      },
      interpretationGuidance: 'Higher is better. Measures confidence in attribution model.'
    }
  ],
  findingCategories: [
    {
      id: 'channel_inefficiencies',
      name: 'Channel Inefficiencies',
      description: 'Inefficiencies in specific marketing channels'
    },
    {
      id: 'budget_misallocation',
      name: 'Budget Misallocation',
      description: 'Suboptimal allocation of marketing budget'
    },
    {
      id: 'channel_gaps',
      name: 'Channel Gaps',
      description: 'Missing or underutilized marketing channels'
    },
    {
      id: 'attribution_issues',
      name: 'Attribution Issues',
      description: 'Problems with attribution modeling or tracking'
    }
  ],
  aiPrompt: `
    Extract and structure information from this Channel Mix Audit report.
    
    1. Identify key metrics:
       - Channel Efficiency Score (%)
       - Acquisition Cost by Channel ($)
       - Channel Mix Balance (%)
       - Attribution Clarity (%)
    
    2. Extract findings related to:
       - Channel Inefficiencies
       - Budget Misallocation
       - Channel Gaps
       - Attribution Issues
    
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

// Conversion: Conversion Path Audit
const conversionPathAudit: AuditTypeDefinition = {
  id: 'conversion_path_audit',
  name: 'Conversion Path Audit',
  description: 'Evaluates conversion path friction, form usability, and checkout process',
  bucket: 'Conversion',
  primaryDataSource: 'Analytics and Heatmap Tools',
  metrics: [
    {
      id: 'funnel_conversion',
      name: 'Funnel Conversion Rate',
      description: 'Overall conversion rate through the funnel',
      unit: '%',
      targetRange: { min: 0, max: 50, ideal: 15 },
      statusRanges: {
        good: [10, 50],
        warning: [3, 9.9],
        poor: [0, 2.9]
      },
      interpretationGuidance: 'Higher is better. Industry benchmarks vary significantly.'
    },
    {
      id: 'drop_off_points',
      name: 'Drop-off Points',
      description: 'Number of significant drop-off points in conversion path',
      unit: 'numeric',
      targetRange: { min: 0, max: 10, ideal: 1 },
      statusRanges: {
        good: [0, 2],
        warning: [3, 5],
        poor: [6, 10]
      },
      interpretationGuidance: 'Lower is better. Fewer drop-off points indicates smoother conversion.'
    },
    {
      id: 'form_completion',
      name: 'Form Completion Rate',
      description: 'Rate at which users complete forms in the conversion path',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 85 },
      statusRanges: {
        good: [70, 100],
        warning: [40, 69],
        poor: [0, 39]
      },
      interpretationGuidance: 'Higher is better. Measures form usability and relevance.'
    },
    {
      id: 'conversion_friction',
      name: 'Conversion Friction Score',
      description: 'Assessment of friction in the conversion process',
      unit: 'numeric',
      targetRange: { min: 0, max: 10, ideal: 2 },
      statusRanges: {
        good: [0, 3],
        warning: [4, 6],
        poor: [7, 10]
      },
      interpretationGuidance: 'Lower is better. Measures obstacles in the conversion path.'
    }
  ],
  findingCategories: [
    {
      id: 'ux_friction',
      name: 'UX Friction Points',
      description: 'User experience issues causing conversion friction'
    },
    {
      id: 'form_issues',
      name: 'Form Issues',
      description: 'Problems with form design or validation'
    },
    {
      id: 'process_complexity',
      name: 'Process Complexity',
      description: 'Unnecessary complexity in conversion processes'
    },
    {
      id: 'trust_elements',
      name: 'Trust Elements',
      description: 'Missing or ineffective trust signals in conversion path'
    }
  ],
  aiPrompt: `
    Extract and structure information from this Conversion Path Audit report.
    
    1. Identify key metrics:
       - Funnel Conversion Rate (%)
       - Drop-off Points (count)
       - Form Completion Rate (%)
       - Conversion Friction Score (0-10)
    
    2. Extract findings related to:
       - UX Friction Points
       - Form Issues
       - Process Complexity
       - Trust Elements
    
    3. Extract recommendations in priority order.
    
    4. Provide an executive summary of the report.
    
    Format your response as a structured JSON object.
  `
};

// Conversion: User Experience Audit
const uxAudit: AuditTypeDefinition = {
  id: 'ux_audit',
  name: 'User Experience Audit',
  description: 'Assesses navigation usability, information architecture, and content accessibility',
  bucket: 'Conversion',
  primaryDataSource: 'User Testing and UX Analytics',
  metrics: [
    {
      id: 'user_satisfaction',
      name: 'User Satisfaction Score',
      description: 'Overall user satisfaction with the experience',
      unit: 'numeric',
      targetRange: { min: 0, max: 10, ideal: 8.5 },
      statusRanges: {
        good: [7.5, 10],
        warning: [5, 7.4],
        poor: [0, 4.9]
      },
      interpretationGuidance: 'Higher is better. Measures subjective user satisfaction.'
    },
    {
      id: 'task_completion',
      name: 'Task Completion Rate',
      description: 'Rate at which users complete common tasks',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 90 },
      statusRanges: {
        good: [80, 100],
        warning: [50, 79],
        poor: [0, 49]
      },
      interpretationGuidance: 'Higher is better. Measures usability effectiveness.'
    },
    {
      id: 'ux_heuristic',
      name: 'UX Heuristic Evaluation',
      description: 'Expert evaluation against UX best practices',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 90 },
      statusRanges: {
        good: [80, 100],
        warning: [60, 79],
        poor: [0, 59]
      },
      interpretationGuidance: 'Higher is better. Measures adherence to UX best practices.'
    },
    {
      id: 'cognitive_load',
      name: 'Cognitive Load Score',
      description: 'Assessment of mental effort required to use the interface',
      unit: 'numeric',
      targetRange: { min: 0, max: 10, ideal: 3 },
      statusRanges: {
        good: [0, 4],
        warning: [5, 7],
        poor: [8, 10]
      },
      interpretationGuidance: 'Lower is better. Measures ease of use and learning.'
    }
  ],
  findingCategories: [
    {
      id: 'navigation_issues',
      name: 'Navigation Issues',
      description: 'Problems with site navigation or wayfinding'
    },
    {
      id: 'information_architecture',
      name: 'Information Architecture Issues',
      description: 'Problems with content organization or structure'
    },
    {
      id: 'accessibility_concerns',
      name: 'Accessibility Concerns',
      description: 'Issues affecting users with disabilities'
    },
    {
      id: 'interaction_design',
      name: 'Interaction Design Problems',
      description: 'Issues with interactive elements or feedback'
    }
  ],
  aiPrompt: `
    Extract and structure information from this User Experience Audit report.
    
    1. Identify key metrics:
       - User Satisfaction Score (0-10)
       - Task Completion Rate (%)
       - UX Heuristic Evaluation (%)
       - Cognitive Load Score (0-10)
    
    2. Extract findings related to:
       - Navigation Issues
       - Information Architecture Issues
       - Accessibility Concerns
       - Interaction Design Problems
    
    3. Extract recommendations in priority order.
    
    4. Provide an executive summary of the report.
    
    Format your response as a structured JSON object.
  `
};

// Conversion: A/B Testing Maturity Audit
const abTestingAudit: AuditTypeDefinition = {
  id: 'ab_testing_audit',
  name: 'A/B Testing Maturity Audit',
  description: 'Evaluates testing program effectiveness, experiment design, and implementation quality',
  bucket: 'Conversion',
  primaryDataSource: 'Testing Platforms and Analytics',
  metrics: [
    {
      id: 'testing_velocity',
      name: 'Testing Velocity',
      description: 'Rate of experiments conducted per month',
      unit: 'numeric',
      targetRange: { min: 0, max: 50, ideal: 15 },
      statusRanges: {
        good: [10, 50],
        warning: [3, 9],
        poor: [0, 2]
      },
      interpretationGuidance: 'Higher is better. Measures testing program activity level.'
    },
    {
      id: 'win_rate',
      name: 'Test Win Rate',
      description: 'Percentage of tests yielding significant improvements',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 35 },
      statusRanges: {
        good: [25, 100],
        warning: [10, 24],
        poor: [0, 9]
      },
      interpretationGuidance: 'Higher is better. Win rates over 25% indicate good testing approach.'
    },
    {
      id: 'implementation_quality',
      name: 'Implementation Quality',
      description: 'Quality of test implementation and execution',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 95 },
      statusRanges: {
        good: [85, 100],
        warning: [70, 84],
        poor: [0, 69]
      },
      interpretationGuidance: 'Higher is better. Measures technical quality of testing.'
    },
    {
      id: 'testing_roi',
      name: 'Testing ROI',
      description: 'Return on investment from testing program',
      unit: 'ratio',
      targetRange: { min: 0, max: 50, ideal: 10 },
      statusRanges: {
        good: [5, 50],
        warning: [2, 4.9],
        poor: [0, 1.9]
      },
      interpretationGuidance: 'Higher is better. Measures business impact of testing program.'
    }
  ],
  findingCategories: [
    {
      id: 'test_design',
      name: 'Test Design Issues',
      description: 'Problems with experiment design or hypothesis formation'
    },
    {
      id: 'implementation_issues',
      name: 'Implementation Issues',
      description: 'Technical problems with test execution'
    },
    {
      id: 'analysis_problems',
      name: 'Analysis Problems',
      description: 'Issues with data analysis or interpretation'
    },
    {
      id: 'program_management',
      name: 'Program Management Issues',
      description: 'Problems with overall testing program management'
    }
  ],
  aiPrompt: `
    Extract and structure information from this A/B Testing Maturity Audit report.
    
    1. Identify key metrics:
       - Testing Velocity (tests per month)
       - Test Win Rate (%)
       - Implementation Quality (%)
       - Testing ROI (ratio)
    
    2. Extract findings related to:
       - Test Design Issues
       - Implementation Issues
       - Analysis Problems
       - Program Management Issues
    
    3. Extract recommendations in priority order.
    
    4. Provide an executive summary of the report.
    
    Format your response as a structured JSON object.
  `
};

// Retention: Email & CRM Audit
const emailCrmAudit: AuditTypeDefinition = {
  id: 'email_crm_audit',
  name: 'Email & CRM Audit',
  description: 'Evaluates email program quality, CRM data cleanliness, and automation workflow effectiveness',
  bucket: 'Retention',
  primaryDataSource: 'Email Platform and CRM System',
  metrics: [
    {
      id: 'email_engagement',
      name: 'Email Engagement Rates',
      description: 'Overall engagement with email communications',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 25 },
      statusRanges: {
        good: [20, 100],
        warning: [10, 19.9],
        poor: [0, 9.9]
      },
      interpretationGuidance: 'Higher is better. Combines open and click rates.'
    },
    {
      id: 'list_health',
      name: 'List Health Score',
      description: 'Quality and cleanliness of email list',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 90 },
      statusRanges: {
        good: [80, 100],
        warning: [60, 79],
        poor: [0, 59]
      },
      interpretationGuidance: 'Higher is better. Measures list quality and hygiene.'
    },
    {
      id: 'automation_effectiveness',
      name: 'Automation Effectiveness',
      description: 'Performance of automated email and CRM workflows',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 85 },
      statusRanges: {
        good: [75, 100],
        warning: [50, 74],
        poor: [0, 49]
      },
      interpretationGuidance: 'Higher is better. Measures automation performance.'
    },
    {
      id: 'data_quality',
      name: 'CRM Data Quality',
      description: 'Accuracy and completeness of CRM data',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 95 },
      statusRanges: {
        good: [85, 100],
        warning: [65, 84],
        poor: [0, 64]
      },
      interpretationGuidance: 'Higher is better. Measures CRM data reliability.'
    }
  ],
  findingCategories: [
    {
      id: 'email_content',
      name: 'Email Content Issues',
      description: 'Problems with email content or design'
    },
    {
      id: 'data_problems',
      name: 'Data Quality Problems',
      description: 'Issues with CRM data quality or management'
    },
    {
      id: 'workflow_issues',
      name: 'Workflow Issues',
      description: 'Problems with automation workflows or triggers'
    },
    {
      id: 'segmentation_problems',
      name: 'Segmentation Problems',
      description: 'Issues with audience segmentation or targeting'
    }
  ],
  aiPrompt: `
    Extract and structure information from this Email & CRM Audit report.
    
    1. Identify key metrics:
       - Email Engagement Rates (%)
       - List Health Score (%)
       - Automation Effectiveness (%)
       - CRM Data Quality (%)
    
    2. Extract findings related to:
       - Email Content Issues
       - Data Quality Problems
       - Workflow Issues
       - Segmentation Problems
    
    3. Extract recommendations in priority order.
    
    4. Provide an executive summary of the report.
    
    Format your response as a structured JSON object.
  `
};

// Retention: Customer Support Audit
const customerSupportAudit: AuditTypeDefinition = {
  id: 'customer_support_audit',
  name: 'Customer Support Audit',
  description: 'Assesses support channel effectiveness, issue resolution efficiency, and customer feedback',
  bucket: 'Retention',
  primaryDataSource: 'Support Ticketing System and Feedback Tools',
  metrics: [
    {
      id: 'response_time',
      name: 'Response Time',
      description: 'Average time to first response on support inquiries',
      unit: 'hours',
      targetRange: { min: 0, max: 48, ideal: 2 },
      statusRanges: {
        good: [0, 4],
        warning: [5, 24],
        poor: [25, 48]
      },
      interpretationGuidance: 'Lower is better. Industry benchmarks vary by support type.'
    },
    {
      id: 'resolution_rate',
      name: 'Resolution Rate',
      description: 'Percentage of issues resolved on first contact',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 80 },
      statusRanges: {
        good: [70, 100],
        warning: [50, 69],
        poor: [0, 49]
      },
      interpretationGuidance: 'Higher is better. Measures support efficiency.'
    },
    {
      id: 'support_satisfaction',
      name: 'Support Satisfaction',
      description: 'Customer satisfaction with support experience',
      unit: 'numeric',
      targetRange: { min: 0, max: 10, ideal: 9 },
      statusRanges: {
        good: [8, 10],
        warning: [6, 7.9],
        poor: [0, 5.9]
      },
      interpretationGuidance: 'Higher is better. Measures quality of support experience.'
    },
    {
      id: 'channel_coverage',
      name: 'Support Channel Coverage',
      description: 'Coverage of relevant support channels',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 90 },
      statusRanges: {
        good: [80, 100],
        warning: [60, 79],
        poor: [0, 59]
      },
      interpretationGuidance: 'Higher is better. Measures breadth of support options.'
    }
  ],
  findingCategories: [
    {
      id: 'response_issues',
      name: 'Response Issues',
      description: 'Problems with support response time or quality'
    },
    {
      id: 'resolution_problems',
      name: 'Resolution Problems',
      description: 'Issues with resolving customer support tickets'
    },
    {
      id: 'channel_gaps',
      name: 'Channel Gaps',
      description: 'Missing or ineffective support channels'
    },
    {
      id: 'feedback_utilization',
      name: 'Feedback Utilization',
      description: 'Problems with using customer feedback effectively'
    }
  ],
  aiPrompt: `
    Extract and structure information from this Customer Support Audit report.
    
    1. Identify key metrics:
       - Response Time (hours)
       - Resolution Rate (%)
       - Support Satisfaction (0-10)
       - Support Channel Coverage (%)
    
    2. Extract findings related to:
       - Response Issues
       - Resolution Problems
       - Channel Gaps
       - Feedback Utilization
    
    3. Extract recommendations in priority order.
    
    4. Provide an executive summary of the report.
    
    Format your response as a structured JSON object.
  `
};

// Retention: App Engagement Audit
const appEngagementAudit: AuditTypeDefinition = {
  id: 'app_engagement_audit',
  name: 'App Engagement Audit',
  description: 'Evaluates app engagement patterns, feature usage, and retention strategies',
  bucket: 'Retention',
  primaryDataSource: 'Mobile Analytics and User Behavior Tools',
  metrics: [
    {
      id: 'user_retention',
      name: 'User Retention',
      description: 'Retention rate of app users over time',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 60 },
      statusRanges: {
        good: [40, 100],
        warning: [20, 39],
        poor: [0, 19]
      },
      interpretationGuidance: 'Higher is better. D30 retention above 40% is excellent for most apps.'
    },
    {
      id: 'session_frequency',
      name: 'Session Frequency',
      description: 'Average number of sessions per user per week',
      unit: 'numeric',
      targetRange: { min: 0, max: 50, ideal: 7 },
      statusRanges: {
        good: [5, 50],
        warning: [2, 4],
        poor: [0, 1]
      },
      interpretationGuidance: 'Higher is better. Target varies by app type.'
    },
    {
      id: 'feature_adoption',
      name: 'Feature Adoption',
      description: 'Adoption rate of key app features',
      unit: '%',
      targetRange: { min: 0, max: 100, ideal: 75 },
      statusRanges: {
        good: [60, 100],
        warning: [30, 59],
        poor: [0, 29]
      },
      interpretationGuidance: 'Higher is better. Measures usage of core features.'
    },
    {
      id: 'session_duration',
      name: 'Session Duration',
      description: 'Average time spent in app per session',
      unit: 'minutes',
      targetRange: { min: 0, max: 60, ideal: 8 },
      statusRanges: {
        good: [5, 60],
        warning: [2, 4.9],
        poor: [0, 1.9]
      },
      interpretationGuidance: 'Target varies by app type; longer isn\'t always better.'
    }
  ],
  findingCategories: [
    {
      id: 'retention_issues',
      name: 'Retention Issues',
      description: 'Problems affecting user retention'
    },
    {
      id: 'engagement_barriers',
      name: 'Engagement Barriers',
      description: 'Obstacles preventing deeper app engagement'
    },
    {
      id: 'feature_adoption_problems',
      name: 'Feature Adoption Problems',
      description: 'Issues with adoption of key features'
    },
    {
      id: 'user_experience_issues',
      name: 'User Experience Issues',
      description: 'UX problems affecting engagement'
    }
  ],
  aiPrompt: `
    Extract and structure information from this App Engagement Audit report.
    
    1. Identify key metrics:
       - User Retention (%)
       - Session Frequency (sessions per week)
       - Feature Adoption (%)
       - Session Duration (minutes)
    
    2. Extract findings related to:
       - Retention Issues
       - Engagement Barriers
       - Feature Adoption Problems
       - User Experience Issues
    
    3. Extract recommendations in priority order.
    
    4. Provide an executive summary of the report.
    
    Format your response as a structured JSON object.
  `
};

// Collection of all audit type definitions
export const AUDIT_DEFINITIONS: Record<string, AuditTypeDefinition> = {
  martech_audit: martechAudit,
  analytics_audit: analyticsAudit,
  brand_audit: brandAudit,
  compliance_audit: complianceAudit,
  seo_audit: seoAudit,
  paid_media_audit: paidMediaAudit,
  content_audit: contentAudit,
  channel_mix_audit: channelMixAudit,
  website_performance_audit: websitePerformanceAudit,
  conversion_path_audit: conversionPathAudit,
  ux_audit: uxAudit,
  ab_testing_audit: abTestingAudit,
  customer_loyalty_audit: customerLoyaltyAudit,
  email_crm_audit: emailCrmAudit,
  customer_support_audit: customerSupportAudit,
  app_engagement_audit: appEngagementAudit,
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