import { getServiceClient } from "../src/lib/supabase";
import fs from "fs";
import path from "path";

async function run() {
  const db = getServiceClient();
  const mappings = [
    { id: "934bbf39-3ac9-4cf0-a08b-f787f4f8ed07", file: "door_vector_art_1776356547326.png" },
    { id: "f3371f82-68ee-45d2-bd84-2b3c1c5346dc", file: "table_vector_art_1776356562433.png" },
    { id: "ba79eea0-9d48-4659-a879-d86e96b46cf6", file: "chair_vector_art_1776356575445.png" },
    { id: "790a8804-4afb-4245-a9c2-bf72b0a2d02f", file: "sun_vector_art_1776356593125.png" },
    { id: "09937202-9c95-4890-868f-a53bc452865e", file: "tree_vector_art_1776356608716.png" }
  ];

  const brainDir = "C:\\Users\\James Jennings\\.gemini\\antigravity\\brain\\3f78e9ad-ccb8-4178-bc96-63a8be5bf5d9";

  for (const m of mappings) {
    const localPath = path.join(brainDir, m.file);
    if (!fs.existsSync(localPath)) {
      console.error(`File not found: ${localPath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(localPath);
    const fileName = `vocab/${m.id}.png`;

    const { error: uploadError } = await db.storage
      .from("vocab-images")
      .upload(fileName, fileBuffer, {
        contentType: "image/png",
        upsert: true
      });

    if (uploadError) {
      console.error(`Upload error for ${m.id}:`, uploadError);
      continue;
    }

    const { data: urlData } = db.storage.from("vocab-images").getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    const { error: updateError } = await db
      .from("vocabulary_items")
      .update({ image_url: publicUrl })
      .eq("id", m.id);

    if (updateError) {
      console.error(`Update error for ${m.id}:`, updateError);
    } else {
      console.log(`Success: Linked ${m.file} to vocab ID ${m.id}`);
    }
  }
}

run();
