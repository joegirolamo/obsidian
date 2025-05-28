import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { processWithAI, parseAIResponse } from '@/lib/ai';
import { getAuditDefinition } from '@/lib/reportDefinitions';
import { getToken } from 'next-auth/jwt';

/**
 * Processes files uploaded with the report generation request
 * Returns the extracted text content from all files
 */
async function processUploadedFiles(formData: FormData): Promise<{ content: string, fileNames: string[] }> {
  // Get all files from formData
  const files = formData.getAll('files') as File[];
  
  if (!files || files.length === 0) {
    return { content: '', fileNames: [] };
  }
  
  try {
    // Combine content from all files
    const fileContents: string[] = [];
    const fileNames: string[] = [];
    
    for (const file of files) {
      const fileContent = await file.text();
      fileNames.push(file.name);
      fileContents.push(`
=== File: ${file.name} ===
${fileContent}
`);
    }
    
    return { 
      content: fileContents.join('\n\n'),
      fileNames
    };
  } catch (error) {
    console.error('[ERROR] Failed to process uploaded files:', error);
    return { content: '', fileNames: [] };
  }
}

/**
 * Generates a report using AI analysis with optional supporting files
 */
async function generateReport(auditTypeId: string, businessId: string, fileContent: string): Promise<any> {
  try {
    console.log('[DEBUG] Generating report for audit type:', auditTypeId);
    
    // Get the audit definition
    const auditDefinition = getAuditDefinition(auditTypeId);
    if (!auditDefinition) {
      console.error(`[ERROR] Audit type ${auditTypeId} not found`);
      throw new Error(`Audit type ${auditTypeId} not found`);
    }
    
    // Fetch business information from the AI Brain
    let businessContext = '';
    
    try {
      // Use the server's base URL to fetch the AI Brain data
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const brainResponse = await fetch(`${baseUrl}/api/business/${businessId}/ai-brain`);
      
      if (brainResponse.ok) {
        const brainData = await brainResponse.json();
        console.log('[INFO] Successfully fetched business brain data for report generation');
        
        // Extract business information
        if (brainData.business) {
          businessContext += `\nBusiness Information:\n`;
          businessContext += `Name: ${brainData.business.name || 'Unknown'}\n`;
          businessContext += `Website: ${brainData.business.website || 'Not specified'}\n`;
          businessContext += `Industry: ${brainData.business.industry || 'Not specified'}\n`;
        }
        
        // Add website analysis if available
        if (brainData.websiteAnalysis) {
          businessContext += `\nWebsite Analysis:\n`;
          
          if (brainData.websiteAnalysis.businessModel) {
            businessContext += `Business Model: ${brainData.websiteAnalysis.businessModel}\n`;
          }
          
          if (brainData.websiteAnalysis.productOffering) {
            businessContext += `Product/Service Offerings: ${brainData.websiteAnalysis.productOffering}\n`;
          }
          
          // Add value propositions if available
          if (brainData.websiteAnalysis.valuePropositions && 
              brainData.websiteAnalysis.valuePropositions.length > 0) {
            businessContext += `\nValue Propositions:\n`;
            brainData.websiteAnalysis.valuePropositions.forEach((prop: string) => {
              businessContext += `- ${prop}\n`;
            });
          }
        }
      } else {
        console.warn('[WARN] Failed to fetch business brain data:', brainResponse.status);
      }
    } catch (brainError) {
      console.error('[ERROR] Error fetching business brain data:', brainError);
    }
    
    // Create a prompt that focuses on generating a comprehensive audit report
    const reportPrompt = `
You are an expert business analyst specializing in ${auditDefinition.name.toLowerCase()} analysis.

Your task is to generate a comprehensive audit report for a business based on their data and any supporting documents provided.

IMPORTANT: Do not make up any objective metric values if you cannot find evidence for them in the provided information. 
If you cannot determine a specific metric value, indicate this clearly in your assessment.

${businessContext}

Based on the information above and any supporting documents provided below, please generate a complete 
${auditDefinition.name} report with the following components:

1. A clear, accurate summary of the current state
2. Specific metrics relevant to this audit type, including:
   ${auditDefinition.metrics.map(m => `- ${m.name}: [value and assessment]`).join('\n   ')}
3. Key findings categorized by:
   ${auditDefinition.findingCategories.map(c => `- ${c.name}`).join('\n   ')}
4. Actionable recommendations in priority order
5. Any additional insights you can provide based on industry standards

${fileContent ? `\nSupporting Documents:\n${fileContent}` : ''}

Format your response as JSON with the following fields:
- title (string)
- summary (string)
- metrics (array of objects with name, value, description, and status fields)
- findings (array of objects with title, description, severity, category, recommendedAction, and effort fields)
- recommendations (array of strings)
- insights (array of strings)
- contextualAnalysis (string)
- score (number between 0-100)
`;
    
    // Process with AI
    console.log('[DEBUG] Calling AI service for report generation...');
    const rawResponse = await processWithAI(reportPrompt, {
      temperature: 0.4,
      maxTokens: 4000
    });
    
    console.log('[DEBUG] Raw AI response length:', rawResponse.length);
    
    // Parse the structured response
    const reportData = parseAIResponse(rawResponse);
    console.log('[DEBUG] Report data keys:', Object.keys(reportData));
    
    // If the structured data is missing key elements, use fallback
    if (!reportData || Object.keys(reportData).length === 0) {
      console.warn('[WARN] AI returned empty structured data, using fallback');
      return generateFallbackReportData(auditTypeId);
    }
    
    // Ensure all required fields are present
    const enhancedData = {
      title: reportData.title || `${auditDefinition.name} Report`,
      summary: reportData.summary || "This report was automatically generated by AI analysis.",
      score: reportData.score || calculateScoreFromMetrics(reportData.metrics, auditDefinition.metrics) || 70,
      bucket: auditDefinition.bucket,
      metrics: formatMetrics(reportData.metrics, auditDefinition.metrics),
      findings: formatFindings(reportData.findings, auditDefinition.findingCategories),
      recommendations: reportData.recommendations || [],
      insights: reportData.insights || [],
      contextualAnalysis: reportData.contextualAnalysis || '',
      competitiveInsights: reportData.competitiveInsights || '',
    };
    
    console.log('[DEBUG] Enhanced report data prepared successfully');
    return enhancedData;
  } catch (error) {
    console.error('[ERROR] Failed to generate report with AI:', error);
    
    // Return fallback data in case of error
    return generateFallbackReportData(auditTypeId);
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
      if (typeof metric.value === 'string') {
        // Try to extract a numeric value from string (e.g. "85%" -> 85)
        const numericValue = parseFloat(metric.value.replace(/[^\d.-]/g, ''));
        if (!isNaN(numericValue)) {
          normalizedValue = numericValue;
        }
      } else if (typeof metric.value === 'number') {
        normalizedValue = metric.value;
      }
      
      // If the metric has status info, use that for scoring
      if (metric.status) {
        if (metric.status === 'good') normalizedValue = 90;
        else if (metric.status === 'warning') normalizedValue = 60;
        else if (metric.status === 'poor') normalizedValue = 30;
      }
      
      // Apply weight (all metrics equal for now)
      const weight = 1;
      totalWeight += weight;
      weightedSum += normalizedValue * weight;
    });
    
    // Calculate final score, ensuring it's between 0-100
    if (totalWeight > 0) {
      const score = Math.round(weightedSum / totalWeight);
      return Math.max(0, Math.min(100, score));
    }
    
    return 70; // Default fallback
  } catch (error) {
    console.error('Error calculating score from metrics:', error);
    return 70; // Default fallback on error
  }
}

