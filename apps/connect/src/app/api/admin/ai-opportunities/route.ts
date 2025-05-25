import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createOpportunity } from '@/app/actions/opportunity';
import { getToken } from 'next-auth/jwt';

// Type for Prisma client to help TypeScript recognize aIConfiguration
type PrismaWithAI = typeof prisma & {
  aIConfiguration: any;
};

// Define the category mappings
const categoryMap: Record<string, string> = {
  'EBITDA': 'Profitability and cost optimization',
  'Revenue': 'Revenue growth and sales improvement',
  'De-Risk': 'Risk mitigation and business stability',
  'Foundation': 'Marketing foundation and infrastructure',
  'Acquisition': 'Customer acquisition and lead generation',
  'Conversion': 'Website conversion and user experience',
  'Retention': 'Customer retention and engagement'
};

// Define service areas for each bucket
const bucketServiceAreas: Record<string, string[]> = {
  'Foundation': ['Brand/GTM Strategy', 'Martech', 'Data & Analytics'],
  'Acquisition': ['Performance Media', 'Campaigns', 'Earned Media'],
  'Conversion': ['Website', 'Ecommerce Platforms', 'Digital Product'],
  'Retention': ['CRM', 'App', 'Organic Social']
};

export async function POST(request: Request) {
  try {
    // Output environment variables for debugging
    console.log('AI Opportunities API Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV
    });
    
    // Parse request body
    const body = await request.json();
    const { businessId, category } = body;

    if (!businessId || !category) {
      return NextResponse.json(
        { error: 'Business ID and category are required' },
        { status: 400 }
      );
    }

    // Authentication - try multiple methods
    // First try to get session using getServerSession
    const session = await getServerSession(authOptions);
    console.log('AI Opportunities API - Session from getServerSession:', session ? 'Found' : 'Not found');
    
    // If no session, try to get token directly from request
    let userId = session?.user?.id;
    let userRole = session?.user?.role;
    
    if (userId) {
      console.log('Using session authentication with user ID:', userId);
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
          userId = token.id as string;
          userRole = token.role as string;
          console.log('Retrieved user info from token:', { userId, userRole });
        }
      } catch (error) {
        console.error('Error getting token:', error);
      }
    }
    
    // If no authentication method succeeded
    if (!userId) {
      console.error('AI Opportunities API - Unauthorized: No valid authentication found');
      return NextResponse.json({ error: 'Unauthorized: No valid authentication found' }, { status: 401 });
    }

    // Check if user is admin - always verify in database regardless of token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, id: true, email: true }
    });

    console.log('AI Opportunities API - User found:', user ? 'Yes' : 'No', 'Role:', user?.role);

    if (!user) {
      console.error('AI Opportunities API - User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN') {
      console.error('AI Opportunities API - Unauthorized: Not an admin', user);
      return NextResponse.json({ error: 'Unauthorized: Not an admin' }, { status: 403 });
    }

    // Get the AI configuration
    const aiConfig = await prisma.aIConfiguration.findFirst({
      where: { isActive: true }
    });

    if (!aiConfig) {
      return NextResponse.json(
        { error: 'No active AI configuration found' },
        { status: 400 }
      );
    }

    // Fetch the business brain data using request headers to build the URL
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    const aiUrl = `${baseUrl}/api/business/${businessId}/ai-brain`;
    
    console.log(`Attempting to fetch business data from: ${aiUrl}`);
    
    const response = await fetch(aiUrl);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to get response text');
      console.error(`Failed to fetch AI brain data: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json(
        { error: `Failed to fetch business data: ${response.status} ${response.statusText}` },
        { status: 500 }
      );
    }
    
    const brainData = await response.json();
    console.log('Successfully fetched business brain data');

    // Prepare the prompt based on the category
    const categoryDescription = categoryMap[category] || category;

    // Get bucket-specific service areas or use default list
    const relevantServiceAreas = bucketServiceAreas[category] || 
      ['Website', 'Digital Product', 'Brand/GTM Strategy', 'SEO', 'Performance Media', 'Email Marketing', 'Content Marketing', 'Social Media', 'CRM'];

    const prompt = `As a digital marketing strategist, I need to generate 3 actionable opportunities for a business. 
    
Business details:
Name: ${brainData.business.name}
Industry: ${brainData.business.industry || 'Not specified'}
Description: ${brainData.business.description || 'Not provided'}

Focus area: ${categoryDescription}
Service Areas to consider: ${relevantServiceAreas.join(', ')}

${brainData.goals && brainData.goals.length > 0 ? 
  `Business Goals:\n${brainData.goals.map((g: any) => `- ${g.name}: ${g.description || ''}`).join('\n')}` : ''}

${brainData.kpis && brainData.kpis.length > 0 ? 
  `Key Performance Indicators:\n${brainData.kpis.map((k: any) => `- ${k.name}: ${k.description || ''} (Current: ${k.current || 'Not set'}, Target: ${k.target || 'Not set'})`).join('\n')}` : ''}

${brainData.metrics && brainData.metrics.length > 0 ? 
  `Metrics:\n${brainData.metrics.map((m: any) => `- ${m.name}: ${m.description || ''} (Value: ${m.value || 'Not set'}, Benchmark: ${m.benchmark || 'Not set'})`).join('\n')}` : ''}

Generate 3 specific, actionable opportunities for the ${categoryDescription} category. For each opportunity, provide:
1. A clear, specific title (max 10 words)
2. A short description explaining the opportunity (max 150 characters)
3. The most relevant service area from the list provided
4. Which goal or KPI this opportunity would primarily impact (if applicable)

Format your response as a JSON array of objects with properties: title, description, serviceArea, and targetKPI.`;

    // Define the API call parameters based on the provider
    let apiResponse;
    let opportunities = [];

    if (aiConfig.provider === 'OpenAI') {
      // Call OpenAI API
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant that generates business opportunities in JSON format only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        })
      });

      if (!openAIResponse.ok) {
        const errorData = await openAIResponse.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }

      apiResponse = await openAIResponse.json();
      
      // Parse the response to get the opportunities
      try {
        const content = apiResponse.choices[0]?.message?.content;
        if (content) {
          const parsedContent = JSON.parse(content);
          opportunities = parsedContent.opportunities || [];
          
          // Fallback if the output format is different
          if (!opportunities.length && Array.isArray(parsedContent)) {
            opportunities = parsedContent;
          }
        }
      } catch (error) {
        console.error('Error parsing AI response:', error);
        return NextResponse.json(
          { error: 'Failed to parse AI response' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: `AI provider '${aiConfig.provider}' not supported` },
        { status: 400 }
      );
    }

    // Create the opportunities in the database
    const createdOpportunities = [];
    for (const opp of opportunities) {
      const result = await createOpportunity(businessId, {
        title: opp.title,
        description: opp.description,
        category: category,
        serviceArea: opp.serviceArea,
        targetKPI: opp.targetKPI
      });

      if (result.success && result.opportunity) {
        createdOpportunities.push(result.opportunity);
      }
    }

    return NextResponse.json({
      success: true,
      opportunities: createdOpportunities,
      count: createdOpportunities.length
    });
  } catch (error) {
    console.error('Error generating opportunities with AI:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate opportunities with AI',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 