#!/usr/bin/env node

import * as fs from 'fs';
import { generateImage } from './modules/image-generation.js';
import { generateScript } from './modules/script-generation.js';
import { generateVideo } from './modules/video-generation.js';
import type { VideoGenInput, VideoGenOutput } from './types.js';

// ============================================================================
// LOGGING
// ============================================================================

let logFile: string;
let logStream: fs.WriteStream;

function log(message: string) {
  console.log(message);
  if (logStream) {
    logStream.write(message + '\n');
  }
}

// ============================================================================
// PIPELINE
// ============================================================================

async function runPipeline(input: VideoGenInput): Promise<VideoGenOutput> {
  const runId = `run_${Date.now()}`;
  const outputDir = './output';

  fs.mkdirSync(outputDir, { recursive: true });

  // Validate required inputs
  if (!input.avatarImage || !fs.existsSync(input.avatarImage)) {
    throw new Error(`Avatar image required but not found: ${input.avatarImage}`);
  }
  if (!input.productImage || !fs.existsSync(input.productImage)) {
    throw new Error(`Product image required but not found: ${input.productImage}`);
  }

  // Create log file
  logFile = `${outputDir}/${runId}.log`;
  logStream = fs.createWriteStream(logFile, { flags: 'w' });

  log('\n═══════════════════════════════════════════════════════════════');
  log('🚀 AI VIDEO GENERATION');
  log('═══════════════════════════════════════════════════════════════\n');
  log(`Run ID: ${runId}`);
  log(`Product: ${input.product}`);
  log(`Avatar: ${input.avatarImage}`);
  log(`Product Image: ${input.productImage}`);
  log('');

  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('🖼️  STEP 1: IMAGE GENERATION');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const compositeImagePath = `${outputDir}/${runId}_composite.png`;
  const imageResult = await generateImage({
    avatarImage: input.avatarImage,
    productImage: input.productImage,
    product: input.product,
    outputPath: compositeImagePath,
  });
  log('');

  // Step 2: Script Generation
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('📝 STEP 2: SCRIPT GENERATION');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const scriptResult = await generateScript({
    compositeImage: imageResult.imagePath,
    product: input.product,
    description: input.description,
  });

  // Save script to file
  fs.writeFileSync(`${outputDir}/${runId}_script.txt`, scriptResult.script);
  log('');

  // Step 3: Video Generation
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('🎬 STEP 3: VIDEO GENERATION (Veo 3)');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const finalVideoPath = `${outputDir}/${runId}_final.mp4`;
  const videoResult = await generateVideo({
    compositeImage: imageResult.imagePath,
    script: scriptResult.script,
    product: input.product,
    outputPath: finalVideoPath,
  });
  log('');

  // Done
  log('═══════════════════════════════════════════════════════════════');
  log('🎉 COMPLETE!');
  log('═══════════════════════════════════════════════════════════════\n');
  log(`📁 Video: ${videoResult.videoPath}`);
  log(`🖼️  Image: ${imageResult.imagePath}`);
  log(`📝 Script: ${scriptResult.script}`);
  log('');

  // Close log stream
  logStream.end();

  return {
    runId,
    compositeImage: imageResult.imagePath,
    script: scriptResult.script,
    finalVideo: videoResult.videoPath,
  };
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  // Check if using config file
  if (args[0] === '--config' && args[1]) {
    console.log(`📄 Loading config from: ${args[1]}\n`);

    try {
      const configPath = args[1];
      const configData = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configData);

      // Validate required fields
      const required = ['product', 'description', 'avatarImage', 'productImage'];
      const missing = required.filter(f => !config[f]);
      if (missing.length > 0) {
        throw new Error(`Config missing required fields: ${missing.join(', ')}`);
      }

      const input: VideoGenInput = {
        product: config.product,
        description: config.description,
        avatarImage: config.avatarImage,
        productImage: config.productImage,
      };

      await runPipeline(input);
      return;
    } catch (error: any) {
      console.error('❌ Config error:', error.message);
      process.exit(1);
    }
  }

  if (args.length < 4) {
    console.log(`
Usage:
  npm start -- --config config.json
  npm start -- "<product>" "<description>" <avatar-image> <product-image>

Config format:
  {
    "product": "Product Name",
    "description": "Product description",
    "avatarImage": "./input/avatar.jpg",
    "productImage": "./input/product.png"
  }
`);
    process.exit(1);
  }

  // Parse CLI arguments
  const input: VideoGenInput = {
    product: args[0],
    description: args[1],
    avatarImage: args[2],
    productImage: args[3],
  };

  try {
    await runPipeline(input);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

export { runPipeline };

