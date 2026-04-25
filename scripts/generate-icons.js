#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// This script generates PNG icons from SVG using a simple approach
// For production use, install 'sharp': npm install --save-dev sharp
// Then uncomment the sharp code below

const iconsDir = path.join(__dirname, '../public/icons');
const iconSvgPath = path.join(iconsDir, 'icon.svg');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Icon generation script');
console.log('======================');
console.log('');
console.log('To generate PNG icons from SVG, you have two options:');
console.log('');
console.log('Option 1: Use an online converter');
console.log('  1. Go to https://convertio.co/svg-png/');
console.log('  2. Upload public/icons/icon.svg');
console.log('  3. Convert to PNG');
console.log('  4. Download as icon-192x192.png and icon-512x512.png');
console.log('  5. Save to public/icons/');
console.log('');
console.log('Option 2: Use sharp (recommended for CI/CD)');
console.log('  1. Install sharp: npm install --save-dev sharp');
console.log('  2. Run: npm run generate-icons:sharp');
console.log('');
console.log('Option 3: Use ImageMagick/GraphicsMagick locally');
console.log('  brew install imagemagick');
console.log('  convert -density 192 public/icons/icon.svg -resize 192x192 public/icons/icon-192x192.png');
console.log('  convert -density 512 public/icons/icon.svg -resize 512x512 public/icons/icon-512x512.png');
console.log('');

// Try to use sharp if available
try {
  const sharp = require('sharp');

  const sizes = [
    { size: 192, name: 'icon-192x192' },
    { size: 512, name: 'icon-512x512' },
  ];

  console.log('Sharp is installed. Generating PNG icons...');
  console.log('');

  sizes.forEach(({ size, name }) => {
    const svgContent = fs.readFileSync(iconSvgPath, 'utf-8');
    const outputPath = path.join(iconsDir, `${name}.png`);

    sharp(Buffer.from(svgContent), { density: size })
      .png()
      .resize(size, size, { fit: 'contain', background: { r: 102, g: 126, b: 234, alpha: 1 } })
      .toFile(outputPath)
      .then(() => {
        console.log(`✓ Generated ${name}.png`);
      })
      .catch((err) => {
        console.error(`✗ Failed to generate ${name}.png:`, err);
      });
  });

  // Also generate maskable variants
  console.log('');
  console.log('Generating maskable variants...');

  sizes.forEach(({ size, name }) => {
    const svgContent = fs.readFileSync(iconSvgPath, 'utf-8');
    const outputPath = path.join(iconsDir, `${name}-maskable.png`);

    sharp(Buffer.from(svgContent), { density: size })
      .png()
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toFile(outputPath)
      .then(() => {
        console.log(`✓ Generated ${name}-maskable.png`);
      })
      .catch((err) => {
        console.error(`✗ Failed to generate ${name}-maskable.png:`, err);
      });
  });
} catch (err) {
  console.log('Sharp not installed. Follow Option 1 or 2 above.');
}
