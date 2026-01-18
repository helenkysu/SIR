import { dbClient, saveError } from "../../lib/database";
import { generateReport } from "../../lib/generateReport";

export async function loader() {
  const now = new Date().toISOString();

  let newReportId: number | null = null;

  const { rows } = await dbClient.execute(
    "SELECT * FROM reportconfigs WHERE nextRunAt IS NOT NULL AND nextRunAt <= ?",
    [now]
  );

  for (const config of rows) {
    const configId = config.id as number;
    try{
        const res = await dbClient.execute(
            "INSERT INTO reports (reportconfigId, status, runStart) VALUES (?, ?, ?)",
            [config.id, 'pending', now]
        );
        newReportId = Number(res.lastInsertRowid);
        await generateReport(newReportId, config, true);
    }
    catch(error){
        console.error('Error generating report:', error);
        await saveError(error, newReportId, configId)
    }
    
  }

  return new Response("Cron Processed", { status: 200 });
}