/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Loader2, Play, Download, Volume2, Zap, ChevronRight } from "lucide-react";

type Lang = "zh" | "en";

const I18N = {
  zh: {
    sysTag: "文字转语音 // 神经网络合成 v2.1",
    title: "文字转语音app",
    subtitle: "> 使用 Microsoft Edge TTS 引擎将文字转为自然语音",
    inputLabel: "输入文本",
    inputPlaceholder: "> 在此输入文字...",
    chars: "字符",
    shortcut: "CMD+ENTER 生成",
    voiceLabel: "语音模型",
    stepLang: "语言",
    stepGender: "性别",
    stepVoice: "音色",
    langLabel: "语言",
    genderLabel: "性别",
    voiceSelectLabel: "音色",
    active: "当前",
    errEmpty: "ERR: 输入为空 — 请输入要合成的文字。",
    errFail: "合成失败 — 生成已中止",
    synthesizing: "合成中...",
    generate: "生成语音",
    outputLabel: "输出音频",
    download: "下载 MP3",
    sysStatus: "系统状态: 在线",
    ready: "就绪",
    langSwitch: "EN",
  },
  en: {
    sysTag: "EDGE_TTS // NEURAL_SYNTH v2.1",
    title: "EDGE TTS",
    subtitle: "> Convert text to neural speech // Microsoft Edge TTS engine",
    inputLabel: "INPUT_TEXT",
    inputPlaceholder: "> enter text here...",
    chars: "CHARS",
    shortcut: "CMD+ENTER TO GENERATE",
    voiceLabel: "VOICE_MODEL",
    stepLang: "LANG",
    stepGender: "GENDER",
    stepVoice: "VOICE",
    langLabel: "LANG",
    genderLabel: "GENDER",
    voiceSelectLabel: "VOICE",
    active: "ACTIVE",
    errEmpty: "ERR: INPUT_EMPTY — Enter text to synthesize.",
    errFail: "SYNTH_FAIL — Generation aborted",
    synthesizing: "SYNTHESIZING...",
    generate: "GENERATE",
    outputLabel: "OUTPUT_STREAM",
    download: "DOWNLOAD_MP3",
    sysStatus: "SYS_STATUS: ONLINE",
    ready: "READY",
    langSwitch: "中",
  },
} as const;

