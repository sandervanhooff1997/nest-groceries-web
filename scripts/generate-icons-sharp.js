#!/usr/bin/env node

/**
 * Icon generation script using sharp
 * Install: npm install --save-dev sharp
 * Run: npm run generate-icons:sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');
const iconSvgPath = path.join(iconsDir, 'icon.svg');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [
  { size: 192, name: 'icon-192x192' },
  { size: 512, name: 'icon-512x512' },
];

async function generateIcons() {
  try {
    console.log('Generating PNG icons from SVG...\n');

    // Read SVG file
    const svgBuffer = fs.readFileSync(iconSvgPath);

    // Generate regular icons
    for (const { size, name } of sizes) {
      const outputPath = path.join(iconsDir, `${name}.png`);

      await sharp(svgBuffer, { density: 192 })
        .resize(size, size, { fit: 'contain', background: { r: 102, g: 126, b: 234, alpha: 1 } })
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${name}.png (${size}x${size})`);
    }

    // Generate maskable variants (transparent background for adaptive icons)
    for (const { size, name } of sizes) {
      const outputPath = path.join(iconsDir, `${name}-maskable.png`);

      await sharp(svgBuffer, { density: 192 })
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${name}-maskable.png (${size}x${size})`);
    }

    // Generate shortcut icon
    const shortcutPath = path.join(iconsDir, 'shortcut-new-list.png');
    await sharp(svgBuffer, { density: 96 })
      .resize(96, 96, { fit: 'contain', background: { r: 102, g: 126, b: 234, alpha: 1 } })
      .png()
      .toFile(shortcutPath);

    console.log('✓ Generated shortcut-new-list.png (96x96)');

    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.error(
      '\nTo use this script, install sharp:\n  npm install --save-dev sharp',
    );
    process.exit(1);
  }
}

generateIcons();
