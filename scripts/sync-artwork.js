const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\James Jennings\\.gemini\\antigravity\\brain\\3f78e9ad-ccb8-4178-bc96-63a8be5bf5d9';
const destDir = path.join(__dirname, '..', 'public', 'images', 'vocab');

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

const files = fs.readdirSync(srcDir);
const mappings = [];

files.forEach(file => {
    if (file.includes('_vector_art_') && file.endsWith('.png')) {
        let word = file.split('_vector_art_')[0];
        if (word.startsWith('color_')) word = word.replace('color_', '');
        const destFile = `${word}.png`;
        fs.copyFileSync(path.join(srcDir, file), path.join(destDir, destFile));
        console.log(`Copied ${file} -> ${destFile}`);
        mappings.push({ word, url: `/images/vocab/${destFile}` });
    }
});

fs.writeFileSync(path.join(__dirname, 'image-mappings.json'), JSON.stringify(mappings, null, 2));
