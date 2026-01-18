import { createClient } from "@libsql/client";

// Connect to Turso
export const dbClient = createClient({
  url: process.env.TURSO_ENDPOINT!,      
  authToken: process.env.TURSO_TOKEN!, 
});

// Helper functions
export async function run(sql: string, params: any[] = []) {
  return await dbClient.execute(sql, params);
}

export async function saveError(error: any, reportId: number | null, configId: number | null){

  if (reportId) {
    await dbClient.execute(
      `UPDATE reports
       SET status = ?, error = ?
       WHERE reportId = ?`,
      ['failed', error instanceof Error ? error.message : 'Unknown error', reportId]
    );
  }
  
  if (configId) {
    await dbClient.execute(
      `UPDATE reportconfigs
       SET lastError = ?
       WHERE id = ?`,
      [ error instanceof Error ? error.message : 'Unknown error',  configId]
    );
  }
}

// Initialize tables if not exist
export async function initializeDatabase() {
  try {
    await run(`
      CREATE TABLE IF NOT EXISTS report_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        metrics TEXT NOT NULL,
        level TEXT NOT NULL,
        date_range_enum TEXT NOT NULL,
        cadence TEXT NOT NULL,
        delivery TEXT NOT NULL,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        data TEXT,
        llm_analysis TEXT,
        error_message TEXT,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (config_id) REFERENCES report_configs (id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS scheduled_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_id INTEGER NOT NULL,
        next_run_at DATETIME NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (config_id) REFERENCES report_configs (id)
      )
    `);

    console.log("Turso database initialized successfully");
  } catch (error) {
    console.error("Turso database initialization failed:", error);
    throw error;
  }
}

