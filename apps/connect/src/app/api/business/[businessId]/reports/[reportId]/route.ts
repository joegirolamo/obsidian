import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getToken } from 'next-auth/jwt';

// Helper function to parse the businessId and reportId from URL path
function getParams(request: NextRequest): { businessId: string | null, reportId: string | null } {
  // Extract businessId and reportId from URL path
  // The URL pattern will be like /api/business/[businessId]/reports/[reportId]
  const path = request.nextUrl.pathname;
  const match = path.match(/\/api\/business\/([^\/]+)\/reports\/([^\/]+)/);
  
  if (match) {
    return {
      businessId: match[1],
      reportId: match[2]
    };
  } else {
    return {
      businessId: null,
      reportId: null
    };
  }
}

// DELETE handler for deleting a report
export async function DELETE(request: NextRequest) {
  try {
    // Get params from the URL path
    const { businessId, reportId } = getParams(request);
    console.log('[DEBUG API] DELETE report, businessId:', businessId, 'reportId:', reportId);

    if (!businessId || !reportId) {
      return new Response(JSON.stringify({ error: 'Business ID and Report ID are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // First try to get session using getServerSession
    const session = await getServerSession(authOptions);
    console.log('Reports DELETE - Session from getServerSession:', session ? 'Found' : 'Not found');
    
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
      console.error('Reports DELETE - Unauthorized: No valid authentication found');
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete the report
    let deletedReport = null;
    try {
      // Type casting to avoid TypeScript errors
      const prismaAny = prisma as any;
      
      // Try to delete with Report (standard casing)
      try {
        if (prismaAny && typeof prismaAny.Report !== 'undefined' && typeof prismaAny.Report.delete === 'function') {
          deletedReport = await prismaAny.Report.delete({
            where: {
              id: reportId,
              businessId: businessId
            }
          });
          console.log('[DEBUG API] Deleted report with "Report" model:', reportId);
        }
      } catch (error) {
        console.warn('[WARN] Failed to delete report with "Report" model, trying "report" model:', error);
        
        // If that fails, try with report (lowercase)
        if (prismaAny && typeof prismaAny.report !== 'undefined' && typeof prismaAny.report.delete === 'function') {
          deletedReport = await prismaAny.report.delete({
            where: {
              id: reportId,
              businessId: businessId
            }
          });
          console.log('[DEBUG API] Deleted report with "report" model:', reportId);
        } else {
          return new Response(JSON.stringify({ error: 'Report model not found in database' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (dbError) {
      console.error('[ERROR API] Database error deleting report:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to delete report from database' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Report deleted successfully',
      report: deletedReport
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ERROR API] Error deleting report:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete report' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 