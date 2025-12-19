import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import { CONFIG } from '../config.js';

export interface ScriptGenInput {
  compositeImage: string;
  product: string;
  description: string;
}

export interface ScriptGenOutput {
  script: string;
}

export async function generateScript(input: ScriptGenInput): Promise<ScriptGenOutput> {
  if (!CONFIG.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY not set in .env file');
  }

  console.log('📝 Generating script...');
  console.log(`   Product: ${input.product}`);

  const ai = new GoogleGenAI({ apiKey: CONFIG.gemini.apiKey });

  // Load composite image
  const imageData = fs.readFileSync(input.compositeImage);
  const imageBase64 = imageData.toString('base64');
  const ext = input.compositeImage.toLowerCase().split('.').pop();
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

  const prompt = `Generate a natural UGC video script for this person promoting the product.

Product: ${input.product}
Description: ${input.description}

Requirements:
- EXACTLY 15-20 words (must fit in 8-10 seconds when spoken)
- Sound like a real person giving a quick personal recommendation
- Natural, conversational tone - like talking to a friend
- Genuine enthusiasm without being over the top
- One key benefit or personal experience
- No hashtags, no calls to action

Examples of good scripts:
- "Okay this thing is amazing - best sleep I've had in months, seriously."
- "Been using this for a week now and honestly? Total game changer."
- "Finally found something that actually works. You guys need to try this."

Return ONLY the script text, nothing else.`;

  const response = await ai.models.generateContent({
    model: CONFIG.gemini.textModel,
    contents: [
      { text: prompt },
      { inlineData: { mimeType, data: imageBase64 } },
    ],
  });

  const script = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  const wordCount = script.split(/\s+/).length;

  console.log(`✅ Script generated (${wordCount} words):`);
  console.log(`   "${script}"`);

  return { script };
}

