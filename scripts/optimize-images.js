const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars')
  process.exit(1)
}

const db = createClient(supabaseUrl, supabaseKey)
const imageDir = path.join(__dirname, '../public/images/vocab')

async function optimizeImages() {
  console.log('Scanning for PNG images to optimize...')
  const files = fs.readdirSync(imageDir).filter(f => f.endsWith('.png'))
  console.log(`Found ${files.length} PNGs.`)

  let processed = 0
  let totalSaved = 0

  for (const file of files) {
    const inputPath = path.join(imageDir, file)
    const baseName = path.basename(file, '.png')
    const outputPath = path.join(imageDir, `${baseName}.webp`)

    // Check if webp already exists (in case of partial run)
    if (fs.existsSync(outputPath)) {
      processed++
      continue
    }

    const stats = fs.statSync(inputPath)
    const originalSize = stats.size

    // Resize and convert to WebP
    await sharp(inputPath)
      .resize({ width: 300, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath)

    const newStats = fs.statSync(outputPath)
    const newSize = newStats.size
    totalSaved += (originalSize - newSize)

    // Update DB
    const oldUrl = `/images/vocab/${file}`
    const newUrl = `/images/vocab/${baseName}.webp`
    
    await db
      .from('vocabulary_items')
      .update({ image_url: newUrl })
      .eq('image_url', oldUrl)

    processed++
    if (processed % 10 === 0) console.log(`Processed ${processed}/${files.length}...`)
  }

  // Safely delete PNGs after all processing to avoid stream lock errors
  console.log('Cleaning up original PNG files...')
  let deleted = 0
  for (const file of files) {
    try {
      fs.unlinkSync(path.join(imageDir, file))
      deleted++
    } catch (e) {
      // Ignore EPERM/locks
    }
  }

  const savedMB = (totalSaved / (1024 * 1024)).toFixed(2)
  console.log(`✅ Done! Optimized ${processed} images. Deleted ${deleted} PNGs. Saved ${savedMB} MB of space.`)
}

optimizeImages().catch(console.error)
