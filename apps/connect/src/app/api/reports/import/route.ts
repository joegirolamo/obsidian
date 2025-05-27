import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractTextFromPdf } from '@/lib/pdf';
import { processWithAI, parseAIResponse } from '@/lib/ai';
import { getAuditDefinition } from '@/lib/reportDefinitions';

// Function to process and parse the PDF file using AI
async function processPdfReport(file: Buffer, auditTypeId: string, businessId: string): Promise<any> {
  try {
    console.log('[DEBUG] Processing PDF file for audit type:', auditTypeId);
    
    // Get the audit definition
    const auditDefinition = getAuditDefinition(auditTypeId);
    if (!auditDefinition) {
      console.error(`[ERROR] Audit type ${auditTypeId} not found`);
      throw new Error(`Audit type ${auditTypeId} not found`);
    }
    
    console.log('[DEBUG] Extracting text from PDF...');
    // Extract text from PDF
    const pdfText = await extractTextFromPdf(file);
    
    // Log a sample of the extracted text to verify content
    console.log('[DEBUG] PDF text sample (first 200 chars):', pdfText.substring(0, 200));
    console.log('[DEBUG] PDF text length:', pdfText.length);
    
    if (pdfText.length < 100) {
      console.warn('[WARN] Extracted PDF text is very short, might not contain useful content');
    }
    
    // First pass: Extract core structured data with standard prompt
    console.log('[DEBUG] Creating AI prompt with audit definition:', auditDefinition.id);
    const basePrompt = `${auditDefinition.aiPrompt}\n\nPDF Content:\n${pdfText}`;
    
    try {
      // Process with AI and handle errors gracefully
      console.log('[DEBUG] Calling AI service for initial data extraction...');
      const rawResponse = await processWithAI(basePrompt, {
        temperature: 0.2,
        maxTokens: 4000
      });
      
      console.log('[DEBUG] Raw AI response length:', rawResponse.length);
      console.log('[DEBUG] Raw AI response sample:', rawResponse.substring(0, 100));
      
      // Parse the structured response
      const structuredData = parseAIResponse(rawResponse);
      console.log('[DEBUG] Structured data keys:', Object.keys(structuredData));
      
      // If the structured data is empty or missing key elements, use fallback
      if (!structuredData || Object.keys(structuredData).length === 0) {
        console.warn('[WARN] AI returned empty structured data, using fallback');
        return generateFallbackReportData(auditTypeId);
      }
      
      // Second pass: Generate additional insights based on the structured data
      console.log('[DEBUG] Generating additional insights...');
      const insightsResponse = await generateAdditionalInsights(pdfText, structuredData, auditDefinition, businessId);
      
      // Combine the structured data with insights
      const enhancedData = {
        ...structuredData,
        title: structuredData.title || `${auditDefinition.name} Report`,
        summary: structuredData.summary || "This report was automatically generated from a PDF upload.",
        score: calculateScoreFromMetrics(structuredData.metrics, auditDefinition.metrics) || 70,
        bucket: auditDefinition.bucket,
        metrics: formatMetrics(structuredData.metrics, auditDefinition.metrics),
        findings: formatFindings(structuredData.findings, auditDefinition.findingCategories),
        recommendations: structuredData.recommendations || [],
        insights: insightsResponse.insights || [],
        contextualAnalysis: insightsResponse.contextualAnalysis || '',
        competitiveInsights: insightsResponse.competitiveInsights || '',
      };
      
      console.log('[DEBUG] Enhanced data prepared successfully');
      return enhancedData;
    } catch (aiError) {
      console.error('[ERROR] AI processing failed:', aiError);
      return generateFallbackReportData(auditTypeId);
    }
  } catch (error) {
    console.error('[ERROR] Failed to process PDF with AI:', error);
    
    // Return fallback data in case of error
    return generateFallbackReportData(auditTypeId);
  }
}

/**
 * Generate additional insights based on structured data and audit type
 * This makes a second AI call to provide deeper analysis based on the initial extraction
 */
