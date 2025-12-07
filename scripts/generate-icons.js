const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template for the icon (multiplication symbol)
const generateSVG = (size, padding = 0) => {
  const actualSize = size - padding * 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="${padding}" y="${padding}" width="${actualSize}" height="${actualSize}" fill="#3b82f6" rx="${Math.round(actualSize * 0.15)}"/>
  <text x="${size/2}" y="${size * 0.62}" font-family="Arial, sans-serif" font-size="${actualSize * 0.5}" font-weight="bold" fill="white" text-anchor="middle">×</text>
</svg>`);
};

// Generate maskable icons with safe zone padding (icon content should be in center 80%)
const generateMaskableSVG = (size) => {
  const padding = Math.round(size * 0.1); // 10% padding for safe zone
  return generateSVG(size, padding);
};

async function generateIcons() {
  const sizes = [192, 512];
  
  for (const size of sizes) {
    // Regular icon
    await sharp(generateSVG(size))
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
    console.log(`Generated icon-${size}x${size}.png`);
    
    // Maskable icon (with safe zone padding)
    await sharp(generateMaskableSVG(size))
      .png()
      .toFile(path.join(iconsDir, `icon-maskable-${size}x${size}.png`));
    console.log(`Generated icon-maskable-${size}x${size}.png`);
  }
  
  // Generate Apple touch icon (180x180)
  await sharp(generateSVG(180))
    .png()
    .toFile(path.join(iconsDir, `apple-touch-icon.png`));
  console.log(`Generated apple-touch-icon.png`);
  
  console.log('\n✅ All PWA icons generated successfully!');
}

generateIcons().catch(console.error);
