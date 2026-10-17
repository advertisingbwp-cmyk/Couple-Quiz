import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ARTIFACT_DIR = "C:\\Users\\Fahad Saleem\\.gemini\\antigravity\\brain\\956a049b-93da-4862-8e45-b7f119df1ba8";
const OUTPUT_DIR = path.resolve(process.cwd(), "public/prototype/photos");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const images = [
  { name: "pizza", file: "pizza_1792161271657.jpg", alt: "Cheesy pepperoni pizza slice on ceramic plate" },
  { name: "burger", file: "burger_1792161320518.jpg", alt: "Gourmet cheeseburger with lettuce and brioche bun" },
  { name: "sleeping", file: "sleeping_1792161326159.jpg", alt: "Peaceful morning sleep in cozy duvet and pillows" },
  { name: "studying", file: "studying_1792161326254.jpg", alt: "Aesthetic wooden study desk with open book and tea" },
  { name: "coffee", file: "coffee_jpg_1792161319219.jpg", alt: "Artisan cappuccino with latte art in ceramic cup" },
  { name: "roadtrip", file: "roadtrip_1792161323289.jpg", alt: "Scenic mountain highway view during a road trip" },
  { name: "beach", file: "beach_1792161326684.jpg", alt: "Serene tropical beach with turquoise waves and sunset" },
  { name: "gaming", file: "gaming_1792161326014.jpg", alt: "Modern video game controller on desk with ambient lighting" },
  { name: "concert", file: "concert_1792161325535.jpg", alt: "Vibrant live music concert stage with lights and crowd" },
];

async function processAll() {
  console.log(`Processing ${images.length} prototype images...`);
  for (const img of images) {
    const srcPath = path.join(ARTIFACT_DIR, img.file);
    if (!fs.existsSync(srcPath)) {
      console.error(`Missing source image: ${srcPath}`);
      continue;
    }

    const outWebp = path.join(OUTPUT_DIR, `${img.name}.webp`);
    const outJpg = path.join(OUTPUT_DIR, `${img.name}.jpg`);

    // Output 480x480 square crop with 85% webp quality for high performance
    await sharp(srcPath)
      .resize(480, 480, { fit: "cover", position: "center" })
      .webp({ quality: 85 })
      .toFile(outWebp);

    await sharp(srcPath)
      .resize(480, 480, { fit: "cover", position: "center" })
      .jpeg({ quality: 85, progressive: true })
      .toFile(outJpg);

    const stats = fs.statSync(outWebp);
    console.log(`✓ ${img.name}: ${Math.round(stats.size / 1024)} KB (${outWebp})`);
  }
  console.log("All prototype photos processed successfully!");
}

processAll().catch((err) => {
  console.error("Error processing images:", err);
  process.exit(1);
});