// Format the metrics to ensure they match the expected format
function formatMetrics(extractedMetrics: any[], definedMetrics: any[]): any[] {
  if (!extractedMetrics || !Array.isArray(extractedMetrics) || extractedMetrics.length === 0) {
    return generateFallbackMetrics(definedMetrics);
  }
  
  try {
    return extractedMetrics.map(metric => {
      // Find corresponding definition
      const definition = definedMetrics.find(d => 
        d.id === metric.id || 
        d.name.toLowerCase() === metric.name?.toLowerCase()
      );
      
      let status = metric.status;
      
      // If status not provided but definition has ranges, determine status
      if (!status && definition) {
        status = determineStatus(metric, definition);
      }
      
      return {
        name: metric.name || 'Unknown Metric',
        value: metric.value || 'N/A',
        description: metric.description || (definition ? definition.description : 'No description available'),
        status: status || 'warning'
      };
    });
  } catch (error) {
    console.error('Error formatting metrics:', error);
    return generateFallbackMetrics(definedMetrics);
  }
}

// Determine status based on metric value and definition
function determineStatus(metric: any, definition: any): 'good' | 'warning' | 'poor' {
  try {
    if (!definition.statusRanges) return 'warning';
    
    let numericValue = 0;
    
    // Extract numeric value
    if (typeof metric.value === 'string') {
      numericValue = parseFloat(metric.value.replace(/[^\d.-]/g, ''));
    } else if (typeof metric.value === 'number') {
      numericValue = metric.value;
    }
    
    if (isNaN(numericValue)) return 'warning';
    
    // Check ranges
    if (numericValue >= definition.statusRanges.good[0] && 
        numericValue <= definition.statusRanges.good[1]) {
      return 'good';
    } else if (numericValue >= definition.statusRanges.warning[0] && 
               numericValue <= definition.statusRanges.warning[1]) {
      return 'warning';
    } else {
      return 'poor';
    }
  } catch (error) {
    return 'warning';
  }
}

