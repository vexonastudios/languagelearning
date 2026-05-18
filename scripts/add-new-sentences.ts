import { getServiceClient } from "../src/lib/supabase";
import fs from "fs";
import path from "path";

const newSentences = [
  // Home
  { english_text: "The bed is soft.", spanish_text: "La cama es suave.", lesson: "Home", category: "Home", grammar_focus: "adjectives" },
  { english_text: "Open the window.", spanish_text: "Abre la ventana.", lesson: "Home", category: "Home", grammar_focus: "verbs" },
  { english_text: "The room is big.", spanish_text: "La habitación es grande.", lesson: "Home", category: "Home", grammar_focus: "adjectives" },
  { english_text: "I cook in the kitchen.", spanish_text: "Yo cocino en la cocina.", lesson: "Home", category: "Home", grammar_focus: "verbs" },
  { english_text: "The bathroom is clean.", spanish_text: "El baño está limpio.", lesson: "Home", category: "Home", grammar_focus: "adjectives" },
  { english_text: "Sit on the sofa.", spanish_text: "Siéntate en el sofá.", lesson: "Home", category: "Home", grammar_focus: "verbs" },
  { english_text: "Look at the mirror.", spanish_text: "Mira el espejo.", lesson: "Home", category: "Home", grammar_focus: "verbs" },
  { english_text: "The lamp is bright.", spanish_text: "La lámpara es brillante.", lesson: "Home", category: "Home", grammar_focus: "adjectives" },
  { english_text: "The clock is on the wall.", spanish_text: "El reloj está en la pared.", lesson: "Home", category: "Home", grammar_focus: "prepositions" },
  { english_text: "The cup is full.", spanish_text: "El vaso está lleno.", lesson: "Home", category: "Home", grammar_focus: "adjectives" },

  // Nature
  { english_text: "The grass is green.", spanish_text: "El césped es verde.", lesson: "Nature", category: "Nature", grammar_focus: "adjectives" },
  { english_text: "A leaf is falling.", spanish_text: "Una hoja está cayendo.", lesson: "Nature", category: "Nature", grammar_focus: "verbs" },
  { english_text: "The river is cold.", spanish_text: "El río está frío.", lesson: "Nature", category: "Nature", grammar_focus: "adjectives" },
  { english_text: "The lake is blue.", spanish_text: "El lago es azul.", lesson: "Nature", category: "Nature", grammar_focus: "adjectives" },
  { english_text: "I like the sea.", spanish_text: "Me gusta el mar.", lesson: "Nature", category: "Nature", grammar_focus: "verbs" },
  { english_text: "The mountain is tall.", spanish_text: "La montaña es alta.", lesson: "Nature", category: "Nature", grammar_focus: "adjectives" },
  { english_text: "The sky is clear.", spanish_text: "El cielo está claro.", lesson: "Nature", category: "Nature", grammar_focus: "adjectives" },
  { english_text: "I see a cloud.", spanish_text: "Veo una nube.", lesson: "Nature", category: "Nature", grammar_focus: "verbs" },
  { english_text: "The rain is wet.", spanish_text: "La lluvia está mojada.", lesson: "Nature", category: "Nature", grammar_focus: "adjectives" },
  { english_text: "The snow is white.", spanish_text: "La nieve es blanca.", lesson: "Nature", category: "Nature", grammar_focus: "adjectives" },

  // Feelings
  { english_text: "I am happy today.", spanish_text: "Estoy feliz hoy.", lesson: "Feelings", category: "Feelings", grammar_focus: "feelings" },
  { english_text: "The boy is sad.", spanish_text: "El niño está triste.", lesson: "Feelings", category: "Feelings", grammar_focus: "feelings" },
  { english_text: "She is very angry.", spanish_text: "Ella está muy enojada.", lesson: "Feelings", category: "Feelings", grammar_focus: "feelings" },
  { english_text: "We are tired now.", spanish_text: "Estamos cansados ahora.", lesson: "Feelings", category: "Feelings", grammar_focus: "feelings" },
  { english_text: "I feel excited!", spanish_text: "¡Me siento emocionado!", lesson: "Feelings", category: "Feelings", grammar_focus: "feelings" },
  { english_text: "The cat is scared.", spanish_text: "El gato está asustado.", lesson: "Feelings", category: "Feelings", grammar_focus: "feelings" },
  { english_text: "I am very hungry.", spanish_text: "Tengo mucha hambre.", lesson: "Feelings", category: "Feelings", grammar_focus: "feelings" },
  { english_text: "He is thirsty.", spanish_text: "Él tiene sed.", lesson: "Feelings", category: "Feelings", grammar_focus: "feelings" },
  { english_text: "I feel sick.", spanish_text: "Me siento enfermo.", lesson: "Feelings", category: "Feelings", grammar_focus: "feelings" },
  { english_text: "The baby is sleepy.", spanish_text: "El bebé tiene sueño.", lesson: "Feelings", category: "Feelings", grammar_focus: "feelings" }
];

async function run() {
  const db = getServiceClient();
  
  // 1. Get lesson IDs
  const { data: lessonsData } = await db.from('lessons').select('id, title').in('title', ['Home', 'Nature', 'Feelings']);
  const lessonMap: Record<string, string> = {};
  for (const l of lessonsData || []) {
    lessonMap[l.title] = l.id;
  }

  // 2. Prepare DB rows
  const sentencesPath = path.join(process.cwd(), "content/seed/sentences.json");
  const existingSentences = JSON.parse(fs.readFileSync(sentencesPath, "utf8"));
  const currentCount = existingSentences.length;
  
  const sentenceRows = newSentences.map((s, i) => ({
    english_text: s.english_text,
    spanish_text: s.spanish_text,
    lesson_id: lessonMap[s.lesson],
    category: s.category,
    grammar_focus: s.grammar_focus,
    sort_order: currentCount + i,
  }));

  // 3. Insert to DB
  const { error: insertError } = await db.from('sentences').insert(sentenceRows);
  if (insertError) {
    console.error("Insert error:", insertError);
    return;
  }
  console.log(`Inserted ${sentenceRows.length} new sentences into the database.`);

  // 4. Append to sentences.json
  const updatedSentences = [...existingSentences, ...newSentences];
  fs.writeFileSync(sentencesPath, JSON.stringify(updatedSentences, null, 2));
  console.log(`Updated content/seed/sentences.json! Total items now: ${updatedSentences.length}`);
}

run();
