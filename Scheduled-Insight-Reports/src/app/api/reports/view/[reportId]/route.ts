import { NextRequest, NextResponse } from 'next/server';
import { dbClient } from '../../../../../lib/database'

interface RouteContext {
    params: Promise<{
      reportId: string;
    }>;
  }
  
export async function GET(req: NextRequest, context: RouteContext) {
    const params = await context.params; 
    const reportIdString = params.reportId;
    const reportId = Number(reportIdString);

    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }
    
    const result = await dbClient.execute(
      'SELECT reportContents FROM reports WHERE reportId = ?',
      [reportId]
    );

  if (!result.rows || result.rows.length === 0) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const html = String(result.rows[0].reportContents);

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
