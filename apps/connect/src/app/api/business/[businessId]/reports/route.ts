import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper function to parse the businessId from URL path
function getBusinessId(request: NextRequest): string | null {
  // Extract businessId from URL path
  // The URL pattern will be like /api/business/[businessId]/reports
  const path = request.nextUrl.pathname;
  const match = path.match(/\/api\/business\/([^\/]+)\/reports/);
  return match ? match[1] : null;
}

// GET handler for fetching reports
export async function GET(request: NextRequest) {
  try {
    // Get businessId from the URL path
    const businessId = getBusinessId(request);
    console.log('[DEBUG API] GET reports for businessId:', businessId);

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

    // Get the bucket parameter from query string if provided
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket');

    // Find reports for this business
    const reports = await prisma.report.findMany({
      where: {
        businessId,
        ...(bucket ? { bucket: bucket } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return new Response(JSON.stringify({ reports }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ERROR API] Error fetching reports:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch reports' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST handler for creating a new report
export async function POST(request: NextRequest) {
  try {
    // Get businessId from the URL path
    const businessId = getBusinessId(request);
    console.log('[DEBUG API] POST create report for businessId:', businessId);

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

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.auditTypeId || !body.title || !body.bucket) {
      return new Response(JSON.stringify({ 
        error: 'Required fields missing',
        requiredFields: ['auditTypeId', 'title', 'bucket']
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        businessId,
        auditTypeId: body.auditTypeId,
        title: body.title,
        bucket: body.bucket,
        score: body.score || 0,
        summary: body.summary || '',
        metrics: body.metrics || [],
        findings: body.findings || [],
        recommendations: body.recommendations || [],
        status: body.status || 'draft',
        createdById: session.user.id,
        importSource: body.importSource || 'manual',
      },
    });

    return new Response(JSON.stringify({ report }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ERROR API] Error creating report:', error);
    return new Response(JSON.stringify({ error: 'Failed to create report' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 