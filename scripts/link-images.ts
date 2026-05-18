import { getServiceClient } from "../src/lib/supabase";
import fs from "fs";
import path from "path";

async function run() {
  const db = getServiceClient();
  const mappings = [
    { id: "e377efaf-c6f7-494e-943e-17888c9bc81f", file: "one_vector_art_1776882043411.png" },
    { id: "abb56ecd-9e07-4bd9-9418-9914b9d35ba1", file: "two_vector_art_1776882056849.png" },
    { id: "db8c346a-8b11-477c-9a48-e1fbcf1023bb", file: "three_vector_art_1776882073155.png" },
    { id: "e345c6fd-10c8-42af-a7e9-a5b11e68342f", file: "four_vector_art_1776882086736.png" },
    { id: "2fc05447-0deb-49cd-a0be-6fc4258068a9", file: "five_vector_art_1776882099074.png" },
    { id: "8ba0e7f6-078e-4883-85cd-5a34695da761", file: "six_vector_art_1776882114795.png" },
    { id: "4f28918d-de12-423a-8aa7-0cfeadae12ee", file: "seven_vector_art_1776882127835.png" },
    { id: "e6d6719b-be16-42ae-ad8a-9de6d4850cee", file: "eight_vector_art_1776882142625.png" },
    { id: "39f481f8-36b5-4888-a298-e4c8b5bac898", file: "nine_vector_art_1776882155435.png" },
    { id: "7cd089c7-18be-4033-a563-2e629bbe9c0a", file: "ten_vector_art_1776882169175.png" },
    { id: "6ee9e6cf-04af-40d4-98ca-e734ee67ccd4", file: "shirt_vector_art_1776882190468.png" },
    { id: "27a09d3c-9596-47ed-ba5f-0c8b629c5b4d", file: "pants_vector_art_1776882204339.png" },
    { id: "73c6dcd2-014c-44fe-8527-b252acaba0cd", file: "hat_vector_art_1776882217395.png" },
    { id: "a23d202c-6b13-44b2-90d3-b6144134f15c", file: "circle_vector_art_1776882229436.png" },
    { id: "336ac073-e4e8-4431-90d0-5c86fd5379d0", file: "square_vector_art_1776882243330.png" }
  ];

  const brainDir = "C:\\Users\\James Jennings\\.gemini\\antigravity\\brain\\5ecc8de3-2a4c-4ca0-a51f-52b03dc59819";

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
