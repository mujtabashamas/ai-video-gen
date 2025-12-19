# AI Video Gen

Simple 3-step video generation: Avatar + Product → Video with audio

## 📺 Demo 

Watch the demo video: [Loom Demo](https://www.loom.com/share/70a24a6833f9417ab6440187b76c462b)

## Setup

```bash
npm install
cp env.example .env
# Add your GEMINI_API_KEY to .env
```

## Usage

```bash
npm start -- --config config.json
```

## Config

```json
{
  "product": "Product Name",
  "description": "Product description",
  "avatarImage": "./input/avatar.jpg",
  "productImage": "./input/product.png"
}
```

## Models

- **Image**: `gemini-3-pro-image-preview` (Nano Banana Pro)
- **Script**: `gemini-3-pro-preview` (Best quality)
- **Video**: `veo-3.1-generate-preview` (Latest with audio)

## Output

- `output/run_xxx_composite.png` - Combined image
- `output/run_xxx_script.txt` - Generated script
- `output/run_xxx_final.mp4` - Final video
