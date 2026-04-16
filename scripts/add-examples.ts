import fs from 'fs'

const data = JSON.parse(fs.readFileSync('./content/seed/vocab.json', 'utf8'))

const dict: Record<string, { en: string, es: string }> = {
  "apple": { en: "The apple is red.", es: "La manzana es roja." },
  "water": { en: "I drink water.", es: "Yo bebo agua." },
  "ball": { en: "The ball is round.", es: "La pelota es redonda." },
  "book": { en: "I read a book.", es: "Yo leo un libro." },
  "house": { en: "The house is big.", es: "La casa es grande." },
  "door": { en: "Open the door.", es: "Abre la puerta." },
  "table": { en: "The food is on the table.", es: "La comida está en la mesa." },
  "chair": { en: "Sit on the chair.", es: "Siéntate en la silla." },
  "sun": { en: "The sun is hot.", es: "El sol está caliente." },
  "tree": { en: "The tree is tall.", es: "El árbol es alto." },
  "dog": { en: "The dog runs fast.", es: "El perro corre rápido." },
  "cat": { en: "The cat is sleeping.", es: "El gato está durmiendo." },
  "bird": { en: "The bird flies high.", es: "El pájaro vuela alto." },
  "fish": { en: "The fish swims in the water.", es: "El pez nada en el agua." },
  "horse": { en: "The horse is strong.", es: "El caballo es fuerte." },
  "cow": { en: "The cow eats grass.", es: "La vaca come hierba." },
  "rabbit": { en: "The rabbit hops.", es: "El conejo salta." },
  "lion": { en: "The lion roars loudly.", es: "El león ruge fuerte." },
  "milk": { en: "I drink cold milk.", es: "Yo bebo leche fría." },
  "bread": { en: "I eat fresh bread.", es: "Yo como pan fresco." },
  "egg": { en: "The egg is white.", es: "El huevo es blanco." },
  "orange": { en: "The orange is sweet.", es: "La naranja es dulce." },
  "banana": { en: "The banana is yellow.", es: "El plátano es amarillo." },
  "rice": { en: "I eat rice with chicken.", es: "Yo como arroz con pollo." },
  "chicken": { en: "The chicken is tasty.", es: "El pollo está sabroso." },
  "red": { en: "My shirt is red.", es: "Mi camisa es roja." },
  "blue": { en: "The sky is blue.", es: "El cielo es azul." },
  "green": { en: "The grass is green.", es: "La hierba es verde." },
  "yellow": { en: "The sun is yellow.", es: "El sol es amarillo." },
  "black": { en: "The cat is black.", es: "El gato es negro." },
  "white": { en: "The snow is white.", es: "La nieve es blanca." },
  "pink": { en: "The flower is pink.", es: "La flor es rosada." },
  "mom": { en: "My mom is nice.", es: "Mi mamá es amable." },
  "dad": { en: "My dad is tall.", es: "Mi papá es alto." },
  "sister": { en: "My sister plays with me.", es: "Mi hermana juega conmigo." },
  "brother": { en: "My brother is funny.", es: "Mi hermano es chistoso." },
  "grandma": { en: "My grandma gives hugs.", es: "Mi abuela da abrazos." },
  "grandpa": { en: "My grandpa is smart.", es: "Mi abuelo es inteligente." },
  "baby": { en: "The baby is crying.", es: "El bebé está llorando." },
  "head": { en: "I wear a hat on my head.", es: "Llevo un sombrero en mi cabeza." },
  "hand": { en: "I wave my hand.", es: "Yo muevo mi mano." },
  "foot": { en: "I wear a shoe on my foot.", es: "Llevo un zapato en mi pie." },
  "eye": { en: "I see with my eye.", es: "Yo veo con mi ojo." },
  "ear": { en: "I hear with my ear.", es: "Yo escucho con mi oreja." },
  "nose": { en: "I smell with my nose.", es: "Yo huelo con mi nariz." },
  "mouth": { en: "I smile with my mouth.", es: "Sonrío con mi boca." },
  "run": { en: "I like to run.", es: "Me gusta correr." },
  "eat": { en: "We eat dinner together.", es: "Cenamos juntos." },
  "drink": { en: "Drink some water.", es: "Bebe un poco de agua." },
  "sleep": { en: "It is time to sleep.", es: "Es hora de dormir." },
  "jump": { en: "Jump very high!", es: "¡Salta muy alto!" },
  "see": { en: "Do you see the bird?", es: "¿Ves el pájaro?" },
  "walk": { en: "Let's take a walk.", es: "Vamos a caminar." },
  "play": { en: "I play in the park.", es: "Yo juego en el parque." },
  "big": { en: "The elephant is big.", es: "El elefante es grande." },
  "small": { en: "The mouse is small.", es: "El ratón es pequeño." },
  "hot": { en: "The coffee is hot.", es: "El café está caliente." },
  "cold": { en: "The ice is cold.", es: "El hielo está frío." },
  "happy": { en: "I feel very happy.", es: "Me siento muy feliz." },
  "school": { en: "I go to school.", es: "Voy a la escuela." },
  "friend": { en: "He is my best friend.", es: "Él es mi mejor amigo." },
  "yes": { en: "Yes, I like it.", es: "Sí, me gusta." },
  "no": { en: "No, thank you.", es: "No, gracias." },
  "hello": { en: "Hello, how are you?", es: "Hola, ¿cómo estás?" },
  "goodbye": { en: "Goodbye, see you later.", es: "Adiós, nos vemos luego." },
  "thank you": { en: "Thank you for the gift.", es: "Gracias por el regalo." },
  "please": { en: "More water, please.", es: "Más agua, por favor." },
  "good morning": { en: "Good morning, everyone.", es: "Buenos días a todos." },
  "good night": { en: "Good night, sleep well.", es: "Buenas noches, duerme bien." },
  "one": { en: "I have one apple.", es: "Tengo una manzana." },
  "two": { en: "There are two cats.", es: "Hay dos gatos." },
  "three": { en: "I see three birds.", es: "Veo tres pájaros." },
  "four": { en: "Four dogs are playing.", es: "Cuatro perros están jugando." },
  "five": { en: "I have five fingers.", es: "Tengo cinco dedos." },
  "ten": { en: "Count to ten.", es: "Cuenta hasta diez." },
  "elephant": { en: "The elephant is gray.", es: "El elefante es gris." },
  "frog": { en: "The frog jumps in the pond.", es: "La rana salta en el estanque." },
  "butterfly": { en: "The butterfly has pretty wings.", es: "La mariposa tiene alas bonitas." },
  "soup": { en: "The soup is hot.", es: "La sopa está caliente." },
  "pizza": { en: "We eat pizza on Fridays.", es: "Comemos pizza los viernes." }
}

for (const item of data) {
  const match = dict[item.english_text.toLowerCase()]
  if (match) {
    item.example_en = match.en
    item.example_es = match.es
  } else {
    // Basic fallback if missing
    item.example_en = `The ${item.english_text} is here.`
    item.example_es = `El/La ${item.spanish_text} está aquí.`
  }
}

fs.writeFileSync('./content/seed/vocab.json', JSON.stringify(data, null, 2))
console.log('✅ Added example sentences to all vocab words!')