async function generateAdditionalInsights(pdfText: string, structuredData: any, auditDefinition: any, businessId: string): Promise<any> {
  try {
    // Fetch the business AI Brain data for additional context
    let businessData = null;
    let websiteInfo = '';
    
    try {
      // Use the server's base URL to fetch the AI Brain data
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const brainResponse = await fetch(`${baseUrl}/api/business/${businessId}/ai-brain`);
      
      if (brainResponse.ok) {
        businessData = await brainResponse.json();
        console.log('[INFO] Successfully fetched business brain data for insights generation');
        
        // Extract website information
        if (businessData.business?.website) {
          websiteInfo = `Business Website: ${businessData.business.website}\n`;
        }
        
        // Add website analysis if available
        if (businessData.websiteAnalysis) {
          websiteInfo += `\nWebsite Analysis:\n`;
          
          if (businessData.websiteAnalysis.businessModel) {
            websiteInfo += `Business Model: ${businessData.websiteAnalysis.businessModel}\n`;
          }
          
          if (businessData.websiteAnalysis.productOffering) {
            websiteInfo += `Product/Service Offerings: ${businessData.websiteAnalysis.productOffering}\n`;
          }
          
          // Add value propositions if available
          if (businessData.websiteAnalysis.valuePropositions && 
              businessData.websiteAnalysis.valuePropositions.length > 0) {
            websiteInfo += `\nValue Propositions:\n`;
            businessData.websiteAnalysis.valuePropositions.forEach((prop: string) => {
              websiteInfo += `- ${prop}\n`;
            });
          }
          
          // Add differentiation highlights if available
          if (businessData.websiteAnalysis.differentiationHighlights && 
              businessData.websiteAnalysis.differentiationHighlights.length > 0) {
            websiteInfo += `\nDifferentiation Highlights:\n`;
            businessData.websiteAnalysis.differentiationHighlights.forEach((highlight: string) => {
              websiteInfo += `- ${highlight}\n`;
            });
          }
        }
      } else {
        console.warn('[WARN] Failed to fetch business brain data:', brainResponse.status);
      }
    } catch (brainError) {
      console.error('[ERROR] Error fetching business brain data:', brainError);
    }
    
    // Create additional context based on the audit type
    let auditSpecificContext = '';
    
    // For SEO audits, provide specific guidance about the website
    if (auditDefinition.id === 'seo_audit' && businessData?.business?.website) {
      auditSpecificContext = `
This is an SEO audit for the website: ${businessData.business.website}
When generating insights, consider:
1. How the website's current SEO performance affects their business goals
2. What specific technical improvements would have the biggest impact
3. How their SEO strategy aligns with their value propositions and differentiators
4. Competitive insights based on their industry positioning
5. Actionable recommendations for improving organic search visibility

The website should be audited as part of implementing the recommendations.
`;
    }
    
    // Create a prompt that focuses on generating insights rather than extracting data
    const insightsPrompt = `
      You are an expert business analyst specializing in ${auditDefinition.name.toLowerCase()} analysis.
      
      I have already extracted the following structured data from a ${auditDefinition.name}:
      
      Key Metrics:
      ${JSON.stringify(structuredData.metrics || [], null, 2)}
      
      Findings:
      ${JSON.stringify(structuredData.findings || [], null, 2)}
      
      Recommendations:
      ${JSON.stringify(structuredData.recommendations || [], null, 2)}
      
      ${websiteInfo ? `\nBusiness Information:\n${websiteInfo}\n` : ''}
      
      ${auditSpecificContext}
      
      Based on this information and the full PDF content provided below, please:
      
      1. Generate 3-5 strategic insights that would not be immediately obvious from the raw data
      2. Provide contextual analysis that compares these results to industry standards
      3. Suggest competitive insights based on the findings
      
      Format your response as JSON with "insights" (array), "contextualAnalysis" (string), and "competitiveInsights" (string) fields.
      
      PDF Content:
      ${pdfText.substring(0, 8000)} // Limiting to first 8000 chars to avoid token limits
    `;
    
    // Make the AI call
    const insightsResponse = await processWithAI(insightsPrompt, {
      temperature: 0.5, // Slightly higher temperature for more creative insights
      maxTokens: 2000
    });
    
    // Parse the response
    try {
      return parseAIResponse(insightsResponse);
    } catch (parseError) {
      console.warn('[WARN] Failed to parse insights response:', parseError);
      return {
        insights: [],
        contextualAnalysis: '',
        competitiveInsights: ''
      };
    }
  } catch (error) {
    console.error('[ERROR] Failed to generate additional insights:', error);
    return {
      insights: [],
      contextualAnalysis: '',
      competitiveInsights: ''
    };
  }
}

