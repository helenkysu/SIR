import { initializeDatabase } from "../../../lib/database";

export async function GET() {
  console.log("Creating reportconfigs and reports tables")
  initializeDatabase();
  return new Response("Initialized DB tables", { status: 200 });
}