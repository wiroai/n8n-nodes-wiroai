<img src="http://wiro.ai/images/logos/logo/logo.png" alt="Wiro Logo" width="200"/>

# n8n-nodes-wiroai

A [n8n](https://n8n.io) community node pack that gives you access to [Wiro AI](https://wiro.ai)’s powerful generative tools directly in your workflows.

<img src="https://wiro.ai/images/illustrations/koala-404.png" alt="Wiro Koala" width="50"/>

---

## ✨ Features

- 🗣️ Text-to-Speech
- 🎵 Background Music Generator
- 🧠 Chatbot (with and without RAG)
- 🖼️ Text-to-Image
- 🎞️ Text-to-Video
- 🧼 Remove Background
- 🛋️ Interior Design Reimagining
- 🎥 Image-to-Video (KlingAI)
- 📄 OCR (Text from Image)
- 📈 Resume/CV Evaluator with Job Description
- 🖌️ Image Restoration and Upscaling
- 📱 4K Mobile Wallpaper Generator
- 🎬 Shorts / Reels Generator
- 📹 Add Background Music to Video
- 🌀 Flux Kontext Pro / Max image stylizers

Each tool is implemented as a **separate node** for modular and easy use.

---

## 📦 Installation

Follow the [n8n community nodes guide](https://docs.n8n.io/integrations/community-nodes/installation/) to install this package.

```bash
npm install n8n-nodes-wiroai
```

---

## 🛠 Operations

| Node                        | Description                                        |
| --------------------------- | -------------------------------------------------- |
| `AskAiChatbot`              | General-purpose chat assistant powered by LLMs     |
| `CvEvaluatorJobdesc`        | Evaluate resumes/CVs against job descriptions      |
| `EasyOcr`                   | Extract text from images using OCR                 |
| `FluxKontextPro`            | Apply stylized prompts to input images             |
| `FluxKontextMax`            | Clean and enhance product-style visuals            |
| `GenerateBackgroundMusic`   | Generate background audio from prompts             |
| `GenerateSpeechTTS`         | Convert text to audio using speech synthesis       |
| `ImageToVideoKling16`       | Animate image pairs into video using KlingAI       |
| `InteriorDesignGenerator`   | Reimagine interior spaces with descriptive prompts |
| `MobileWallpaperGenerator`  | Generate 4K mobile phone wallpapers                |
| `RagChatYoutube`            | Ask questions to YouTube videos using RAG + LLM    |
| `RemoveImageBackground`     | Strip background from uploaded images              |
| `RestoreUpscaleImage`       | Restore and upscale low-quality images             |
| `ShortsReelsVideoGenerator` | Generate vertical videos for Shorts/Reels          |
| `TextToImage`               | Convert descriptive text to images                 |
| `TextToVideoKling16`        | Convert text to video using KlingAI engine         |
| `TextToVideoWan21`          | Generate video from text via WAN2.1                |
| `VideoBgMusicGenerator`     | Automatically compose music for your videos        |

---

## 🔐 Credentials

You’ll need a Wiro API Key and Secret.

**Steps:**

1. Go to [wiro.ai](https://wiro.ai) and sign up
2. [wiro.ai/panel/project/](https://wiro.ai/panel/project/) Create a project and get your API credentials
3. In n8n → Credentials → Add new → **Wiro API**
4. Enter your key and secret values

---

## 🚀 Usage Example

To use the Text-to-Speech node:

1. Add the `Generate Speech` node
2. Set:
   - Prompt: `Hello world!`
   - Voice: `af_heart`
   - Language: `a` (American English)
3. Run the workflow

**Output:**

```json
{
	"taskid": "abc123",
	"status": "completed",
	"url": "https://cdn1.wiro.ai/xyz/0.mp3"
}
```

---

## 🧠 Compatibility

- Requires: `n8n v1.0+`
- Node.js: `v18+`

---

## 📁 Folder Structure

```
nodes/WiroAI/
├── AskAiChatbot/
    ├── AskAiChatbot.nodes.ts
    └── AskAiChatbot.nodes.json
├── CvEvaluatorJobdesc/
    ├── CvEvaluatorJobdesc.nodes.ts
    └── CvEvaluatorJobdesc.nodes.json
├── EasyOcr/
    ├── EasyOcr.nodes.ts
    └── EasyOcr.nodes.json
├── FluxKontextMax/
    ├── FluxKontextMax.nodes.ts
    └── FluxKontextMax.nodes.json
├── FluxKontextPro/
    ├── FluxKontextPro.nodes.ts
    └── FluxKontextPro.nodes.json
├── GenerateBackgroundMusic/
    ├── GenerateBackgroundMusic.nodes.ts
    └── GenerateBackgroundMusic.nodes.json
├── GenerateSpeechTTS/
    ├── GenerateSpeechTTS.nodes.ts
    └── GenerateSpeechTTS.nodes.json
├── ImageToVideoKling16/
    ├── ImageToVideoKling16.nodes.ts
    └── ImageToVideoKling16.nodes.json
├── InteriorDesignGenerator/
    ├── InteriorDesignGenerator.nodes.ts
    └── InteriorDesignGenerator.nodes.json
├── MobileWallpaperGenerator/
    ├── MobileWallpaperGenerator.nodes.ts
    └── MobileWallpaperGenerator.nodes.json
├── RagChatYoutube/
    ├── RagChatYoutube.nodes.ts
    └── RagChatYoutube.nodes.json
├── RemoveImageBackground/
    ├── RemoveImageBackground.nodes.ts
    └── RemoveImageBackground.nodes.json
├── RestoreUpscaleImage/
    ├── RestoreUpscaleImage.nodes.ts
    └── RestoreUpscaleImage.nodes.json
├── ShortsReelsVideoGenerator/
    ├── ShortsReelsVideoGenerator.nodes.ts
    └── ShortsReelsVideoGenerator.nodes.json
├── TextToImage/
    ├── TextToImage.nodes.ts
    └── TextToImage.nodes.json
├── TextToVideoKling16/
    ├── TextToVideoKling16.nodes.ts
    └── TextToVideoKling16.nodes.json
├── TextToVideoWan21/
    ├── TextToVideoWan21.nodes.ts
    └── TextToVideoWan21.nodes.json
├── VideoBgMusicGenerator/
    ├── VideoBgMusicGenerator.nodes.ts
    └── VideoBgMusicGenerator.nodes.json
└── utils/
    ├── auth.ts
    └── polling.ts
credentials/
└── WiroApi.credentials.ts
```

---

## 📚 Resources

- [Wiro API Docs](https://wiro.ai/docs)
- [n8n Custom Node Docs](https://docs.n8n.io/integrations/creating-nodes/)
- [Community Node Guide](https://docs.n8n.io/integrations/community-nodes/)

---

## 📜 License

[MIT](LICENSE.md)