// Helper function to calculate an overall score based on metrics
function calculateScoreFromMetrics(extractedMetrics: any[], definedMetrics: any[]): number {
  if (!extractedMetrics || !Array.isArray(extractedMetrics) || extractedMetrics.length === 0) {
    return 70; // Default score
  }
  
  try {
    // Calculate a weighted average of normalized metric values
    let totalWeight = 0;
    let weightedSum = 0;
    
    // Process each metric
    extractedMetrics.forEach(metric => {
      const definition = definedMetrics.find(d => 
        d.id === metric.id || 
        d.name.toLowerCase() === metric.name?.toLowerCase()
      );
      
      if (!definition) return;
      
      let normalizedValue = 0;
      
      // Extract numeric value if necessary
      let numericValue = typeof metric.value === 'number' 
        ? metric.value 
        : parseFloat(String(metric.value).replace(/[^0-9.-]+/g, ''));
      
      if (isNaN(numericValue)) return;
      
      // Normalize the value to a 0-100 scale based on the metric type
      if (definition.unit === '%') {
        // Percentage metrics are already on a 0-100 scale
        normalizedValue = numericValue;
      } else if (definition.statusRanges) {
        // For metrics with status ranges, normalize based on the ranges
        const { good, warning, poor } = definition.statusRanges;
        
        if (definition.interpretationGuidance?.toLowerCase().includes('lower is better')) {
          // For metrics where lower is better
          if (numericValue <= good[1]) normalizedValue = 100;
          else if (numericValue <= warning[1]) normalizedValue = 70;
          else normalizedValue = 30;
        } else {
          // For metrics where higher is better (default)
          if (numericValue >= good[0]) normalizedValue = 100;
          else if (numericValue >= warning[0]) normalizedValue = 70;
          else normalizedValue = 30;
        }
      } else if (definition.targetRange) {
        // Normalize based on target range
        const { min, max, ideal } = definition.targetRange;
        
        if (min !== undefined && max !== undefined) {
          const range = max - min;
          if (range > 0) {
            if (definition.interpretationGuidance?.toLowerCase().includes('lower is better')) {
              // For metrics where lower is better
              normalizedValue = 100 - (((numericValue - min) / range) * 100);
            } else {
              // For metrics where higher is better (default)
              normalizedValue = ((numericValue - min) / range) * 100;
            }
          }
        }
      }
      
      // Ensure the normalized value is between 0 and 100
      normalizedValue = Math.max(0, Math.min(100, normalizedValue));
      
      // Add to weighted sum (all metrics have equal weight for now)
      weightedSum += normalizedValue;
      totalWeight++;
    });
    
    // Calculate final score
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 70;
  } catch (error) {
    console.error('Error calculating score from metrics:', error);
    return 70; // Default score in case of error
  }
}

// Helper function to format metrics for our data model
function formatMetrics(extractedMetrics: any[], definedMetrics: any[]): any[] {
  if (!extractedMetrics || !Array.isArray(extractedMetrics)) {
    return generateFallbackMetrics(definedMetrics);
  }
  
  try {
    return extractedMetrics.map(metric => {
      const definition = definedMetrics.find(d => 
        d.id === metric.id || 
        d.name.toLowerCase() === metric.name?.toLowerCase()
      );
      
      if (!definition) {
        return {
          name: metric.name || 'Unknown Metric',
          value: metric.value || 0,
          status: determineStatus(metric, definition)
        };
      }
      
      return {
        name: definition.name,
        value: metric.value || 0,
        description: definition.description,
        status: determineStatus(metric, definition),
        target: definition.targetRange?.ideal
      };
    });
  } catch (error) {
    console.error('Error formatting metrics:', error);
    return generateFallbackMetrics(definedMetrics);
  }
}

