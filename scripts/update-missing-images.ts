import { getServiceClient } from '../src/lib/supabase';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    process.env[key.trim()] = value.trim();
  }
});

async function run() {
  const db = getServiceClient();
  const words = ['roof', 'key', 'mirror', 'lamp', 'clock', 'plate', 'cup', 'towel', 'river', 'lake', 'sea', 'mountain', 'rain', 'snow', 'tired', 'excited', 'hungry', 'thirsty', 'bored', 'sick', 'sleepy'];
  for (const word of words) {
    const url = '/images/vocab/' + word + '.webp';
    await db.from('vocabulary_items').update({ image_url: url }).eq('english_text', word);
    console.log('Updated ' + word);
  }
}
run();
