import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import { CONFIG } from '../config.js';

export interface VideoGenInput {
  compositeImage: string;
  script: string;
  product: string;
  outputPath: string;
}

export interface VideoGenOutput {
  videoPath: string;
}

export async function generateVideo(input: VideoGenInput): Promise<VideoGenOutput> {
  if (!CONFIG.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY not set in .env file');
  }

  console.log('🎬 Generating video...');
  console.log(`   Image: ${input.compositeImage}`);
  console.log(`   Script: "${input.script}"`);

  const ai = new GoogleGenAI({ apiKey: CONFIG.gemini.apiKey });

  // Load composite image
  const imageData = fs.readFileSync(input.compositeImage);
  const imageBase64 = imageData.toString('base64');
  const ext = input.compositeImage.toLowerCase().split('.').pop();
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

  // Build video prompt that maintains the exact scene
  const prompt = `Animate this exact image - keep the scene, background, and setting IDENTICAL. Do not change anything about the environment, lighting, or composition.

The person speaks directly to camera saying: "${input.script}"

MOVEMENTS (subtle and natural):
- Mouth moving naturally with speech (lip sync to the words)
- Natural eye blinks
- Slight head movements (small nods for emphasis)
- Facial expressions matching the enthusiastic tone
- Minimal body movement (slight torso/shoulder shifts)
- Product stays in hands, minimal movement

CRITICAL REQUIREMENTS:
- Keep the EXACT same background, desk, and setting from the image
- Do NOT change the scene, location, or environment
- Maintain the same lighting and composition
- Only animate the person's face and subtle body movements
- The setting must remain completely static and unchanged

Duration: 8-10 seconds of natural speaking.`;

  console.log('   Submitting video generation request...');

  // Generate video using generateVideosInternal API with image
  let operation = await (ai.models as any).generateVideosInternal({
    model: CONFIG.gemini.videoModel,
    prompt: prompt,
    image: {
      imageBytes: imageBase64,
      mimeType: mimeType,
    },
    config: {
      numberOfVideos: 1,
      aspectRatio: '16:9',
      resolution: '1080p',
    },
  });

  console.log('   Video generation started, waiting for completion...');

  // Poll until operation is done
  while (!operation.done) {
    console.log('   ...Generating...');
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  if (operation?.response?.generatedVideos?.[0]?.video) {
    console.log('   Downloading video...');

    // Ensure output directory exists
    const dir = input.outputPath.substring(0, input.outputPath.lastIndexOf('/'));
    if (dir) fs.mkdirSync(dir, { recursive: true });

    // Download the generated video
    await ai.files.download({
      file: operation.response.generatedVideos[0].video,
      downloadPath: input.outputPath,
    });

    console.log(`✅ Video saved: ${input.outputPath}`);
    return { videoPath: input.outputPath };
  } else {
    throw new Error('Video generation operation failed');
  }
}