// Format findings to ensure they match the expected format
function formatFindings(extractedFindings: any[], definedCategories: any[]): any[] {
  if (!extractedFindings || !Array.isArray(extractedFindings) || extractedFindings.length === 0) {
    return generateFallbackFindings(definedCategories);
  }
  
  try {
    return extractedFindings.map(finding => {
      return {
        id: finding.id || `finding-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: finding.title || 'Finding',
        description: finding.description || 'No description provided',
        severity: finding.severity || determineRandomSeverity(),
        category: finding.category || (definedCategories.length > 0 ? definedCategories[0].name : 'General'),
        recommendedAction: finding.recommendedAction || undefined,
        effort: finding.effort || determineRandomEffort()
      };
    });
  } catch (error) {
    console.error('Error formatting findings:', error);
    return generateFallbackFindings(definedCategories);
  }
}

// Fallback report generator in case of failures
function generateFallbackReportData(auditTypeId: string): any {
  const auditDefinition = getAuditDefinition(auditTypeId);
  
  if (!auditDefinition) {
    return {
      title: 'Generic Audit Report',
      summary: 'This report was automatically generated. The system encountered an error processing your specific audit data.',
      score: 50,
      bucket: 'Foundation',
      metrics: [],
      findings: [],
      recommendations: ['Contact support for assistance with this audit.'],
      insights: [],
      contextualAnalysis: '',
      competitiveInsights: ''
    };
  }
  
  return {
    title: `${auditDefinition.name} Report`,
    summary: `This is an automatically generated ${auditDefinition.name.toLowerCase()} report. The system encountered challenges generating a fully customized report.`,
    score: 65,
    bucket: auditDefinition.bucket,
    metrics: generateFallbackMetrics(auditDefinition.metrics),
    findings: generateFallbackFindings(auditDefinition.findingCategories),
    recommendations: [
      `Review your current ${auditDefinition.name.toLowerCase()} strategy.`,
      'Consider a manual audit to get more detailed insights.',
      'Implement industry best practices in this area.'
    ],
    insights: [
      `This ${auditDefinition.name} is critical for your business performance.`,
      'Regular audits can help identify opportunities for improvement.'
    ],
    contextualAnalysis: 'A detailed contextual analysis could not be generated with the available data.',
    competitiveInsights: 'Competitive insights require additional data for analysis.'
  };
}

// Generate fallback metrics for when AI fails to extract them
function generateFallbackMetrics(definedMetrics: any[]): any[] {
  return definedMetrics.map(definition => {
    const midPoint = definition.statusRanges && definition.statusRanges.warning 
      ? Math.floor((definition.statusRanges.warning[0] + definition.statusRanges.warning[1]) / 2)
      : 50;
    
    return {
      name: definition.name,
      value: definition.unit === '%' ? `${midPoint}%` : midPoint,
      description: definition.description,
      status: 'warning'
    };
  });
}

// Generate fallback findings for when AI fails to extract them
function generateFallbackFindings(definedCategories: any[]): any[] {
  return definedCategories.slice(0, 2).map(category => {
    return {
      id: `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: `Potential Issue in ${category.name}`,
      description: category.description || 'This area requires further investigation.',
      severity: determineRandomSeverity(),
      category: category.name,
      recommendedAction: `Review your ${category.name.toLowerCase()} approach and consider industry best practices.`,
      effort: determineRandomEffort()
    };
  });
}

// Helper function to generate random severity for fallback findings
function determineRandomSeverity(): 'critical' | 'high' | 'medium' | 'low' | 'info' {
  const severities = ['critical', 'high', 'medium', 'low', 'info'];
  const weights = [1, 2, 3, 2, 1]; // Medium is most common
  
  // Weighted random selection
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < severities.length; i++) {
    if (random < weights[i]) {
      return severities[i] as any;
    }
    random -= weights[i];
  }
  
  return 'medium';
}

