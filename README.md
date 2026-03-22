<img src="http://wiro.ai/images/logos/logo/logo.png" alt="Wiro Logo" width="200"/>

# n8n-nodes-wiroai

A [n8n](https://n8n.io) community node pack that gives you access to **290+ AI models** from [Wiro AI](https://wiro.ai) directly in your workflows — video generation, image creation, audio/speech, LLMs, 3D, and more.

<img src="https://wiro.ai/images/illustrations/koala-404.png" alt="Wiro Koala" width="50"/>

---

## Features

- **Video Generation** — Sora 2, Veo 3, Kling V3, Seedance, Hailuo, PixVerse, Runway, and more
- **Image Generation** — Imagen V4, Flux 2 Pro, Seedream, Nano Banana, SDXL, and more
- **Image Editing** — Virtual Try-On, Face Swap, Background Removal, Inpainting, Style Transfer
- **Audio & Speech** — ElevenLabs TTS, Gemini TTS, Whisper STT, Voice Clone, Music Generation
- **LLM Chat** — GPT-5, Gemini 3, Qwen 3.5, RAG Chat (YouTube, GitHub, Website, Documents)
- **3D Generation** — Trellis 2, Hunyuan3D 2.1
- **Translation** — Gemma-based translation (4B, 12B, 27B) with image support
- **E-Commerce** — Product Photoshoot, Product Ads, Shopify Templates, UGC Creator
- **HR Tools** — CV Evaluator, Resume Parser, Job Description Generator, Exit Interview, Culture Fit

Each tool is implemented as a **separate node** for modular and easy use.

---

## Installation

Follow the [n8n community nodes guide](https://docs.n8n.io/integrations/community-nodes/installation/) to install this package.

```bash
npm install @wiro-ai/n8n-nodes-wiroai
```

---

## Authentication

Wiro supports two authentication methods:

### Signature-Based (Recommended)
Uses HMAC-SHA256 to sign every request. The API secret never leaves your environment.

### API Key Only (Simple)
Just include the API key — no signature required. Best for server-side applications.

**Setup:**

1. Go to [wiro.ai](https://wiro.ai) and sign up
2. Create a project at [wiro.ai/panel/project/](https://wiro.ai/panel/project/)
3. Choose your authentication method (Signature-Based or API Key Only)
4. In n8n, go to Credentials → Add new → **Wiro API**
5. Select your auth method and enter your credentials

See [Wiro Authentication Docs](https://wiro.ai/docs/authentication) for details.

---

## Usage Example

To generate a video with Sora 2 Pro:

1. Add the **Wiro - Sora 2 Pro** node
2. Set:
   - Prompt: `A cat astronaut floating in space`
   - Seconds: `8`
   - Resolution: `1080p`
3. Run the workflow

**Output:**

```json
{
  "taskid": "abc123",
  "status": "completed",
  "url": "https://cdn1.wiro.ai/xyz/0.mp4"
}
```

---

## Compatibility

- Requires: `n8n v1.0+`
- Node.js: `v18+`

---

## Resources

- [Wiro API Docs](https://wiro.ai/docs)
- [Wiro Model Marketplace](https://wiro.ai/models)
- [n8n Custom Node Docs](https://docs.n8n.io/integrations/creating-nodes/)
- [Community Node Guide](https://docs.n8n.io/integrations/community-nodes/)

---

## License

[MIT](LICENSE.md)
