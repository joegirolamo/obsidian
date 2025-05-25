import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function POST(request: Request) {
  try {
    // Output environment variables for debugging
    console.log('Compare Businesses API Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV
    });
    
    // Parse request body
    const body = await request.json();
    const { primaryBusinessData, competitorData, userId: providedUserId } = body;

    console.log('Request body received with userId:', providedUserId);

    // Authentication - try multiple methods
    // First try to get session using getServerSession
    const session = await getServerSession(authOptions);
    console.log('Compare Businesses API - Session from getServerSession:', session ? 'Found' : 'Not found');
    
    // If no session, try to get token directly from request
    let authenticatedUserId = session?.user?.id;
    let userRole = session?.user?.role;
    
    if (authenticatedUserId) {
      console.log('Using session authentication with user ID:', authenticatedUserId);
    } 
    // Next try the token approach
    else {
      try {
        const token = await getToken({ 
          req: request as any,
          secret: process.env.NEXTAUTH_SECRET 
        });
        
        console.log('Token from getToken:', token ? 'Found' : 'Not found');
        
        if (token) {
          authenticatedUserId = token.id as string;
          userRole = token.role as string;
          console.log('Retrieved user info from token:', { authenticatedUserId, userRole });
        }
      } catch (error) {
        console.error('Error getting token:', error);
      }
    }
    
    // Finally, try userId from request body
    if (!authenticatedUserId && providedUserId) {
      console.log('Using provided userId for authentication:', providedUserId);
      authenticatedUserId = providedUserId;
    }
    
    // If no authentication method succeeded
    if (!authenticatedUserId) {
      console.error('Compare Businesses API - Unauthorized: No valid authentication found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin - always verify in database regardless of token
    const user = await prisma.user.findUnique({
      where: { id: authenticatedUserId },
      select: { role: true, id: true, email: true }
    });

    console.log('Compare Businesses API - User found:', user ? 'Yes' : 'No', 'Role:', user?.role);

    if (!user) {
      console.error('Compare Businesses API - User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN') {
      console.error('Compare Businesses API - Unauthorized: Not an admin', user);
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