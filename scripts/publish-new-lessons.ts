import { getServiceClient } from "../src/lib/supabase";
import { prerenderLessonAudio } from "../src/lib/audio-cache";

async function run() {
  const db = getServiceClient();

  // 1. Get lesson IDs
  const { data: lessonsData } = await db.from('lessons').select('id, title').in('title', ['Home', 'Nature', 'Feelings']);
  
  if (!lessonsData || lessonsData.length === 0) {
    console.error("Could not find lessons.");
    return;
  }

  for (const lesson of lessonsData) {
    console.log(`\n🎙️ Pre-rendering audio for lesson: ${lesson.title} (${lesson.id})`);
    
    // Call the audio rendering service
    const result = await prerenderLessonAudio(lesson.id);
    
    console.log(`✅ Audio render complete for ${lesson.title}. Success: ${result.success}, Errors: ${result.errors.length}`);
    if (result.errors.length > 0) {
      console.error("Some audio failed to render:", result.errors);
    }

    // Publish the lesson
    console.log(`📢 Publishing lesson: ${lesson.title}`);
    const { error: updateError } = await db.from('lessons').update({
      status: 'published',
      audio_ready: result.errors.length === 0,
      updated_at: new Date().toISOString(),
    }).eq('id', lesson.id);

    if (updateError) {
      console.error(`❌ Failed to publish ${lesson.title}:`, updateError);
    } else {
      console.log(`✅ Lesson ${lesson.title} published successfully!`);
    }
  }
}

run();
