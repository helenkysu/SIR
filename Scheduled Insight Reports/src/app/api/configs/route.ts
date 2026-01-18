// app/api/configs/route.ts
import { NextRequest, NextResponse } from "next/server";

import { dbClient, saveError } from '../../../lib/database'
import { generateReport } from '../../../lib/generateReport'
import { calculateNextRunAt } from '../../../lib/utils'

interface LastInsertIdRow {
  last_insert_rowid: number;
}

// Define TypeScript type for incoming form
interface ReportConfigRequest {
  platform: "meta" | "tiktok";
  metrics: string[];
  level: string;
  dateRangeEnum: "last7" | "last14" | "last30";
  cadence: "manual" | "hourly" | "every 12 hours" | "daily";
  delivery: "email" | "link";
  email?: string;
}

// Ensure table exists (run once)
async function ensureReportsConfigTable() {
  await dbClient.execute(`
    CREATE TABLE IF NOT EXISTS reportconfigs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      metrics TEXT NOT NULL,
      level TEXT NOT NULL,
      dateRangeEnum TEXT NOT NULL,
      cadence TEXT NOT NULL,
      delivery TEXT NOT NULL,
      email TEXT,
      lastReportId INTEGER,
      createdAt TEXT NOT NULL,
      lastRunAt TIMESTAMP,
      nextRunAt TIMESTAMP,
      lastError TEXT
    )
  `);
}

export async function POST(req: NextRequest) {
  let configId: number | null = null;
  try {
    // Read JSON body
    const data: ReportConfigRequest = await req.json();

    // Basic validation
    if (!data.platform || !data.metrics?.length || !data.level || !data.dateRangeEnum || !data.cadence || !data.delivery) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (data.delivery === "email" && !data.email) {
      return NextResponse.json({ error: "Email required when delivery=email" }, { status: 400 });
    }

    await ensureReportsConfigTable();

    // Insert into Turso table
    const insertResult = await dbClient.execute(
      `
      INSERT INTO reportconfigs
        (
          platform,
          metrics,
          level,
          dateRangeEnum,
          cadence,
          delivery,
          email,
          createdAt,
          lastRunAt,
          nextRunAt,
          lastReportId
        )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)
      `,
      [
        data.platform,
        JSON.stringify(data.metrics),
        data.level,
        data.dateRangeEnum,
        data.cadence,
        data.delivery,
        data.email || null,
        new Date().toISOString(),
      ]
    );

    configId = Number(insertResult.lastInsertRowid);

    if (data.cadence !== "manual") {
      const now = new Date();
      
      // Fetch the report config
      const configResult = await dbClient.execute(
        `SELECT * FROM reportconfigs WHERE id = ?`,
        [configId]
      );

      const config = configResult.rows[0];
      if (!config) {
        return NextResponse.json({ error: 'Report configuration not found' }, { status: 404 });
      }
      const insertResult = await dbClient.execute(
        `INSERT INTO reports (reportconfigId, status, runStart) VALUES (?, ?, ?)`,
        [configId, 'pending', now]
      );

      const newReportId = Number(insertResult.lastInsertRowid);

      //1️⃣ Generate report immediately
      const generateReportResult = await generateReport(
        newReportId, config, true
      );
        
      if ( !generateReportResult ) {
        throw new Error('error with generating report')
      }

      //2️⃣ Update scheduling metadata
      const nextRunAt = calculateNextRunAt(now, data.cadence)
      await dbClient.execute(
        `
        UPDATE reportconfigs
        SET
          lastRunAt = ?,
          nextRunAt = ?,
          lastReportId = ?
        WHERE id = ?
        `,
        [
          now.toISOString(),
          nextRunAt,
          newReportId,
          configId,
        ]
      );
    }

    if (insertResult && insertResult.lastInsertRowid !== undefined && insertResult.lastInsertRowid > 0) {
      console.log("Last Insert ID:", insertResult.lastInsertRowid);
      // You can use this ID for subsequent operations (e.g., getting the new row)
      return NextResponse.json({ success: true, insertedId: insertResult.lastInsertRowid.toString() });
    }

    return NextResponse.json({ error: "Failed to save report config" }, { status: 500 });
    
  } catch (err) {
    console.error("Error inserting report config:", err);
    await saveError(err, null, configId);
    return NextResponse.json({ error: "Failed to save report config" }, { status: 500 });
  }
}



export async function GET(req: NextRequest) {
  try {
    await ensureReportsConfigTable(); // make sure the table exists

    // Query all report configs
    const result = await dbClient.execute(`
      SELECT
        id,
        platform,
        metrics,
        level,
        dateRangeEnum,
        cadence,
        delivery,
        email,
        createdAt,
        lastRunAt,
        nextRunAt,
        lastError,
        lastReportId
      FROM reportconfigs
    `);

    // Map result rows to the shape the UI expects
    const configs = result.rows.map((row: any) => ({
      id: row.id,
      platform: row.platform,
      metrics: JSON.parse(row.metrics || "[]"), // parse JSON array if needed
      level: row.level,
      dateRangeEnum: row.dateRangeEnum,
      cadence: row.cadence,
      delivery: row.delivery,         // added
      email: row.email,               // added
      createdAt: row.createdAt,
      lastRunAt: row.lastRunAt,
      nextRunAt: row.nextRunAt,
      lastError: row.lastError,
      lastReportId: row.lastReportId,
    }));

    console.log("fetched report configs")
    console.log(configs)
    return NextResponse.json(configs);
  } catch (err) {
    console.error("Error fetching report configs:", err);
    return NextResponse.json({ error: "Failed to fetch report configs" }, { status: 500 });
  }
}