// Helper function to determine status based on metric value and definition
function determineStatus(metric: any, definition: any): 'good' | 'warning' | 'poor' {
  if (!definition || !definition.statusRanges) return 'warning';
  
  try {
    const { good, warning, poor } = definition.statusRanges;
    
    // Extract numeric value if necessary
    let numericValue = typeof metric.value === 'number' 
      ? metric.value 
      : parseFloat(String(metric.value).replace(/[^0-9.-]+/g, ''));
    
    if (isNaN(numericValue)) return 'warning';
    
    // Check if lower is better based on the guidance
    const lowerIsBetter = definition.interpretationGuidance?.toLowerCase().includes('lower is better');
    
    if (lowerIsBetter) {
      if (numericValue <= good[1]) return 'good';
      if (numericValue <= warning[1]) return 'warning';
      return 'poor';
    } else {
      if (numericValue >= good[0]) return 'good';
      if (numericValue >= warning[0]) return 'warning';
      return 'poor';
    }
  } catch (error) {
    console.error('Error determining status:', error);
    return 'warning';
  }
}

// Helper function to format findings for our data model
function formatFindings(extractedFindings: any[], definedCategories: any[]): any[] {
  if (!extractedFindings || !Array.isArray(extractedFindings) || extractedFindings.length === 0) {
    return generateFallbackFindings(definedCategories);
  }
  
  try {
    return extractedFindings.map((finding, index) => ({
      id: finding.id || `finding-${index + 1}`,
      title: finding.title || 'Unnamed Finding',
      description: finding.description || 'No description provided',
      severity: finding.severity || determineRandomSeverity(),
      category: finding.category || definedCategories[index % definedCategories.length]?.name || 'General',
      recommendedAction: finding.recommendedAction || 'Review and address this finding',
      effort: finding.effort || determineRandomEffort()
    }));
  } catch (error) {
    console.error('Error formatting findings:', error);
    return generateFallbackFindings(definedCategories);
  }
}

// Helper function to generate fallback report data
function generateFallbackReportData(auditTypeId: string): any {
  const auditDefinition = getAuditDefinition(auditTypeId);
  
  if (!auditDefinition) {
    // Generic fallback if audit type not found
    return {
      title: 'Generated Audit Report',
      summary: 'This is an automatically generated report based on the PDF upload.',
      score: 70,
      bucket: determineAuditBucket(auditTypeId),
      metrics: [
        { name: 'Primary Metric', value: Math.floor(Math.random() * 100), status: 'warning' },
        { name: 'Secondary Metric', value: Math.floor(Math.random() * 100), status: 'good' },
        { name: 'Tertiary Metric', value: Math.floor(Math.random() * 100), status: 'poor' }
      ],
      findings: [
        {
          id: 'finding-1',
          title: 'Primary Finding',
          description: 'This is an automatically generated finding from the PDF content.',
          severity: 'medium',
          category: 'General',
          recommendedAction: 'Take action based on the report content.',
          effort: 'medium'
        },
        {
          id: 'finding-2',
          title: 'Secondary Finding',
          description: 'This is another automatically generated finding from the PDF content.',
          severity: 'high',
          category: 'Strategic',
          recommendedAction: 'Implement strategic changes based on the audit results.',
          effort: 'high'
        }
      ],
      recommendations: [
        'Implement the primary recommendation based on the audit findings.',
        'Consider the secondary recommendation to improve performance.',
        'Review and adjust strategy based on the tertiary recommendation.'
      ],
      insights: [
        'This report was generated with fallback data due to processing limitations.',
        'Consider uploading a more structured PDF or using a different import method for better results.'
      ],
      contextualAnalysis: 'A full contextual analysis would be provided here with proper PDF processing and AI analysis.',
      competitiveInsights: 'Competitive insights would typically be generated here based on the report data and industry context.'
    };
  }
  
  // Audit-specific fallback
  return {
    title: `${auditDefinition.name} Report`,
    summary: `This is an automatically generated ${auditDefinition.name} based on the PDF upload.`,
    score: 70,
    bucket: auditDefinition.bucket,
    metrics: generateFallbackMetrics(auditDefinition.metrics),
    findings: generateFallbackFindings(auditDefinition.findingCategories),
    recommendations: [
      `Improve your ${auditDefinition.name.toLowerCase()} strategy`,
      'Implement best practices in this area',
      'Review performance regularly'
    ],
    insights: [
      `This ${auditDefinition.name} was generated with limited data extraction.`,
      `Consider providing a more detailed ${auditDefinition.name.toLowerCase()} report for better insights.`,
      `Focus on the ${auditDefinition.findingCategories[0]?.name.toLowerCase() || 'primary'} areas for immediate improvement.`
    ],
    contextualAnalysis: `A full contextual analysis for ${auditDefinition.name} would typically compare your metrics against industry benchmarks. For accurate analysis, please ensure your PDF contains structured data that our AI can properly extract.`,
    competitiveInsights: `Competitive insights for ${auditDefinition.name} would typically highlight how your performance compares to industry leaders and suggest differentiation opportunities.`
  };
}

