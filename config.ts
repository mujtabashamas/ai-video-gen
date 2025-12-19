import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    imageModel: 'gemini-2.5-flash-image',
    textModel: 'gemini-3-pro-preview',
    videoModel: 'veo-3.1-generate-preview',
  },
  inputDir: './input',
  outputDir: './output',
};