const LOCALE_NAMES: Record<string, string> = {
  "af-ZA": "Afrikaans", "sq-AL": "Shqip", "am-ET": "አማርኛ",
  "ar-DZ": "العربية (الجزائر)", "ar-BH": "العربية (البحرين)", "ar-EG": "العربية (مصر)",
  "ar-IQ": "العربية (العراق)", "ar-JO": "العربية (الأردن)", "ar-KW": "العربية (الكويت)",
  "ar-LB": "العربية (لبنان)", "ar-LY": "العربية (ليبيا)", "ar-MA": "العربية (المغرب)",
  "ar-OM": "العربية (عُمان)", "ar-QA": "العربية (قطر)", "ar-SA": "العربية (السعودية)",
  "ar-SY": "العربية (سوريا)", "ar-TN": "العربية (تونس)", "ar-AE": "العربية (الإمارات)",
  "ar-YE": "العربية (اليمن)", "az-AZ": "Azərbaycan", "bn-BD": "বাংলা (বাংলাদেশ)",
  "bn-IN": "বাংলা (ভারত)", "bs-BA": "Bosanski", "bg-BG": "Български",
  "my-MM": "မြန်မာ", "ca-ES": "Català", "zh-HK": "粤语 (香港)",
  "zh-CN": "中文 (普通话)", "zh-TW": "中文 (台灣)", "hr-HR": "Hrvatski",
  "cs-CZ": "Čeština", "da-DK": "Dansk", "nl-BE": "Nederlands (België)",
  "nl-NL": "Nederlands", "en-AU": "English (AU)", "en-CA": "English (CA)",
  "en-HK": "English (HK)", "en-IN": "English (IN)", "en-IE": "English (IE)",
  "en-KE": "English (KE)", "en-NZ": "English (NZ)", "en-NG": "English (NG)",
  "en-PH": "English (PH)", "en-SG": "English (SG)", "en-ZA": "English (ZA)",
  "en-TZ": "English (TZ)", "en-GB": "English (UK)", "en-US": "English (US)",
  "et-EE": "Eesti", "fil-PH": "Filipino", "fi-FI": "Suomi",
  "fr-BE": "Français (Belgique)", "fr-CA": "Français (Canada)", "fr-FR": "Français",
  "fr-CH": "Français (Suisse)", "gl-ES": "Galego", "ka-GE": "ქართული",
  "de-AT": "Deutsch (Österreich)", "de-DE": "Deutsch", "de-CH": "Deutsch (Schweiz)",
  "el-GR": "Ελληνικά", "gu-IN": "ગુજરાતી", "he-IL": "עברית",
  "hi-IN": "हिन्दी", "hu-HU": "Magyar", "is-IS": "Íslenska",
  "id-ID": "Bahasa Indonesia", "ga-IE": "Gaeilge", "it-IT": "Italiano",
  "ja-JP": "日本語", "jv-ID": "Basa Jawa", "kn-IN": "ಕನ್ನಡ",
  "kk-KZ": "Қазақ", "km-KH": "ភាសាខ្មែរ", "ko-KR": "한국어",
  "lo-LA": "ລາວ", "lv-LV": "Latviešu", "lt-LT": "Lietuvių",
  "mk-MK": "Македонски", "ms-MY": "Bahasa Melayu", "ml-IN": "മലയാളം",
  "mt-MT": "Malti", "mr-IN": "मराठी", "mn-MN": "Монгол",
  "ne-NP": "नेपाली", "nb-NO": "Norsk Bokmål", "ps-AF": "پښتو",
  "fa-IR": "فارسی", "pl-PL": "Polski", "pt-BR": "Português (Brasil)",
  "pt-PT": "Português", "ro-RO": "Română", "ru-RU": "Русский",
  "sr-RS": "Srpski", "si-LK": "සිංහල", "sk-SK": "Slovenčina",
  "sl-SI": "Slovenščina", "so-SO": "Soomaali", "es-AR": "Español (Argentina)",
  "es-BO": "Español (Bolivia)", "es-CL": "Español (Chile)", "es-CO": "Español (Colombia)",
  "es-CR": "Español (Costa Rica)", "es-CU": "Español (Cuba)", "es-DO": "Español (Rep. Dom.)",
  "es-EC": "Español (Ecuador)", "es-SV": "Español (El Salvador)", "es-GQ": "Español (Guinea Ec.)",
  "es-GT": "Español (Guatemala)", "es-HN": "Español (Honduras)", "es-MX": "Español (México)",
  "es-NI": "Español (Nicaragua)", "es-PA": "Español (Panamá)", "es-PY": "Español (Paraguay)",
  "es-PE": "Español (Perú)", "es-PR": "Español (Puerto Rico)", "es-ES": "Español",
  "es-UY": "Español (Uruguay)", "es-US": "Español (US)", "es-VE": "Español (Venezuela)",
  "su-ID": "Basa Sunda", "sw-KE": "Kiswahili (Kenya)", "sw-TZ": "Kiswahili (Tanzania)",
  "sv-SE": "Svenska", "ta-IN": "தமிழ் (India)", "ta-MY": "தமிழ் (Malaysia)",
  "ta-SG": "தமிழ் (Singapore)", "ta-LK": "தமிழ் (Sri Lanka)", "te-IN": "తెలుగు",
  "th-TH": "ไทย", "tr-TR": "Türkçe", "uk-UA": "Українська",
  "ur-IN": "اردو (بھارت)", "ur-PK": "اردو (پاکستان)", "uz-UZ": "Oʻzbek",
  "vi-VN": "Tiếng Việt", "cy-GB": "Cymraeg", "zu-ZA": "isiZulu",
};

function getLocaleName(locale: string): string {
  return LOCALE_NAMES[locale] || locale;
}

function getVoiceName(friendlyName: string): string {
  const match = friendlyName.match(/Microsoft (.+?) Online/);
  return match ? match[1] : friendlyName;
}

const GENDER_LABELS: Record<string, string> = { Male: "男", Female: "女" };

