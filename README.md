<div align="center">
<img width="50%" alt="openvid Hero" src="https://openvid.dev/images/pages/openvid.svg" />

### Create professional demos and mockups in seconds, directly in your browser

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

[![oosmetrics](https://api.oosmetrics.com/api/v1/badge/achievement/0035870f-b4f4-4b12-9a1c-bef97b6785af.svg)](https://oosmetrics.com/repo/CristianOlivera1/openvid)

**Record your screen or upload a video, add smooth zooms, device mockups, 3D effects, and custom backgrounds - export a cinematic demo ready to share.**

[Live Demo](https://openvid.dev) · [Features](#-features) · [Installation](#-quick-start) · [Discord Community](https://discord.gg/f8KEyceS)

</div>

> **The following demo was fully recorded and edited using openvid.**

<div align="center">
  <video src="https://github.com/user-attachments/assets/7f5219db-c8e4-4143-a3d7-81e2bde24239" width="100%">
    Your browser does not support the video tag.
  </video>
</div>

---

## Features

### Video Input
- **Screen recording** - Capture your screen directly in the browser with no installation required
- **Upload your video** - MP4, WebM, QuickTime, and MKV
- **Drag & drop** - Fast file upload

---

### Mockup Creation
- **Mockups applied to images**
- **3D transformations**
- **Image masking (Mask Image)** for advanced cutouts
- Scale, rotation, perspective, and position adjustments

---

### Visual Customization

**Backgrounds**
- 100+ pre-designed backgrounds
- Custom images or Unsplash
- Solid colors and gradients
- Blur effect (0–100%)

**Effects**
- Dynamic padding
- Rounded corners
- Shadows
- Video rotation and positioning

---

### Canvas & Elements
- **Shapes** - Rectangles, circles, triangles
- **Text** - Custom fonts, colors, and sizes
- **SVG** - Import vector graphics
- **Images** - PNG, JPG, WebP overlays
- **Layers** - Depth control above or below the video

---

### Device Mockups
Add context to your demo with professional frames:
- Safari (macOS)
- Chrome
- Arc
- Samsung

---

### Zoom
- Zoom in/out at specific timeline moments
- Speed and easing control
- **3D Camera Movement** - Tilt and dynamic rotation based on points of interest
- **Adjustable Perspective** - Full control over X and Y axes for depth simulation

---

### Audio
- Multi-track support
- Per-track and master volume control
- Auto-trim based on video duration
- Toggle original video audio

---

### Export

**Quality**
- 4K (3840×2160) @ 30fps
- 2K (2560×1440) @ 30fps
- 1080p (1920×1080) @ 30fps
- 720p (1280×720) @ 30fps
- 480p (720×480) @ 24fps

**Format**
- MP4 (H.264)
- WebM (VP9 with transparent background support)
- GIF
- PNG, WEBP, JPG, AVIF

---

## Authentication

Powered by **Supabase Auth** with OAuth support:

<div align="center">

| Provider | Status |
|:--------:|:------:|
| Google   | ✅ Supported |
| GitHub   | ✅ Supported |
| Twitch   | ✅ Supported |

</div>

---

## Technology

**Video Processing**
- FFmpeg.wasm - fully in-browser rendering
- Canvas API - preview
- MediaBunny - optimized video pipeline
- Three.js - 3D effects
- HTML to Image - mockup export

**Storage**
- IndexedDB - locally recorded videos
- LocalStorage - user settings
- Supabase Storage - cloud backups (coming soon)

**UI/UX**
- Radix UI - accessible components
- Framer Motion - animations
- Tailwind CSS 4 - styling

---

## Quick Start
```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Add your Supabase credentials

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 💬 Community
¡Contributions are welcome! Join our **Discord** to collaborate:
[Join Discord](https://discord.gg/f8KEyceS)

## Contributors
<a href="https://github.com/CristianOlivera1/openvid/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=CristianOlivera1/openvid" />
</a>
