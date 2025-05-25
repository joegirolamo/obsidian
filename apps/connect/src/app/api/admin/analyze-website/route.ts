import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Parse request body first to allow multiple authentication methods
    const body = await request.json();
    const { websiteUrl, businessId, userId } = body;

    // Authentication check - either through session or provided userId
    let authenticatedUserId = null;
    
    // Try session authentication first
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      authenticatedUserId = session.user.id;
    } 
    // Fall back to userId provided in request body
    else if (userId) {
      authenticatedUserId = userId;
    }
    
    // If no authentication method succeeded
    if (!authenticatedUserId) {
      console.error('Unauthorized: No valid authentication found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: authenticatedUserId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      console.error('Unauthorized: User is not an admin', user);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!websiteUrl) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    // Skip business existence check for temporary IDs used for comparison
    const isTemporaryId = businessId.startsWith('temp-');
    
    if (!isTemporaryId) {
      // Check if business exists
      const business = await prisma.business.findUnique({
        where: { id: businessId }
      });

      if (!business) {
        return NextResponse.json(
          { error: 'Business not found' },
          { status: 404 }
        );
      }
    }

    // Get active AI configuration
    const aiConfig = await prisma.aIConfiguration.findFirst({
      where: { isActive: true }
    });

    if (!aiConfig) {
      return NextResponse.json(
        { error: 'No active AI configuration found' },
        { status: 400 }
      );
    }

    // Define the prompt for analyzing the website
    const prompt = `Analyze the website at ${websiteUrl} and provide the following information in JSON format:

1. A concise 3-4 sentence description of the business
2. The business model in 2-3 sentences
3. A clear explanation of their product/service offerings in 2-3 sentences
4. 2-3 clear value proposition statements
5. 4-5 product/service differentiation highlights (what makes them unique)

Format your response as a JSON object with these keys: 
- description
- businessModel
- productOffering
- valuePropositions (array of statements)
- differentiationHighlights (array of points)

Only respond with valid JSON. If you can't access the website, provide general information based on the domain name and include a note about limited access in your response.`;

    // Call OpenAI API
    let analysisResult;
    
    if (aiConfig.provider === 'OpenAI') {
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [
            { role: 'system', content: 'You are a business analyst who provides concise, valuable insights about businesses based on their websites.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1500,
          response_format: { type: 'json_object' }
        })
      });

      if (!openAIResponse.ok) {
        const errorData = await openAIResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }

      const apiResponse = await openAIResponse.json();
      const content = apiResponse.choices[0]?.message?.content;
      
      if (content) {
        try {
          analysisResult = JSON.parse(content);
        } catch (error) {
          console.error('Error parsing AI response:', error);
          return NextResponse.json(
            { error: 'Failed to parse AI response' },
            { status: 500 }
          );
        }
      } else {
        throw new Error('No content in AI response');
      }
    } else {
      return NextResponse.json(
        { error: `AI provider '${aiConfig.provider}' not supported` },
        { status: 400 }
      );
    }

    // Only update the database for non-temporary business IDs
    if (!isTemporaryId) {
      // Get existing connections data
      let connections = {};
      try {
        const business = await prisma.business.findUnique({
          where: { id: businessId },
          select: { connections: true }
        });
        
        if (business?.connections) {
          if (typeof business.connections === 'string') {
            connections = JSON.parse(business.connections);
          } else {
            connections = business.connections;
          }
        }
      } catch (error) {
        console.error('Error retrieving or parsing connections:', error);
        connections = {};
      }

      // Update business description and store analysis in connections
      await prisma.business.update({
        where: { id: businessId },
        data: { 
          description: analysisResult.description,
          connections: JSON.stringify({
            ...connections,
            websiteAnalysis: {
              businessModel: analysisResult.businessModel,
              productOffering: analysisResult.productOffering,
              valuePropositions: analysisResult.valuePropositions,
              differentiationHighlights: analysisResult.differentiationHighlights,
              analyzedAt: new Date().toISOString()
            }
          })
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: analysisResult
    });
  } catch (error) {
    console.error('Error analyzing website:', error);
    return NextResponse.json(
      { error: 'Failed to analyze website', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 