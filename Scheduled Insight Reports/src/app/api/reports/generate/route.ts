import { NextRequest, NextResponse } from 'next/server';
import { dbClient } from '../../../../lib/database'
import { emailService } from '@/lib/email';
import { generateReport } from '../../../../lib/generateReport'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { configId } = body;

    if (!configId) {
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 });
    }

    // Fetch the report config
    const configResult = await dbClient.execute(
      `SELECT * FROM reportconfigs WHERE id = ?`,
      [configId]
    );

    const config = configResult.rows[0];
    if (!config) {
      return NextResponse.json({ error: 'Report configuration not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    const insertResult = await dbClient.execute(
      `INSERT INTO reports (reportconfigId, status, runStart) VALUES (?, ?, ?)`,
      [configId, 'pending', now]
    );

    const reportId = Number(insertResult.lastInsertRowid);

    // Start report generation
    await generateReport(reportId, config, false);

    return NextResponse.json({
      message: 'Finished generating report',
      reportId,
      lastRunAt: now,
      lastError: ""
    });

  } catch (err) {
    console.error('Error generating report:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

