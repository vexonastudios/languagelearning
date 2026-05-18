import { getServiceClient } from "../src/lib/supabase";
import fs from "fs";
import path from "path";

const newVocab = [
  // Home
  { english_text: "wall", spanish_text: "pared", lesson: "Home", category: "Home", tags: ["noun", "home"], difficulty: 2, distractors_en: ["floor", "door", "window"], distractors_es: ["piso", "puerta", "ventana"], example_en: "The wall is white.", example_es: "La pared es blanca." },
  { english_text: "floor", spanish_text: "piso", lesson: "Home", category: "Home", tags: ["noun", "home"], difficulty: 2, distractors_en: ["wall", "ceiling", "carpet"], distractors_es: ["pared", "techo", "alfombra"], example_en: "The floor is clean.", example_es: "El piso está limpio." },
  { english_text: "roof", spanish_text: "techo", lesson: "Home", category: "Home", tags: ["noun", "home"], difficulty: 2, distractors_en: ["wall", "floor", "house"], distractors_es: ["pared", "piso", "casa"], example_en: "The roof is red.", example_es: "El techo es rojo." },
  { english_text: "key", spanish_text: "llave", lesson: "Home", category: "Home", tags: ["noun", "home"], difficulty: 2, distractors_en: ["lock", "door", "coin"], distractors_es: ["cerradura", "puerta", "moneda"], example_en: "I have the key.", example_es: "Tengo la llave." },
  { english_text: "mirror", spanish_text: "espejo", lesson: "Home", category: "Home", tags: ["noun", "home"], difficulty: 2, distractors_en: ["window", "glass", "picture"], distractors_es: ["ventana", "vidrio", "cuadro"], example_en: "Look in the mirror.", example_es: "Mira en el espejo." },
  { english_text: "lamp", spanish_text: "lámpara", lesson: "Home", category: "Home", tags: ["noun", "home"], difficulty: 2, distractors_en: ["light", "candle", "sun"], distractors_es: ["luz", "vela", "sol"], example_en: "Turn on the lamp.", example_es: "Enciende la lámpara." },
  { english_text: "clock", spanish_text: "reloj", lesson: "Home", category: "Home", tags: ["noun", "home"], difficulty: 2, distractors_en: ["watch", "time", "bell"], distractors_es: ["reloj de pulsera", "tiempo", "campana"], example_en: "The clock is ticking.", example_es: "El reloj hace tictac." },
  { english_text: "plate", spanish_text: "plato", lesson: "Home", category: "Home", tags: ["noun", "home"], difficulty: 2, distractors_en: ["bowl", "cup", "fork"], distractors_es: ["tazón", "vaso", "tenedor"], example_en: "Put the food on the plate.", example_es: "Pon la comida en el plato." },
  { english_text: "cup", spanish_text: "vaso", lesson: "Home", category: "Home", tags: ["noun", "home"], difficulty: 2, distractors_en: ["plate", "bowl", "spoon"], distractors_es: ["plato", "tazón", "cuchara"], example_en: "I need a cup of water.", example_es: "Necesito un vaso de agua." },
  { english_text: "towel", spanish_text: "toalla", lesson: "Home", category: "Home", tags: ["noun", "home"], difficulty: 2, distractors_en: ["blanket", "shirt", "paper"], distractors_es: ["manta", "camisa", "papel"], example_en: "Dry your hands with a towel.", example_es: "Sécate las manos con una toalla." },

  // Nature
  { english_text: "grass", spanish_text: "césped", lesson: "Nature", category: "Nature", tags: ["noun", "nature"], difficulty: 2, distractors_en: ["tree", "flower", "leaf"], distractors_es: ["árbol", "flor", "hoja"], example_en: "The grass is green.", example_es: "El césped es verde." },
  { english_text: "leaf", spanish_text: "hoja", lesson: "Nature", category: "Nature", tags: ["noun", "nature"], difficulty: 2, distractors_en: ["branch", "tree", "grass"], distractors_es: ["rama", "árbol", "césped"], example_en: "A leaf fell from the tree.", example_es: "Una hoja cayó del árbol." },
  { english_text: "river", spanish_text: "río", lesson: "Nature", category: "Nature", tags: ["noun", "nature"], difficulty: 2, distractors_en: ["lake", "sea", "water"], distractors_es: ["lago", "mar", "agua"], example_en: "The river flows fast.", example_es: "El río fluye rápido." },
  { english_text: "lake", spanish_text: "lago", lesson: "Nature", category: "Nature", tags: ["noun", "nature"], difficulty: 2, distractors_en: ["river", "pond", "ocean"], distractors_es: ["río", "estanque", "océano"], example_en: "We swim in the lake.", example_es: "Nadamos en el lago." },
  { english_text: "sea", spanish_text: "mar", lesson: "Nature", category: "Nature", tags: ["noun", "nature"], difficulty: 2, distractors_en: ["ocean", "river", "beach"], distractors_es: ["océano", "río", "playa"], example_en: "The sea is deep.", example_es: "El mar es profundo." },
  { english_text: "mountain", spanish_text: "montaña", lesson: "Nature", category: "Nature", tags: ["noun", "nature"], difficulty: 2, distractors_en: ["hill", "rock", "valley"], distractors_es: ["colina", "roca", "valle"], example_en: "The mountain is high.", example_es: "La montaña es alta." },
  { english_text: "sky", spanish_text: "cielo", lesson: "Nature", category: "Nature", tags: ["noun", "nature"], difficulty: 2, distractors_en: ["cloud", "sun", "space"], distractors_es: ["nube", "sol", "espacio"], example_en: "The sky is blue.", example_es: "El cielo es azul." },
  { english_text: "cloud", spanish_text: "nube", lesson: "Nature", category: "Nature", tags: ["noun", "nature"], difficulty: 2, distractors_en: ["sky", "rain", "wind"], distractors_es: ["cielo", "lluvia", "viento"], example_en: "Look at that white cloud.", example_es: "Mira esa nube blanca." },
  { english_text: "rain", spanish_text: "lluvia", lesson: "Nature", category: "Nature", tags: ["noun", "nature"], difficulty: 2, distractors_en: ["snow", "water", "cloud"], distractors_es: ["nieve", "agua", "nube"], example_en: "I like the rain.", example_es: "Me gusta la lluvia." },
  { english_text: "snow", spanish_text: "nieve", lesson: "Nature", category: "Nature", tags: ["noun", "nature"], difficulty: 2, distractors_en: ["rain", "ice", "cold"], distractors_es: ["lluvia", "hielo", "frío"], example_en: "The snow is cold.", example_es: "La nieve es fría." },

  // Feelings
  { english_text: "sad", spanish_text: "triste", lesson: "Feelings", category: "Feelings", tags: ["adjective", "feeling"], difficulty: 2, distractors_en: ["happy", "angry", "tired"], distractors_es: ["feliz", "enojado", "cansado"], example_en: "Why are you sad?", example_es: "¿Por qué estás triste?" },
  { english_text: "angry", spanish_text: "enojado", lesson: "Feelings", category: "Feelings", tags: ["adjective", "feeling"], difficulty: 2, distractors_en: ["sad", "happy", "scared"], distractors_es: ["triste", "feliz", "asustado"], example_en: "He is very angry.", example_es: "Él está muy enojado." },
  { english_text: "tired", spanish_text: "cansado", lesson: "Feelings", category: "Feelings", tags: ["adjective", "feeling"], difficulty: 2, distractors_en: ["sleepy", "bored", "sick"], distractors_es: ["soñoliento", "aburrido", "enfermo"], example_en: "I am tired after work.", example_es: "Estoy cansado después del trabajo." },
  { english_text: "excited", spanish_text: "emocionado", lesson: "Feelings", category: "Feelings", tags: ["adjective", "feeling"], difficulty: 2, distractors_en: ["happy", "surprised", "scared"], distractors_es: ["feliz", "sorprendido", "asustado"], example_en: "We are excited for the trip.", example_es: "Estamos emocionados por el viaje." },
  { english_text: "scared", spanish_text: "asustado", lesson: "Feelings", category: "Feelings", tags: ["adjective", "feeling"], difficulty: 2, distractors_en: ["brave", "angry", "sad"], distractors_es: ["valiente", "enojado", "triste"], example_en: "The dog is scared.", example_es: "El perro está asustado." },
  { english_text: "hungry", spanish_text: "hambriento", lesson: "Feelings", category: "Feelings", tags: ["adjective", "feeling"], difficulty: 2, distractors_en: ["thirsty", "full", "tired"], distractors_es: ["sediento", "lleno", "cansado"], example_en: "I am hungry.", example_es: "Estoy hambriento." },
  { english_text: "thirsty", spanish_text: "sediento", lesson: "Feelings", category: "Feelings", tags: ["adjective", "feeling"], difficulty: 2, distractors_en: ["hungry", "tired", "sick"], distractors_es: ["hambriento", "cansado", "enfermo"], example_en: "Drink water if you are thirsty.", example_es: "Bebe agua si estás sediento." },
  { english_text: "bored", spanish_text: "aburrido", lesson: "Feelings", category: "Feelings", tags: ["adjective", "feeling"], difficulty: 2, distractors_en: ["excited", "happy", "tired"], distractors_es: ["emocionado", "feliz", "cansado"], example_en: "This movie makes me bored.", example_es: "Esta película me tiene aburrido." },
  { english_text: "sick", spanish_text: "enfermo", lesson: "Feelings", category: "Feelings", tags: ["adjective", "feeling"], difficulty: 2, distractors_en: ["healthy", "tired", "sad"], distractors_es: ["sano", "cansado", "triste"], example_en: "She feels sick today.", example_es: "Ella se siente enferma hoy." },
  { english_text: "sleepy", spanish_text: "soñoliento", lesson: "Feelings", category: "Feelings", tags: ["adjective", "feeling"], difficulty: 2, distractors_en: ["awake", "tired", "bored"], distractors_es: ["despierto", "cansado", "aburrido"], example_en: "The baby is sleepy.", example_es: "El bebé está soñoliento." }
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
  const vocabPath = path.join(process.cwd(), "content/seed/vocab.json");
  const existingVocab = JSON.parse(fs.readFileSync(vocabPath, "utf8"));
  const currentCount = existingVocab.length;
  
  const vocabRows = newVocab.map((v, i) => ({
    english_text: v.english_text,
    spanish_text: v.spanish_text,
    lesson_id: lessonMap[v.lesson],
    example_en: v.example_en,
    example_es: v.example_es,
    category: v.category,
    tags: v.tags,
    difficulty: v.difficulty,
    distractors_en: v.distractors_en,
    distractors_es: v.distractors_es,
    sort_order: currentCount + i,
  }));

  // 3. Insert to DB
  const { error: insertError } = await db.from('vocabulary_items').insert(vocabRows);
  if (insertError) {
    console.error("Insert error:", insertError);
    return;
  }
  console.log(`Inserted ${vocabRows.length} new vocabulary items into the database.`);

  // 4. Append to vocab.json
  const updatedVocab = [...existingVocab, ...newVocab];
  fs.writeFileSync(vocabPath, JSON.stringify(updatedVocab, null, 2));
  console.log(`Updated content/seed/vocab.json! Total items now: ${updatedVocab.length}`);
}

run();
