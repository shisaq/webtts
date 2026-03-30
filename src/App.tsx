/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { Loader2, Play, Download } from "lucide-react";

export default function App() {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("en-US-ChristopherNeural");
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Fetch available voices
    fetch("/api/voices")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setVoices(data);
        }
      })
      .catch((err) => console.error("Failed to fetch voices", err));
  }, []);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError("Please enter some text.");
      return;
    }

    setIsLoading(true);
    setError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voice: selectedVoice,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate audio");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // Auto-play
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8 font-sans text-neutral-900">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Edge TTS Generator
          </h1>
          <p className="text-neutral-500">
            Convert text to natural-sounding speech using Microsoft Edge TTS.
          </p>
        </header>

        <main className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-6">
          <div className="space-y-2">
            <label htmlFor="text-input" className="block text-sm font-medium">
              Input Text
            </label>
            <textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text here... (e.g. Hello, world!)"
              className="w-full h-32 p-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="voice-select" className="block text-sm font-medium">
              Voice
            </label>
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              {voices.length > 0 ? (
                voices.map((v) => (
                  <option key={v.ShortName} value={v.ShortName}>
                    {v.FriendlyName} ({v.Locale})
                  </option>
                ))
              ) : (
                <option value="en-US-ChristopherNeural">
                  Microsoft Christopher Online (Natural) - English (United States)
                </option>
              )}
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isLoading || !text.trim()}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Audio...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Generate Speech
              </>
            )}
          </button>

          {audioUrl && (
            <div className="pt-6 border-t border-neutral-100 space-y-4">
              <h3 className="text-sm font-medium text-neutral-700">Result</h3>
              <audio
                ref={audioRef}
                src={audioUrl}
                controls
                className="w-full"
              />
              <div className="flex justify-end">
                <a
                  href={audioUrl}
                  download="speech.mp3"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download MP3
                </a>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
