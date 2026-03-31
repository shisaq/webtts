import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listVoices } from "edge-tts-universal";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const voices = await listVoices();
    res.setHeader("Cache-Control", "public, s-maxage=86400");
    res.json(voices);
  } catch (error: any) {
    console.error("Voices Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
