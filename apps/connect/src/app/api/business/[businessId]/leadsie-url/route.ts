import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper function to parse the businessId from URL path
function getBusinessId(request: NextRequest): string | null {
  // Extract businessId from URL path
  // The URL pattern will be like /api/business/[businessId]/leadsie-url
  const path = request.nextUrl.pathname;
  const match = path.match(/\/api\/business\/([^\/]+)\/leadsie-url/);
  return match ? match[1] : null;
}

// GET handler for fetching Leadsie URL
export async function GET(request: NextRequest) {
  try {
    // Get businessId from the URL path
    const businessId = getBusinessId(request);
    console.log('[DEBUG API] GET Leadsie URL for businessId:', businessId);

    if (!businessId) {
      return new Response(JSON.stringify({ error: 'Business ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        connections: true,
      },
    });

    if (!business) {
      return new Response(JSON.stringify({ error: 'Business not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract Leadsie URL from connections
    let connections: Record<string, any> = {};
    
    if (business.connections) {
      if (typeof business.connections === 'string') {
        try {
          // Try to parse the string as JSON
          connections = JSON.parse(business.connections as string);
          console.log('[DEBUG API] Parsed connections string to object:', connections);
        } catch (parseError) {
          console.error('[DEBUG API] Failed to parse connections string:', parseError);
          // Create new object if parsing fails
          connections = {};
        }
      } else {
        // Use connections as is if it's already an object
        connections = business.connections as Record<string, any>;
      }
    }
    
    const leadsieUrl = connections.leadsieUrl || '';
    console.log('[DEBUG API] Found Leadsie URL:', leadsieUrl);

    // Return the URL directly in the response
    return new Response(JSON.stringify({ url: leadsieUrl }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[DEBUG API] Error fetching Leadsie URL:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch Leadsie URL' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST handler for saving Leadsie URL
export async function POST(request: NextRequest) {
  try {
    // Get businessId from the URL path
    const businessId = getBusinessId(request);
    console.log('[DEBUG API] POST Leadsie URL for businessId:', businessId);

    if (!businessId) {
      return new Response(JSON.stringify({ error: 'Business ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    let body;
    let url;
    try {
      body = await request.json();
      url = body.url;
      
      if (!url) {
        return new Response(JSON.stringify({ error: 'URL is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      console.log('[DEBUG API] Received URL to save:', url);
    } catch (parseError) {
      console.error('[DEBUG API] Error parsing request body:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid request body',
        details: parseError instanceof Error ? parseError.message : 'Failed to parse request body'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.error('[DEBUG API] Authentication required but no session found');
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin of the business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        adminId: true,
        connections: true,
      },
    });

    if (!business) {
      console.error('[DEBUG API] Business not found with ID:', businessId);
      return new Response(JSON.stringify({ error: 'Business not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (business.adminId !== session.user.id) {
      console.error('[DEBUG API] User not authorized. User ID:', session.user.id, 'Business Admin ID:', business.adminId);
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update business connections with Leadsie URL
    try {
      // Handle the case where connections is a string instead of an object
      let connections: Record<string, any> = {};
      
      if (business.connections) {
        if (typeof business.connections === 'string') {
          try {
            // Try to parse the string as JSON
            connections = JSON.parse(business.connections as string);
            console.log('[DEBUG API] Parsed connections string to object:', connections);
          } catch (parseError) {
            console.error('[DEBUG API] Failed to parse connections string:', parseError);
            // Create new object if parsing fails
            connections = {};
          }
        } else {
          // Use connections as is if it's already an object
          connections = business.connections as Record<string, any>;
        }
      }
      
      // Set the leadsieUrl property
      connections.leadsieUrl = url;
      console.log('[DEBUG API] Updating business connections with URL');

      await prisma.business.update({
        where: { id: businessId },
        data: {
          connections: connections,
        },
      });

      console.log('[DEBUG API] Successfully saved Leadsie URL');
      return new Response(JSON.stringify({ success: true, url }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (dbError) {
      console.error('[DEBUG API] Database error when saving Leadsie URL:', dbError);
      return new Response(JSON.stringify({ 
        error: 'Failed to save Leadsie URL to database',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('[DEBUG API] Error saving Leadsie URL:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to save Leadsie URL',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 