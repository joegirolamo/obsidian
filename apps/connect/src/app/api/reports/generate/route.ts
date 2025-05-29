import { NextRequest, NextResponse } from 'next/server';
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
    console.log('[DEBUG] No files found in form data');
    return { content: '', fileNames: [] };
  }
  
  console.log(`[DEBUG] Processing ${files.length} uploaded files`);
  
  try {
    // Combine content from all files
    const fileContents: string[] = [];
    const fileNames: string[] = [];
    
    for (const file of files) {
      console.log(`[DEBUG] Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
      fileNames.push(file.name);
      
      // For text-based files, extract content as text
      if (file.type.startsWith('text/') || 
          file.type === 'application/json' || 
          file.type === 'application/xml' ||
          file.type === 'application/javascript') {
        const fileContent = await file.text();
        console.log(`[DEBUG] Extracted ${fileContent.length} characters of text from ${file.name}`);
        fileContents.push(`
=== File: ${file.name} ===
${fileContent}
`);
      } 
      // For other files, include information about the file but don't attempt text extraction
      else {
        fileContents.push(`
=== File: ${file.name} ===
[This is a ${file.type} file with size ${file.size} bytes. Please analyze based on the file name and context.]
`);
      }
    }
    
    const combinedContent = fileContents.join('\n\n');
    console.log(`[DEBUG] Combined file content length: ${combinedContent.length} characters`);
    console.log(`[DEBUG] First 100 chars of combined content: ${combinedContent.substring(0, 100)}`);
    
    return { 
      content: combinedContent,
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
async function generateReport(
  auditTypeId: string, 
  businessId: string, 
  fileContent: string,
  aiBrainOptions: {
    includeBusiness: boolean,
    includeWebsiteAnalysis: boolean,
    includeGoals: boolean,
    includeKPIs: boolean,
    includeMetrics: boolean,
    includeOpportunities: boolean,
    includeIntakeQuestions: boolean
  } = {
    includeBusiness: true,
    includeWebsiteAnalysis: true,
    includeGoals: true,
    includeKPIs: true,
    includeMetrics: true,
    includeOpportunities: true,
    includeIntakeQuestions: true
  }
): Promise<any> {
  try {
    console.log('[DEBUG] Generating report for audit type:', auditTypeId);
    console.log('[DEBUG] AI Brain options:', aiBrainOptions);
    
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
        
        // Extract business information based on selected options
        if (aiBrainOptions.includeBusiness && brainData.business) {
          businessContext += `\nBusiness Information:\n`;
          businessContext += `Name: ${brainData.business.name || 'Unknown'}\n`;
          businessContext += `Website: ${brainData.business.website || 'Not specified'}\n`;
          businessContext += `Industry: ${brainData.business.industry || 'Not specified'}\n`;
        }
        
        // Add website analysis if available and selected
        if (aiBrainOptions.includeWebsiteAnalysis && brainData.websiteAnalysis) {
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
        
        // Add goals if available and selected
        if (aiBrainOptions.includeGoals && brainData.goals && brainData.goals.length > 0) {
          businessContext += `\nBusiness Goals:\n`;
          brainData.goals.forEach((goal: any) => {
            businessContext += `- ${goal.name}${goal.description ? `: ${goal.description}` : ''}\n`;
          });
        }
        
        // Add KPIs if available and selected
        if (aiBrainOptions.includeKPIs && brainData.kpis && brainData.kpis.length > 0) {
          businessContext += `\nKey Performance Indicators (KPIs):\n`;
          brainData.kpis.forEach((kpi: any) => {
            businessContext += `- ${kpi.name}${kpi.description ? `: ${kpi.description}` : ''}`;
            if (kpi.current) businessContext += ` Current: ${kpi.current}`;
            if (kpi.target) businessContext += ` Target: ${kpi.target}`;
            businessContext += `\n`;
          });
        }
        
        // Add metrics if available and selected
        if (aiBrainOptions.includeMetrics && brainData.metrics && brainData.metrics.length > 0) {
          businessContext += `\nBusiness Metrics:\n`;
          brainData.metrics.forEach((metric: any) => {
            businessContext += `- ${metric.name}${metric.description ? `: ${metric.description}` : ''}`;
            if (metric.value) businessContext += ` Value: ${metric.value}`;
            if (metric.benchmark) businessContext += ` Benchmark: ${metric.benchmark}`;
            businessContext += `\n`;
          });
        }
        
        // Add opportunities if available and selected
        if (aiBrainOptions.includeOpportunities && brainData.opportunities && brainData.opportunities.length > 0) {
          businessContext += `\nBusiness Opportunities:\n`;
          brainData.opportunities.forEach((opp: any) => {
            businessContext += `- ${opp.title}${opp.description ? `: ${opp.description}` : ''} [${opp.status || 'No status'}]\n`;
          });
        }
        
        // Add intake questions and answers if available and selected
        if (aiBrainOptions.includeIntakeQuestions && brainData.questions && brainData.questions.length > 0) {
          businessContext += `\nIntake Questionnaire Responses:\n`;
          brainData.questions.forEach((qa: any) => {
            businessContext += `Q: ${qa.question}\n`;
            if (qa.answers && qa.answers.length > 0) {
              qa.answers.forEach((ans: any, idx: number) => {
                businessContext += `A${qa.answers.length > 1 ? ` ${idx + 1}` : ''}: ${ans.answer}\n`;
              });
            } else {
              businessContext += `A: No answer provided\n`;
            }
          });
        }
      } else {
        console.warn('[WARN] Failed to fetch business brain data:', brainResponse.status);
      }
    } catch (brainError) {
      console.error('[ERROR] Error fetching business brain data:', brainError);
    }
    
    // Create audit-specific guidance
    let auditSpecificGuidance = '';
    
    // Add audit-specific instructions based on auditTypeId
    switch (auditTypeId) {
      case 'seo_audit':
        auditSpecificGuidance = `
IMPORTANT SEO AUDIT INSTRUCTIONS:
- Analyze the website's meta tags, titles, descriptions, and headings
- Assess keyword usage, density, and relevance
- Evaluate URL structure and site architecture
- Check for technical SEO issues like canonicals, sitemaps, or robots.txt
- Analyze backlinks and domain authority if available in uploaded files
- Identify specific on-page SEO improvements for key pages
- Examine content quality, word count, and relevance to target keywords
- Assess mobile-friendliness and page speed metrics if available
`;
        break;
      case 'website_performance_audit':
        auditSpecificGuidance = `
IMPORTANT WEBSITE PERFORMANCE AUDIT INSTRUCTIONS:
- Focus on loading speeds, Core Web Vitals, and performance metrics
- Identify render-blocking resources and optimization opportunities
- Evaluate image optimization, compression, and delivery
- Assess mobile performance specifically
- Check for JavaScript and CSS optimization opportunities
- Evaluate server response times and caching implementation
`;
        break;
      case 'content_audit':
        auditSpecificGuidance = `
IMPORTANT CONTENT AUDIT INSTRUCTIONS:
- Analyze content quality, engagement, and topical relevance
- Identify content gaps compared to competitors
- Assess content structure, readability, and user engagement
- Evaluate content distribution channels and effectiveness
- Check for duplicate content issues
- Identify opportunities for content updates or repurposing
`;
        break;
      case 'paid_media_audit':
        auditSpecificGuidance = `
IMPORTANT PAID MEDIA AUDIT INSTRUCTIONS:
- Analyze campaign structure, ad groups, and targeting
- Assess budget allocation and ROI across channels
- Evaluate creative quality and messaging consistency
- Identify optimization opportunities for bidding and targeting
- Analyze conversion tracking and attribution
`;
        break;
      // Add more cases for other audit types as needed
    }
    
    // Create a prompt that focuses on generating a comprehensive audit report
    const reportPrompt = `
You are an expert business analyst specializing in ${auditDefinition.name.toLowerCase()} analysis.

Your task is to generate a comprehensive audit report for a business based on their data and any supporting documents provided.

${auditSpecificGuidance}

EXTREMELY IMPORTANT: Pay close attention to any uploaded files in the "Supporting Documents" section below. These files contain critical information for your analysis. You must analyze this information thoroughly and incorporate insights from these documents into your report.

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

    console.log('[DEBUG] AI prompt length:', reportPrompt.length);
    
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
    
    // If the structured data is missing key elements, throw an error instead of using fallback
    if (!reportData || Object.keys(reportData).length === 0) {
      console.warn('[WARN] AI returned empty structured data');
      throw new Error('AI processing failed to generate a valid report structure');
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
    // Instead of returning fallback data, throw the error to be handled by the POST handler
    throw new Error(`AI report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    throw new Error('No valid metrics were extracted from the AI response');
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
    throw new Error('Failed to format metrics data from AI response');
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
    throw new Error('No valid findings were extracted from the AI response');
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
    throw new Error('Failed to format findings data from AI response');
  }
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
    // Use NextAuth for authentication
    const session = await getServerSession(authOptions);
    console.log('[DEBUG API] POST report generation - Session:', session ? 'Valid' : 'None');
    
    // Try token auth as fallback
    let userId = session?.user?.id;
    
    if (!userId) {
      const token = await getToken({ 
        req: request as any,
        secret: process.env.NEXTAUTH_SECRET 
      });
      
      if (token) {
        userId = token.id as string;
        console.log('[DEBUG API] Using token auth with user ID:', userId);
      }
    }
    
    if (!userId) {
      console.error('[ERROR] Authentication required');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse the form data from the request
    const formData = await request.formData();
    
    // Extract audit type and business ID
    const auditTypeId = formData.get('auditTypeId') as string;
    const businessId = formData.get('businessId') as string;
    
    // Extract AI Brain options with defaults to true if not provided
    const aiBrainOptions = {
      includeBusiness: formData.get('includeBusiness') !== 'false',
      includeWebsiteAnalysis: formData.get('includeWebsiteAnalysis') !== 'false',
      includeGoals: formData.get('includeGoals') !== 'false',
      includeKPIs: formData.get('includeKPIs') !== 'false',
      includeMetrics: formData.get('includeMetrics') !== 'false',
      includeOpportunities: formData.get('includeOpportunities') !== 'false',
      includeIntakeQuestions: formData.get('includeIntakeQuestions') !== 'false'
    };
    
    console.log('[DEBUG API] Generating report with options:', { auditTypeId, businessId, aiBrainOptions });
    
    // Process uploaded files
    const { content: fileContent, fileNames } = await processUploadedFiles(formData);
    
    // Generate the report content using AI
    const reportData = await generateReport(auditTypeId, businessId, fileContent, aiBrainOptions);
    
    // Get the audit definition for metadata
    const auditDefinition = getAuditDefinition(auditTypeId);
    if (!auditDefinition) {
      console.error(`[ERROR] Audit type ${auditTypeId} not found`);
      return NextResponse.json(
        { error: 'Invalid audit type' },
        { status: 400 }
      );
    }
    
    // Store the report in the database
    const report = await prisma.report.create({
      data: {
        title: reportData.title,
        businessId,
        auditTypeId,
        bucket: auditDefinition.bucket,
        summary: reportData.summary,
        score: reportData.score,
        metrics: reportData.metrics as any,
        findings: reportData.findings as any,
        recommendations: reportData.recommendations as any,
        insights: reportData.insights as any,
        contextualAnalysis: reportData.contextualAnalysis,
        status: 'published',
        importSource: 'ai',
        createdById: userId,
        competitiveInsights: reportData.competitiveInsights || ''
      }
    });
    
    // Add file names to the response
    const enhancedReport = {
      ...report,
      supportingFiles: fileNames
    };
    
    console.log('[DEBUG API] Successfully created report:', report.id);
    
    return NextResponse.json({
      success: true,
      report: enhancedReport
    });
  } catch (error) {
    console.error('[ERROR] Failed to generate report:', error);
    
    // Return a structured error response
    return NextResponse.json(
      { 
        error: 'Failed to generate report', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 