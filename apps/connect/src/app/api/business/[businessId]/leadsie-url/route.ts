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
    const connections = business.connections as Record<string, any> || {};
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

    const session = await getServerSession(authOptions);
    const body = await request.json();
    const url = body.url;
    console.log('[DEBUG API] Received URL to save:', url);

    if (!session?.user?.id) {
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
      return new Response(JSON.stringify({ error: 'Business not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (business.adminId !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update business connections with Leadsie URL
    const connections = business.connections as Record<string, any> || {};
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
  } catch (error) {
    console.error('[DEBUG API] Error saving Leadsie URL:', error);
    return new Response(JSON.stringify({ error: 'Failed to save Leadsie URL' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 