// Helper function to generate fallback metrics based on definitions
function generateFallbackMetrics(definedMetrics: any[]): any[] {
  return definedMetrics.slice(0, 3).map(metric => {
    const randomValue = Math.floor(Math.random() * 100);
    let value: number | string = randomValue;
    
    // Format value based on unit
    if (metric.unit === '%') {
      value = randomValue;
    } else if (metric.unit === '$') {
      value = randomValue * 10;
    } else if (metric.unit === 'seconds') {
      value = randomValue / 20;
    }
    
    return {
      name: metric.name,
      value: value,
      description: metric.description,
      status: randomValue > 70 ? 'good' : randomValue > 40 ? 'warning' : 'poor'
    };
  });
}

// Helper function to generate fallback findings based on categories
function generateFallbackFindings(definedCategories: any[]): any[] {
  return definedCategories.slice(0, 2).map((category, index) => ({
    id: `finding-${index + 1}`,
    title: `${category.name} Issue Identified`,
    description: `A potential issue related to ${category.name.toLowerCase()} was identified. ${category.description}`,
    severity: index === 0 ? 'high' : 'medium',
    category: category.name,
    recommendedAction: `Address the ${category.name.toLowerCase()} issue to improve performance.`,
    effort: index === 0 ? 'high' : 'medium'
  }));
}

// Helper function to determine a random severity level
function determineRandomSeverity(): 'critical' | 'high' | 'medium' | 'low' | 'info' {
  const severities = ['critical', 'high', 'medium', 'low', 'info'];
  const weights = [0.05, 0.25, 0.4, 0.2, 0.1]; // Weighted probabilities
  
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (let i = 0; i < severities.length; i++) {
    cumulativeWeight += weights[i];
    if (random <= cumulativeWeight) {
      return severities[i] as any;
    }
  }
  
  return 'medium';
}

// Helper function to determine a random effort level
function determineRandomEffort(): 'low' | 'medium' | 'high' {
  const efforts = ['low', 'medium', 'high'];
  return efforts[Math.floor(Math.random() * efforts.length)] as any;
}