// Helper function to generate random effort level for fallback findings
function determineRandomEffort(): 'low' | 'medium' | 'high' {
  const efforts = ['low', 'medium', 'high'];
  return efforts[Math.floor(Math.random() * efforts.length)] as any;
}

export async function POST(request: NextRequest) {
  try {
    // Output environment variables for debugging
    console.log('Reports Generate API Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV
    });
    
    // First try to get session using getServerSession
    const session = await getServerSession(authOptions);
    console.log('Reports Generate API - Session from getServerSession:', session ? 'Found' : 'Not found');
    
    // If no session, try to get token directly from request
    let userId = session?.user?.id;
    
    if (userId) {
      console.log('Using session authentication with user ID:', userId);
    } else {
      try {
        const token = await getToken({ 
          req: request as any,
          secret: process.env.NEXTAUTH_SECRET 
        });
        
        console.log('Token from getToken:', token ? 'Found' : 'Not found');
        
        if (token) {
          userId = token.id as string;
          console.log('Retrieved user info from token:', { userId });
        }
      } catch (error) {
        console.error('Error getting token:', error);
      }
    }
    
    // If no authentication method succeeded
    if (!userId) {
      console.error('Reports Generate API - Unauthorized: No valid authentication found');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the form data
    const formData = await request.formData();
    const auditTypeId = formData.get('auditTypeId') as string;
    const businessId = formData.get('businessId') as string;
    
    if (!auditTypeId || !businessId) {
      return Response.json({ 
        error: 'Missing required parameters: auditTypeId and businessId are required'
      }, { status: 400 });
    }
    
    // Process any uploaded files
    const { content: fileContent, fileNames } = await processUploadedFiles(formData);
    console.log(`[DEBUG] Processed ${formData.getAll('files').length} files for report generation`);
    
    // Generate the report using AI
    const reportData = await generateReport(auditTypeId, businessId, fileContent);
    
    // Add file names to contextual analysis if they exist
    let enhancedContextualAnalysis = reportData.contextualAnalysis || '';
    if (fileNames.length > 0) {
      enhancedContextualAnalysis += `\n\nSupporting Files:\n${fileNames.join('\n')}`;
    }
    
    // Save the report to the database with the user ID
    const report = await prisma.report.create({
      data: {
        auditTypeId,
        businessId,
        title: reportData.title,
        bucket: reportData.bucket,
        score: reportData.score,
        summary: reportData.summary,
        metrics: reportData.metrics,
        findings: reportData.findings,
        recommendations: reportData.recommendations,
        status: 'published',
        importSource: 'ai',
        insights: reportData.insights,
        contextualAnalysis: enhancedContextualAnalysis,
        competitiveInsights: reportData.competitiveInsights || '',
        createdById: userId
      }
    });
    
    // Add file names to the response so the frontend can display them
    const enhancedReport = {
      ...report,
      supportingFiles: fileNames
    };
    
    return Response.json({
      success: true,
      report: enhancedReport
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return Response.json({ 
      error: 'Failed to generate report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 