export default function App() {
  const [lang, setLang] = useState<Lang>("zh");
  const t = I18N[lang];
  const toggleLang = useCallback(() => setLang((l) => (l === "zh" ? "en" : "zh")), []);

  const [text, setText] = useState("");
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedLocale, setSelectedLocale] = useState("en-US");
  const [selectedGender, setSelectedGender] = useState("Male");
  const [selectedVoice, setSelectedVoice] = useState("en-US-ChristopherNeural");
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Derived filter data
  const locales = useMemo(() => {
    const set = new Set<string>(voices.map((v) => v.Locale));
    return [...set].sort((a, b) => getLocaleName(a).localeCompare(getLocaleName(b)));
  }, [voices]);

  const genders = useMemo(() => {
    const set = new Set<string>(
      voices.filter((v) => v.Locale === selectedLocale).map((v) => v.Gender)
    );
    return [...set].sort();
  }, [voices, selectedLocale]);

  const filteredVoices = useMemo(() => {
    return voices.filter(
      (v) => v.Locale === selectedLocale && v.Gender === selectedGender
    );
  }, [voices, selectedLocale, selectedGender]);

  // Cascade resets
  useEffect(() => {
    if (genders.length > 0 && !genders.includes(selectedGender)) {
      setSelectedGender(genders[0]);
    }
  }, [genders]);

  useEffect(() => {
    if (filteredVoices.length > 0 && !filteredVoices.find((v) => v.ShortName === selectedVoice)) {
      setSelectedVoice(filteredVoices[0].ShortName);
    }
  }, [filteredVoices]);

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
      setError(t.errEmpty);
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
        throw new Error(errData.error || t.errFail);
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-[#ffe600]" strokeWidth={3} />
              <span
                className="text-[10px] tracking-[0.4em] uppercase text-[#ffe600]/50"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {t.sysTag}
              </span>
            </div>
            <button
              onClick={toggleLang}
              className="px-3 py-1.5 border-[2px] border-[#ffe600]/50 text-[#ffe600] text-[11px] font-bold tracking-[0.2em] uppercase
                hover:bg-[#ffe600] hover:text-[#000] transition-all duration-150 cursor-pointer"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t.langSwitch}
            </button>
          </div>
          <h1
            className="glitch-title flicker text-4xl md:text-5xl font-black tracking-tight text-[#ffe600] leading-none"
            style={{ fontFamily: lang === "en" ? "var(--font-display)" : "var(--font-mono)" }}
            data-text={t.title}
          >
            {t.title}
          </h1>
          <p
            className="mt-3 text-[13px] text-[#ffe600]/40 tracking-wide"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t.subtitle}
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
              {t.inputLabel}
            </label>
            <textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.inputPlaceholder}
              className="w-full h-36 p-4 text-[14px] leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleGenerate();
                }
              }}
            />
            <div className="flex justify-between text-[10px] text-[#ffe600]/30 tracking-wider">
              <span>{text.length} {t.chars}</span>
              <span>{t.shortcut}</span>
            </div>
          </div>

          {/* SECTION: VOICE PIPELINE */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.3em] uppercase text-[#fff]">
              <span className="inline-block w-2 h-2 bg-[#ffe600]" />
              {t.voiceLabel}
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-1 text-[10px] tracking-[0.2em] text-[#ffe600]/40 select-none">
              <span className={selectedLocale ? "text-[#ffe600]" : ""}>{t.stepLang}</span>
              <ChevronRight className="w-3 h-3" />
              <span className={selectedGender ? "text-[#ffe600]" : ""}>{t.stepGender}</span>
              <ChevronRight className="w-3 h-3" />
              <span className={selectedVoice ? "text-[#ffe600]" : ""}>{t.stepVoice}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. LOCALE */}
              <div className="space-y-1">
                <label htmlFor="locale-select" className="block text-[10px] tracking-[0.2em] uppercase text-[#ffe600]/50">
                  {t.langLabel} [{locales.length}]
                </label>
                <select
                  id="locale-select"
                  value={selectedLocale}
                  onChange={(e) => setSelectedLocale(e.target.value)}
                  className="w-full p-3 text-[13px] cursor-pointer"
                >
                  {locales.map((locale) => (
                    <option key={locale} value={locale}>
                      {getLocaleName(locale)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. GENDER */}
              <div className="space-y-1">
                <label htmlFor="gender-select" className="block text-[10px] tracking-[0.2em] uppercase text-[#ffe600]/50">
                  {t.genderLabel} [{genders.length}]
                </label>
                <select
                  id="gender-select"
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full p-3 text-[13px] cursor-pointer"
                >
                  {genders.map((g) => (
                    <option key={g} value={g}>
                      {GENDER_LABELS[g] || g} / {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. VOICE */}
              <div className="space-y-1">
                <label htmlFor="voice-select" className="block text-[10px] tracking-[0.2em] uppercase text-[#ffe600]/50">
                  {t.voiceSelectLabel} [{filteredVoices.length}]
                </label>
                <select
                  id="voice-select"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full p-3 text-[13px] cursor-pointer"
                >
                  {filteredVoices.map((v) => (
                    <option key={v.ShortName} value={v.ShortName}>
                      {getVoiceName(v.FriendlyName)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active voice tag */}
            {selectedVoice && (
              <div className="text-[10px] tracking-[0.15em] text-[#ffe600]/30 pt-1">
                {'>'} {t.active}: {selectedVoice}
              </div>
            )}
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
                {t.synthesizing}
              </>
            ) : (
              <>
                <Play className="w-5 h-5" fill="currentColor" />
                {t.generate}
              </>
            )}
          </button>

          {/* AUDIO RESULT */}
          {audioUrl && (
            <div className="border-t-[3px] border-[#ffe600]/30 pt-6 space-y-4">
              <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.3em] uppercase text-[#fff]">
                <Volume2 className="w-4 h-4 text-[#ffe600]" />
                {t.outputLabel}
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
                  {t.download}
                </a>
              </div>
            </div>
          )}
        </main>

        {/* ── FOOTER ── */}
        <footer className="mt-6 flex justify-between items-center text-[10px] text-[#ffe600]/20 tracking-[0.3em] uppercase">
          <span>{t.sysStatus}</span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-[#ffe600] animate-pulse" />
            {t.ready}
          </span>
        </footer>
      </div>
    </div>
  );
}
