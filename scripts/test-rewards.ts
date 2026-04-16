import { getServiceClient } from "../src/lib/supabase";

async function run() {
  const db = getServiceClient();
  const { data, error } = await db.from("rewards").select("*");
  console.log("Error:", error);
  console.log("Data:", data);
}

run();
