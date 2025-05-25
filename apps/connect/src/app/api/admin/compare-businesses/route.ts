import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { primaryBusinessData, competitorData, userId } = body;

    // Authentication check - either through session or provided userId
    let authenticatedUserId = null;
    
    // Try session authentication first
    const session = await getServerSession(authOptions);
    console.log('Session from compare-businesses API route:', session ? 'Found' : 'Not found');
    
    if (session?.user?.id) {
      console.log('Using session authentication with user ID:', session.user.id);
      authenticatedUserId = session.user.id;
    } 
    // Fall back to userId provided in request body
    else if (userId) {
      console.log('Using provided userId for authentication:', userId);
      authenticatedUserId = userId;
      
      // Verify this user exists and is an admin
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true }
      });
      
      if (!userExists) {
        console.error('User not found in database:', userId);
        authenticatedUserId = null;
      } else if (userExists.role !== 'ADMIN') {
        console.error('User is not an admin:', userId, 'Role:', userExists.role);
        authenticatedUserId = null;
      }
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

    if (!primaryBusinessData || !competitorData) {
      return NextResponse.json(
        { error: 'Both primary business and competitor data are required' },
        { status: 400 }
      );
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

    // Define the prompt for analyzing the comparison
    const prompt = `Compare the following two businesses and provide insights on their strengths, weaknesses, and differences:

Primary Business: ${primaryBusinessData.name}
Description: ${primaryBusinessData.description || 'N/A'}
Business Model: ${primaryBusinessData.businessModel || 'N/A'}
Product/Service Offering: ${primaryBusinessData.productOffering || 'N/A'}
Value Propositions: ${primaryBusinessData.valuePropositions?.join(', ') || 'N/A'}
Differentiation Highlights: ${primaryBusinessData.differentiationHighlights?.join(', ') || 'N/A'}

Competitor Business: ${competitorData.name}
Description: ${competitorData.description || 'N/A'}
Business Model: ${competitorData.businessModel || 'N/A'}
Product/Service Offering: ${competitorData.productOffering || 'N/A'}
Value Propositions: ${competitorData.valuePropositions?.join(', ') || 'N/A'}
Differentiation Highlights: ${competitorData.differentiationHighlights?.join(', ') || 'N/A'}

Format your response as a JSON object with these keys:
- strengthsVsPrimary (array of 2-4 strings) - Competitor's strengths compared to the primary business
- weaknessesVsPrimary (array of 2-4 strings) - Competitor's weaknesses compared to the primary business (IMPORTANT: please identify at least 2 weaknesses even if they are minor)
- keyDifferences (array of 2-4 strings) - Key differences in approach, market positioning, or strategy

If you can't find actual weaknesses, suggest potential challenges or areas where the competitor might underperform compared to the primary business.

Only respond with valid JSON.`;

    // Call OpenAI API
    let comparisonResult;
    
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
            { role: 'system', content: 'You are a business analyst who provides concise, valuable insights about business comparisons.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000,
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
          comparisonResult = JSON.parse(content);
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

    return NextResponse.json({
      success: true,
      data: comparisonResult
    });
  } catch (error) {
    console.error('Error comparing businesses:', error);
    return NextResponse.json(
      { error: 'Failed to compare businesses', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 