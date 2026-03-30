/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { Loader2, Play, Download, Volume2, Zap } from "lucide-react";

export default function App() {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("en-US-ChristopherNeural");
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
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
      setError("ERR: INPUT_EMPTY — Enter text to synthesize.");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: selectedVoice }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "SYNTH_FAIL — Generation aborted");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

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
    <div className="scanlines noise-bg min-h-screen bg-[#000] p-4 md:p-8">
      <div className="max-w-3xl mx-auto stagger-in" style={{ fontFamily: "var(--font-mono)" }}>

        {/* ── HEADER ── */}
        <header className="mb-8 border-b-[3px] border-[#ffe600] pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-6 h-6 text-[#ffe600]" strokeWidth={3} />
            <span
              className="text-[10px] tracking-[0.4em] uppercase text-[#ffe600]/50"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              EDGE_TTS // NEURAL_SYNTH v2.1
            </span>
          </div>
          <h1
            className="glitch-title flicker text-4xl md:text-5xl font-black tracking-tight text-[#ffe600] leading-none"
            style={{ fontFamily: "var(--font-display)" }}
            data-text="EDGE TTS"
          >
            EDGE TTS
          </h1>
          <p
            className="mt-3 text-[13px] text-[#ffe600]/40 tracking-wide"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {'>'} Convert text to neural speech // Microsoft Edge TTS engine
          </p>
        </header>

        {/* ── MAIN PANEL ── */}
        <main className="corner-deco pulse-border border-[4px] border-[#ffe600] bg-[#000] p-6 md:p-8 space-y-6">

          {/* SECTION: TEXT INPUT */}
          <div className="space-y-2">
            <label
              htmlFor="text-input"
              className="flex items-center gap-2 text-[11px] font-bold tracking-[0.3em] uppercase text-[#fff]"
            >
              <span className="inline-block w-2 h-2 bg-[#ffe600]" />
              INPUT_TEXT
            </label>
            <textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="> enter text here..."
              className="w-full h-36 p-4 text-[14px] leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleGenerate();
                }
              }}
            />
            <div className="flex justify-between text-[10px] text-[#ffe600]/30 tracking-wider">
              <span>{text.length} CHARS</span>
              <span>CMD+ENTER TO GENERATE</span>
            </div>
          </div>

          {/* SECTION: VOICE SELECT */}
          <div className="space-y-2">
            <label
              htmlFor="voice-select"
              className="flex items-center gap-2 text-[11px] font-bold tracking-[0.3em] uppercase text-[#fff]"
            >
              <span className="inline-block w-2 h-2 bg-[#ffe600]" />
              VOICE_MODEL
            </label>
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-3 text-[13px] cursor-pointer"
            >
              {voices.length > 0 ? (
                voices.map((v) => (
                  <option key={v.ShortName} value={v.ShortName}>
                    [{v.Locale}] {v.FriendlyName}
                  </option>
                ))
              ) : (
                <option value="en-US-ChristopherNeural">
                  [en-US] Microsoft Christopher Online (Natural)
                </option>
              )}
            </select>
          </div>

          {/* ERROR */}
          {error && (
            <div className="border-[3px] border-[#ff0040] bg-[#ff0040]/10 p-3 text-[#ff0040] text-[12px] tracking-wider">
              <span className="font-bold">! </span>{error}
            </div>
          )}

          {/* GENERATE BUTTON */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || !text.trim()}
            className="group relative w-full py-4 px-6 bg-[#ffe600] text-[#000] font-black text-[14px] tracking-[0.2em] uppercase
              border-[3px] border-[#ffe600]
              hover:bg-[#000] hover:text-[#ffe600]
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all duration-150
              flex items-center justify-center gap-3
              cursor-pointer"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                SYNTHESIZING...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" fill="currentColor" />
                GENERATE
              </>
            )}
          </button>

          {/* AUDIO RESULT */}
          {audioUrl && (
            <div className="border-t-[3px] border-[#ffe600]/30 pt-6 space-y-4">
              <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.3em] uppercase text-[#fff]">
                <Volume2 className="w-4 h-4 text-[#ffe600]" />
                OUTPUT_STREAM
              </div>
              <div className="border-[3px] border-[#ffe600]/40 p-3">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  controls
                  className="w-full"
                />
              </div>
              <div className="flex justify-end">
                <a
                  href={audioUrl}
                  download="speech.mp3"
                  className="flex items-center gap-2 text-[12px] tracking-[0.2em] uppercase text-[#ffe600] border-b-[2px] border-[#ffe600]/40 pb-1
                    hover:border-[#ffe600] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  DOWNLOAD_MP3
                </a>
              </div>
            </div>
          )}
        </main>

        {/* ── FOOTER ── */}
        <footer className="mt-6 flex justify-between items-center text-[10px] text-[#ffe600]/20 tracking-[0.3em] uppercase">
          <span>SYS_STATUS: ONLINE</span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-[#ffe600] animate-pulse" />
            READY
          </span>
        </footer>
      </div>
    </div>
  );
}
