<div align="center">

<img src="https://raw.githubusercontent.com/wiroai/n8n-nodes-wiroai/main/.github/assets/wiro-logo.png" alt="Wiro AI" width="240">

# n8n-nodes-wiroai: Wiro AI Nodes for n8n

n8n community nodes for Wiro AI: generate video, images, speech and music, chat with LLMs and create 3D models inside your [n8n](https://n8n.io) workflows.

[![npm](https://img.shields.io/npm/v/@wiro-ai/n8n-nodes-wiroai?style=for-the-badge&color=111111)](https://www.npmjs.com/package/@wiro-ai/n8n-nodes-wiroai) [![n8n community node](https://img.shields.io/badge/n8n-community%20node-111111?style=for-the-badge&color=111111)](https://docs.n8n.io/integrations/community-nodes/) [![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-111111?style=for-the-badge&color=111111)](#compatibility) [![License: MIT](https://img.shields.io/badge/license-MIT-111111?style=for-the-badge&color=111111)](LICENSE.md)

[Website](https://wiro.ai) · [Models](https://wiro.ai/models) · [Docs](https://wiro.ai/docs/n8n-wiro-integration) · [Dashboard](https://wiro.ai/panel)

<img src="https://wiro.ai/images/illustrations/koala-404.png" alt="Wiro AI koala mascot" width="50"/>

</div>

This package, published on npm as `@wiro-ai/n8n-nodes-wiroai`, adds one n8n node per Wiro AI model, each with that model's own parameters. A node starts a task through the Wiro AI API, waits for it to finish and returns the task ID, status and output URL (text models return their reply as `message` instead). Every node is also marked `usableAsTool`, so an n8n AI Agent can call it as a tool.

---

## Features

- **Video Generation**: Sora 2, Veo 3, Kling V3, Seedance, Hailuo, PixVerse, Runway, and more
- **Image Generation**: Imagen V4, Flux 2 Pro, Seedream, Nano Banana, SDXL, and more
- **Image Editing**: Virtual Try-On, Face Swap, Background Removal, Inpainting, Style Transfer
- **Audio & Speech**: ElevenLabs TTS, Gemini TTS, Whisper STT, Voice Clone, Music Generation
- **LLM Chat**: GPT-5, Gemini 3, RAG Chat (YouTube, GitHub, Website, Documents)
- **3D Generation**: Trellis 2, Hunyuan3D 2.1
- **Translation**: Gemma-based translation (4B, 12B, 27B) with image support
- **E-Commerce**: Product Photoshoot, Product Ads, Shopify Templates, UGC Creator
- **HR Tools**: CV Evaluator, Resume Parser, Job Description Generator, Exit Interview, Culture Fit

Each tool is implemented as a **separate node** for modular and easy use.

---

## Installation

On a self-hosted n8n instance, an Owner or Admin can go to **Settings > Community Nodes**, select **Install**, enter `@wiro-ai/n8n-nodes-wiroai`, accept the risk notice and select **Install**. The [n8n community nodes guide](https://docs.n8n.io/integrations/community-nodes/installation/) covers the other install methods.

For a manual install (for example inside a Docker container), run this in `~/.n8n/nodes` and restart n8n:

```bash
npm install @wiro-ai/n8n-nodes-wiroai
```

---

## Authentication

Wiro AI supports two authentication methods:

### Signature-Based (Recommended)
Uses HMAC-SHA256 to sign every request. The API secret never leaves your environment.

### API Key Only (Simple)
Only the API key is sent, with no signature. Best for server-side applications.

**Setup:**

1. Go to [wiro.ai](https://wiro.ai) and sign up
2. Create a project at [wiro.ai/panel/project/new](https://wiro.ai/panel/project/new)
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

- Node.js 18 or later (`engines` in `package.json`)
- n8n 1.85.0 or later: every node imports `NodeConnectionTypes`, which first shipped with n8n 1.85.0 (`n8n-workflow` 1.83.0)

---

## Resources

- [Wiro AI n8n Integration Guide](https://wiro.ai/docs/n8n-wiro-integration)
- [Wiro API Docs](https://wiro.ai/docs)
- [Wiro Model Marketplace](https://wiro.ai/models)
- [n8n Custom Node Docs](https://docs.n8n.io/integrations/creating-nodes/)
- [Community Node Guide](https://docs.n8n.io/integrations/community-nodes/)

---

## More from Wiro AI

| Repository | What it is |
| --- | --- |
| [Wiro-MCP](https://github.com/wiroai/Wiro-MCP) | Official MCP server for Wiro AI, [`@wiro-ai/wiro-mcp` on npm](https://www.npmjs.com/package/@wiro-ai/wiro-mcp) |
| [Wiro-Plugin](https://github.com/wiroai/Wiro-Plugin) | Wiro AI plugin for Cursor, Claude Code, Gemini CLI and Devin |
| [Swift-QuickStart](https://github.com/wiroai/Swift-QuickStart) | WiroKit, the Wiro AI SDK for iOS |
| [Kotlin-QuickStart](https://github.com/wiroai/Kotlin-QuickStart) | WiroKit, the Wiro AI SDK for Android |
| [Dart-QuickStart](https://github.com/wiroai/Dart-QuickStart) | Wiro AI SDK for Dart and Flutter, [`wiro` on pub.dev](https://pub.dev/packages/wiro) |
| [ReactNative-QuickStart](https://github.com/wiroai/ReactNative-QuickStart) | Wiro AI SDK for React Native and Expo, [`@wiro-ai/wiro-react-native` on npm](https://www.npmjs.com/package/@wiro-ai/wiro-react-native) |
| [Swift-Realtime](https://github.com/wiroai/Swift-Realtime) | Realtime voice AI example for iOS |
| [Kotlin-Realtime](https://github.com/wiroai/Kotlin-Realtime) | Realtime voice AI example for Android |
| [Dart-Realtime](https://github.com/wiroai/Dart-Realtime) | Realtime voice AI example for Flutter |
| [ReactNative-Realtime](https://github.com/wiroai/ReactNative-Realtime) | Realtime voice AI example for React Native |
| [Wiro-Docs](https://github.com/wiroai/Wiro-Docs) | Source of the Wiro AI API docs |

[Website](https://wiro.ai) · [Models](https://wiro.ai/models) · [Docs](https://wiro.ai/docs) · [X](https://x.com/wiroai)

---

## License

[MIT](LICENSE.md)
