import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Communicate } from "edge-tts-universal";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text, voice } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const tts = new Communicate(text, { voice: voice || "en-US-ChristopherNeural" });

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");

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
}
