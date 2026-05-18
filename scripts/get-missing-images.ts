import { getServiceClient } from "../src/lib/supabase";

async function run() {
  const db = getServiceClient();
  const { data, error } = await db
    .from("vocabulary_items")
    .select("id, english_text")
    .filter("image_url", "is", null);

  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log(data.map(d => d.english_text).join(', '));
  console.log('Total missing:', data?.length);
}

run();