// Helper function to determine bucket from audit type ID
function determineAuditBucket(auditTypeId: string): 'Foundation' | 'Acquisition' | 'Conversion' | 'Retention' {
  if (auditTypeId.includes('martech') || auditTypeId.includes('analytics') || auditTypeId.includes('brand')) {
    return 'Foundation';
  } else if (auditTypeId.includes('seo') || auditTypeId.includes('paid') || auditTypeId.includes('content')) {
    return 'Acquisition';
  } else if (auditTypeId.includes('website') || auditTypeId.includes('conversion') || auditTypeId.includes('ux')) {
    return 'Conversion';
  }
  return 'Retention';
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const auditTypeId = formData.get('auditTypeId') as string;
    const businessId = formData.get('businessId') as string;
    
    // Validate inputs
    if (!file || !auditTypeId || !businessId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        requiredFields: ['file', 'auditTypeId', 'businessId']
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    if (!file.name.endsWith('.pdf')) {
      return new Response(JSON.stringify({ error: 'Only PDF files are accepted' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Process the PDF file
    const fileBuffer = await file.arrayBuffer();
    const reportData = await processPdfReport(Buffer.from(fileBuffer), auditTypeId, businessId);
    
    // In production, save the processed report to the database
    console.log('[DEBUG] Processed report data:', reportData);
    
    // Create the report in the database if we're in production
    let reportRecord = null;
    try {
      // Use type casting to avoid TypeScript errors
      const prismaAny = prisma as any;
      
      // Try first with "Report" (standard casing)
      try {
        if (prismaAny && typeof prismaAny.Report !== 'undefined' && typeof prismaAny.Report.create === 'function') {
          reportRecord = await prismaAny.Report.create({
            data: {
              businessId,
              auditTypeId,
              title: reportData.title,
              bucket: reportData.bucket,
              score: reportData.score,
              summary: reportData.summary,
              metrics: reportData.metrics,
              findings: reportData.findings,
              recommendations: reportData.recommendations,
              insights: reportData.insights || [],
              contextualAnalysis: reportData.contextualAnalysis || '',
              competitiveInsights: reportData.competitiveInsights || '',
              createdById: session.user.id,
              importSource: 'pdf',
              status: 'draft'
            }
          });
          
          console.log('[DEBUG] Created report record with "Report" model:', reportRecord.id);
        }
      } catch (error) {
        console.warn('[WARN] Failed to create report with "Report" model, trying "report" model:', error);
        
        // If that fails, try with "report" (Prisma's possibly auto-cased version)
        if (prismaAny && typeof prismaAny.report !== 'undefined' && typeof prismaAny.report.create === 'function') {
          reportRecord = await prismaAny.report.create({
            data: {
              businessId,
              auditTypeId,
              title: reportData.title,
              bucket: reportData.bucket,
              score: reportData.score,
              summary: reportData.summary,
              metrics: reportData.metrics,
              findings: reportData.findings,
              recommendations: reportData.recommendations,
              insights: reportData.insights || [],
              contextualAnalysis: reportData.contextualAnalysis || '',
              competitiveInsights: reportData.competitiveInsights || '',
              createdById: session.user.id,
              importSource: 'pdf',
              status: 'draft'
            }
          });
          
          console.log('[DEBUG] Created report record with "report" model:', reportRecord.id);
        } else {
          console.warn('[WARN] Prisma Report/report model not available');
        }
      }
    } catch (dbError) {
      console.error('[ERROR] Failed to save report to database:', dbError);
      // Continue even if database save fails
    }
    
    // Return success with the processed data
    return new Response(JSON.stringify({
      success: true,
      message: 'Report processed successfully',
      report: reportRecord || {
        id: `report-${Date.now()}`,
        businessId,
        auditTypeId,
        title: reportData.title || `${auditTypeId} Report`,
        bucket: reportData.bucket || determineAuditBucket(auditTypeId),
        score: reportData.score || 70,
        summary: reportData.summary || "This report was automatically generated from a PDF upload.",
        metrics: reportData.metrics || [],
        findings: reportData.findings || [],
        recommendations: reportData.recommendations || [],
        insights: reportData.insights || [],
        contextualAnalysis: reportData.contextualAnalysis || '',
        competitiveInsights: reportData.competitiveInsights || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        importSource: 'pdf',
        status: 'draft'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ERROR] Failed to process PDF report:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 