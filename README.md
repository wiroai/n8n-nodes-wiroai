![Wiro Logo](wiro.svg)

# n8n-nodes-wiroai

This is an [n8n](https://n8n.io) community node that lets you access [Wiro AI](https://wiro.ai)’s generative AI tools directly in your workflows.

## ✨ Features

- 🗣️ Text-to-Speech

Each feature is implemented as a **separate node** for simplicity and clarity.

---

## 📦 Installation

Follow the [n8n community nodes guide](https://docs.n8n.io/integrations/community-nodes/installation/) to install this package.

```bash
npm install n8n-nodes-wiroai
```

---

## 🛠 Operations

| Node                | Description                                           |
| ------------------- | ----------------------------------------------------- |
| `GenerateSpeechTTS` | Converts text into spoken audio using Wiro’s TTS API. |

---

## 🔐 Credentials

You need a Wiro API Key and Secret.

**Steps:**

1. Visit [wiro.ai](https://wiro.ai), create a project.
2. Copy your API credentials.
3. In n8n, go to **Credentials** → Add new → **Wiro API**.
4. Enter your key and secret.

---

## 🚀 Usage Example

1. Add `Generate Speech` node.
2. Fill in:
   - Prompt: `Hello world!`
   - Voice: `af_heart`
   - Language: `a` (American English)
3. Run the workflow.

**Result:**

```json
{
	"taskid": "abc123",
	"status": "completed",
	"url": "https://cdn1.wiro.ai/xyz/0.mp3"
}
```

---

## 🧠 Compatibility

- Requires: n8n `v1.0+`
- Node.js: `v18+`

---

## 📁 Folder Structure

```
nodes/WiroAI/
├── GenerateSpeechTTS.node.ts
├── GenerateSpeechTTS.node.json
├── utils/
│   ├── auth.ts
│   └── polling.ts
credentials/
└── WiroApi.credentials.ts
```

---

## 📚 Resources

- [Wiro API Docs](https://wiro.ai/docs)
- [Wiro GenerateSpeechTTS API Docs](https://wiro.ai/tools/wiro/kokoro_tts#apisamples-curl)
- [n8n Custom Node Docs](https://docs.n8n.io/integrations/creating-nodes/)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

---

## 📜 License

[MIT](LICENSE.md)
