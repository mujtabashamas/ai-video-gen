import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import { CONFIG } from '../config.js';

export interface ImageGenInput {
  avatarImage: string;
  productImage: string;
  product: string;
  outputPath: string;
}

export interface ImageGenOutput {
  imagePath: string;
}

export async function generateImage(input: ImageGenInput): Promise<ImageGenOutput> {
  if (!CONFIG.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY not set in .env file');
  }

  console.log('🖼️  Generating composite image...');
  console.log(`   Avatar: ${input.avatarImage}`);
  console.log(`   Product: ${input.productImage}`);

  const ai = new GoogleGenAI({ apiKey: CONFIG.gemini.apiKey });

  // Build prompt for combining avatar + product
  const prompt = `Create a professional product photo for social media advertising.

CRITICAL - ANATOMY REQUIREMENTS:
- Person must have EXACTLY 5 fingers on each hand (no extra fingers)
- Both hands should be clearly visible and anatomically correct
- Natural hand position holding the product bottle
- Thumbs on one side, 4 fingers on the other side of the bottle

SCENE SETUP:
- Person from first image sits at their desk/workspace
- Holding the product bottle (from second image) with BOTH hands at chest level
- Product label facing camera, clearly visible and readable
- Person looking directly at camera with warm, genuine smile
- Upper body shot (chest up)

HAND POSITIONING:
- Both hands wrapped around the product bottle
- Natural, relaxed grip
- Product held at chest/mid-torso level
- Hands positioned naturally - no awkward angles or extra fingers

ENVIRONMENT:
- Professional office or home workspace setting
- Clean, organized desk with minimal items
- Bright, natural lighting from window
- Soft focus background (depth of field)
- Professional but approachable atmosphere

STYLE:
- High-quality professional photo
- Natural colors and lighting
- Sharp focus on person and product
- Authentic, trustworthy feel
- Perfect for social media advertising

Product: ${input.product}

IMPORTANT: Ensure anatomically correct hands with exactly 5 fingers each, no deformities.`;

  // Load images
  const avatarData = fs.readFileSync(input.avatarImage);
  const productData = fs.readFileSync(input.productImage);

  const avatarBase64 = avatarData.toString('base64');
  const productBase64 = productData.toString('base64');

  const avatarExt = input.avatarImage.toLowerCase().split('.').pop();
  const productExt = input.productImage.toLowerCase().split('.').pop();

  const avatarMime = avatarExt === 'png' ? 'image/png' : 'image/jpeg';
  const productMime = productExt === 'png' ? 'image/png' : 'image/jpeg';

  // Generate image
  const response = await ai.models.generateContent({
    model: CONFIG.gemini.imageModel,
    contents: [
      { text: prompt },
      { inlineData: { mimeType: avatarMime, data: avatarBase64 } },
      { inlineData: { mimeType: productMime, data: productBase64 } },
    ],
  });

  // Extract and save image
  let imageFound = false;
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData as string, 'base64');

      // Ensure output directory exists
      const dir = input.outputPath.substring(0, input.outputPath.lastIndexOf('/'));
      if (dir) fs.mkdirSync(dir, { recursive: true });

      fs.writeFileSync(input.outputPath, buffer);
      imageFound = true;
      console.log(`✅ Composite image saved: ${input.outputPath}`);
    }
  }

  if (!imageFound) {
    throw new Error('No image generated in response');
  }

  return { imagePath: input.outputPath };
}

