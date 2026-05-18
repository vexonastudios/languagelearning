const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const mappingPath = path.resolve(__dirname, 'scripts', 'image-mappings.json');
const vocabPath = path.resolve(__dirname, 'content', 'seed', 'vocab.json');

const mapping = require(mappingPath);
const vocab = require(vocabPath);

const mapped = new Set(mapping.map(m => m.word.trim()));
const missing = new Set();

vocab.forEach(v => {
  v.distractors_en.forEach(d => {
    if (!mapped.has(d)) missing.add(d);
  });
});

async function generatePlaceholders() {
  const mArr = Array.from(missing);
  for (let word of mArr) {
    const fileName = word.replace(/ /g, '_') + '.webp';
    const outPath = path.join(__dirname, 'public', 'images', 'vocab', fileName);

    const svg = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#E2E8F0"/>
      <text x="50%" y="50%" font-family="sans-serif" font-size="36" font-weight="bold" fill="#334155" text-anchor="middle" dominant-baseline="middle">${word}</text>
    </svg>`;

    try {
      await sharp(Buffer.from(svg))
        .webp({ quality: 80 })
        .toFile(outPath);

      mapping.push({ word: word, url: '/images/vocab/' + fileName });
      console.log('Generated placeholder for:', word);
    } catch (e) {
      console.error('Failed for', word, e);
    }
  }

  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
  console.log('Finished writing placeholders and mapping. Total updated:', mArr.length);
}

generatePlaceholders().catch(console.error);
