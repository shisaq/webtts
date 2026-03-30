import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Communicate, listVoices } from "edge-tts-universal";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const tts = new Communicate(text, { voice: voice || "en-US-ChristopherNeural" });
      
      res.set({
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
      });

      for await (const chunk of tts.stream()) {
        if (chunk.type === "audio") {
          res.write(chunk.data);
        }
      }
      
      res.end();
    } catch (error: any) {
      console.error("TTS Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Internal Server Error" });
      } else {
        res.end();
      }
    }
  });

  app.get("/api/voices", async (req, res) => {
    try {
      const voices = await listVoices();
      res.json(voices);
    } catch (error: any) {
      console.error("Voices Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
