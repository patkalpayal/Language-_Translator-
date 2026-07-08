import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Languages, 
  ArrowLeftRight, 
  Copy, 
  Check, 
  History, 
  Terminal, 
  Cloud, 
  Code, 
  Sun, 
  Moon, 
  Sparkles, 
  Trash2, 
  CheckCircle, 
  ExternalLink,
  BookOpen,
  Download,
  Info
} from "lucide-react";
import { SUPPORTED_LANGUAGES, Language } from "./languages";

// Define interface for history items
interface HistoryItem {
  id: string;
  src: string;
  tgt: string;
  original: string;
  translation: string;
  time: string;
}

export default function App() {
  // Tabs: 'simulator', 'code', 'guide'
  const [activeTab, setActiveTab] = useState<"simulator" | "code" | "guide">("simulator");
  
  // Simulator states
  const [sourceLang, setSourceLang] = useState<string>("English");
  const [targetLang, setTargetLang] = useState<string>("Spanish");
  const [inputText, setInputText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Streamlit default dark
  const [recentExpander, setRecentExpander] = useState<string | null>(null);

  // Code Explorer states
  const [selectedFile, setSelectedFile] = useState<string>("app.py");
  const [copiedFileCode, setCopiedFileCode] = useState<boolean>(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("translator_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  }, []);

  // Save history helper
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("translator_history", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save history:", e);
    }
  };

  // Perform translation
  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setErrorMsg("Please enter some text to translate!");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setTranslatedText("");

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          source: sourceLang,
          target: targetLang
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An error occurred during translation.");
      }

      const translated = data.translation;
      setTranslatedText(translated);

      // Add to history
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        src: sourceLang,
        tgt: targetLang,
        original: inputText,
        translation: translated,
        time: timeStr
      };

      const updatedHistory = [newItem, ...history].slice(0, 10);
      saveHistory(updatedHistory);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to connect to translation server. Make sure you are online.");
    } finally {
      setIsLoading(false);
    }
  };

  // Swap source and target languages
  const handleSwap = () => {
    const prevSrc = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(prevSrc);
    // If there is existing translated text, swap the texts too!
    if (translatedText) {
      setInputText(translatedText);
      setTranslatedText(inputText);
    }
  };

  // Clear translation logs
  const handleClearHistory = () => {
    saveHistory([]);
    setRecentExpander(null);
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, setCopiedState: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  // Source files mapping
  const sourceFiles: Record<string, { label: string; lang: string; content: string }> = {
    "app.py": {
      label: "app.py (Streamlit Code)",
      lang: "python",
      content: `# ==============================================================================
# AI Language Translator - Streamlit Application
# Built for: Internship Project
# Language: Python 3.8+
# Framework: Streamlit
# Library: deep-translator (completely free, no API keys required!)
# ==============================================================================

import streamlit as st
from deep_translator import GoogleTranslator
import time

# Set up page configurations
st.set_page_config(
    page_title="AI Language Translator",
    page_icon="🔮",
    layout="centered",
    initial_sidebar_state="expanded"
)

# Custom CSS styling to elevate the UI and give it a premium, modern feel
st.markdown("""
<style>
    .title-text {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        font-weight: 800;
        text-align: center;
        background: linear-gradient(90deg, #FF4B4B, #FF8F8F);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 5px;
    }
    .subtitle-text {
        text-align: center;
        color: #888888;
        font-size: 1.1rem;
        margin-bottom: 25px;
    }
    .stTextArea textarea {
        font-size: 16px !important;
    }
    .translation-box {
        padding: 20px;
        border-radius: 10px;
        background-color: rgba(255, 75, 75, 0.05);
        border: 1px solid rgba(255, 75, 75, 0.2);
        font-size: 16px;
        min-height: 150px;
        white-space: pre-wrap;
        margin-top: 10px;
        margin-bottom: 20px;
    }
</style>
""", unsafe_allow_html=True)

# Load supported languages
@st.cache_data
def load_languages():
    try:
        langs = GoogleTranslator().get_supported_languages(as_dict=True)
        return {k.title(): v for k, v in sorted(langs.items())}
    except Exception:
        # High-quality fallback of common languages
        return {
            "English": "en", "Spanish": "es", "French": "fr", "German": "de", 
            "Italian": "it", "Portuguese": "pt", "Russian": "ru", "Chinese (Simplified)": "zh-CN",
            "Japanese": "ja", "Hindi": "hi", "Arabic": "ar", "Korean": "ko"
        }

languages_dict = load_languages()
language_list = list(languages_dict.keys())

# Initialize session states
if "history" not in st.session_state:
    st.session_state.history = []
if "source_lang" not in st.session_state:
    st.session_state.source_lang = "English"
if "target_lang" not in st.session_state:
    st.session_state.target_lang = "Spanish"
if "input_text" not in st.session_state:
    st.session_state.input_text = ""
if "translated_text" not in st.session_state:
    st.session_state.translated_text = ""

# Sidebar Panel: History and Project Information
with st.sidebar:
    st.markdown("### 📜 Translation History")
    if not st.session_state.history:
        st.info("No translations yet! Start translating to see history.")
    else:
        for idx, item in enumerate(reversed(st.session_state.history)):
            with st.expander(f"{item['src']} ➡️ {item['tgt']} ({item['time']})"):
                st.markdown(f"**Original:**\\n*{item['original']}*")
                st.markdown(f"**Translation:**\\n*{item['translation']}*")
                if st.button("🔄 Reuse Text", key=f"reuse_{idx}"):
                    st.session_state.input_text = item['original']
                    st.rerun()
        if st.button("🧹 Clear All History", use_container_width=True):
            st.session_state.history = []
            st.rerun()

# Header Layout
st.markdown("<h1 class='title-text'>🔮 AI Language Translator</h1>", unsafe_allow_html=True)
st.markdown("<p class='subtitle-text'>Translate your text instantly and completely for free!</p>", unsafe_allow_html=True)

# Selectors
col_src, col_btn, col_tgt = st.columns([4, 1, 4])
with col_src:
    src_idx = language_list.index(st.session_state.source_lang) if st.session_state.source_lang in language_list else 0
    st.session_state.source_lang = st.selectbox("Source Language 🌐", options=language_list, index=src_idx)
with col_btn:
    st.write("")
    st.write("")
    if st.button("⇆"):
        st.session_state.source_lang, st.session_state.target_lang = st.session_state.target_lang, st.session_state.source_lang
        st.rerun()
with col_tgt:
    tgt_idx = language_list.index(st.session_state.target_lang) if st.session_state.target_lang in language_list else 1
    st.session_state.target_lang = st.selectbox("Target Language 🎯", options=language_list, index=tgt_idx)

# Text area
input_val = st.text_area("Enter text to translate:", value=st.session_state.input_text, height=160)
st.session_state.input_text = input_val
st.caption(f"Characters: {len(input_val)} | Words: {len(input_val.split()) if input_val else 0}")

# Translate Action
if st.button("🚀 Translate Now", type="primary", use_container_width=True):
    if not input_val.strip():
        st.warning("⚠️ Please write some text first!")
    else:
        with st.spinner("🔮 Translating..."):
            try:
                src_code = languages_dict[st.session_state.source_lang]
                tgt_code = languages_dict[st.session_state.target_lang]
                
                translator = GoogleTranslator(source=src_code, target=tgt_code)
                translation_result = translator.translate(input_val)
                st.session_state.translated_text = translation_result
                
                st.session_state.history.append({
                    "src": st.session_state.source_lang,
                    "tgt": st.session_state.target_lang,
                    "original": input_val,
                    "translation": translation_result,
                    "time": time.strftime("%H:%M:%S")
                })
                st.rerun()
            except Exception as e:
                st.error(f"❌ Translation failed! {e}")

# Results Display
if st.session_state.translated_text:
    st.write("---")
    st.markdown("### 🎉 Translated Output:")
    st.markdown(f"<div class='translation-box'>{st.session_state.translated_text}</div>", unsafe_allow_html=True)
    st.text_area("👇 Click the icon in the top-right to Copy:", value=st.session_state.translated_text, height=100, disabled=True)`
    },
    "requirements.txt": {
      label: "requirements.txt (Dependencies)",
      lang: "text",
      content: `streamlit>=1.30.0
deep-translator>=1.11.4
pandas>=2.0.0`
    },
    ".streamlit/config.toml": {
      label: ".streamlit/config.toml (Theming)",
      lang: "toml",
      content: `[theme]
primaryColor = "#FF4B4B"
backgroundColor = "#0E1117"
secondaryBackgroundColor = "#262730"
textColor = "#FAFAFA"
font = "sans serif"

[server]
port = 8501
enableCORS = false`
    },
    "README.md": {
      label: "README.md (Documentation)",
      lang: "markdown",
      content: `# 🔮 AI Language Translator

A complete, modern, and completely free **AI Language Translation Web Application** built using **Python** and **Streamlit**. It uses the \`deep-translator\` library (powered by the Google Translate engine) to support instant translations across 100+ global languages with absolutely no API keys or hidden costs!

This project was developed as an **Internship Project** to showcase Python Web Development, API Integration, and modern Responsive User Interface design.

---

## 🛠️ Local Installation & Setup

### Step 1: Install Python
Ensure you have **Python 3.8** or higher installed.

### Step 2: Navigate to Project Folder
\`\`\`bash
cd path/to/AI_Language_Translator
\`\`\`

### Step 3: Install Dependencies
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### Step 4: Run Application
\`\`\`bash
streamlit run app.py
\`\`\`

---

## ☁️ Deploying to Streamlit Community Cloud

1. Create a public repository on GitHub and push your files.
2. Sign in to [share.streamlit.io](https://share.streamlit.io) with GitHub.
3. Click "New app", select your repository, select branch \`main\`, main file \`app.py\`.
4. Click **Deploy!** Your app will be online in 1 minute.`
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDarkMode 
        ? "bg-[#0e1117] text-slate-100" 
        : "bg-[#F1F5F9] text-slate-900"
    } font-sans selection:bg-indigo-100 selection:text-indigo-900`}>
      
      {/* Top Navigation & Bento Header */}
      <div className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-6">
        <header className={`flex flex-col md:flex-row justify-between items-center p-4 md:px-6 rounded-2xl border transition-all duration-300 gap-4 ${
          isDarkMode 
            ? "bg-[#262730] border-slate-800 shadow-xl" 
            : "bg-white border-slate-200 shadow-sm"
        }`}>
          {/* Brand/Title block with Bento icon style */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 animate-pulse">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight flex items-center gap-2">
                Linguify AI
                <span className="bg-rose-500/10 text-rose-500 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-rose-500/20">
                  Internship Project
                </span>
              </h1>
              <p className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Python • Streamlit • v1.0
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <nav className={`flex p-1 rounded-xl border transition-all ${
              isDarkMode ? "bg-slate-900/50 border-slate-850" : "bg-slate-100 border-slate-200"
            }`}>
              <button
                id="tab-btn-simulator"
                onClick={() => setActiveTab("simulator")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                  activeTab === "simulator"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>🔮 Simulator</span>
              </button>
              <button
                id="tab-btn-code"
                onClick={() => setActiveTab("code")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                  activeTab === "code"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>📁 Code Explorer</span>
              </button>
              <button
                id="tab-btn-guide"
                onClick={() => setActiveTab("guide")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                  activeTab === "guide"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>🚀 Deploy Guide</span>
              </button>
            </nav>

            {/* Light/Dark Toggle */}
            <div className={`flex p-0.5 rounded-lg border ${
              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
            }`}>
              <button 
                onClick={() => setIsDarkMode(false)}
                className={`p-1.5 rounded-md transition-all ${
                  !isDarkMode ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-400"
                }`}
                title="Light Theme"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsDarkMode(true)}
                className={`p-1.5 rounded-md transition-all ${
                  isDarkMode ? "bg-[#262730] text-amber-400 shadow-sm" : "text-slate-400 hover:text-slate-500"
                }`}
                title="Dark Theme"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: STREAMLIT SIMULATOR (BENTO GRID DESIGN) */}
          {activeTab === "simulator" && (
            <motion.div
              key="simulator"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-12 gap-6"
            >
              
              {/* BENTO CARD 1: Major Translation Interface (Col Span: 8) */}
              <section className={`col-span-12 lg:col-span-8 bg-white rounded-3xl border shadow-sm p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden transition-all duration-300 ${
                isDarkMode 
                  ? "bg-[#0e1117] border-slate-800 text-[#fafafa] shadow-slate-950/20" 
                  : "bg-white border-slate-200 text-slate-850"
              }`}>
                {/* Red Brand Bar on top matching Streamlit styling */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#FF4B4B]" />

                {/* Card Title Header with controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-700/10">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Source dropdown selector */}
                    <select
                      value={sourceLang}
                      onChange={(e) => setSourceLang(e.target.value)}
                      className={`appearance-none rounded-xl border px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
                        isDarkMode
                          ? "bg-[#262730] border-slate-700 text-white focus:border-indigo-500"
                          : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                      }`}
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.name}>
                          {lang.name}
                        </option>
                      ))}
                    </select>

                    {/* Swap button */}
                    <button
                      onClick={handleSwap}
                      className={`p-2 rounded-full border transition-all duration-200 hover:rotate-180 flex items-center justify-center ${
                        isDarkMode
                          ? "bg-[#262730] border-slate-700 text-[#FF4B4B] hover:bg-slate-800"
                          : "bg-slate-50 border-slate-200 text-[#FF4B4B] hover:bg-slate-100"
                      }`}
                      title="Swap Languages (⇆)"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Target dropdown selector */}
                    <select
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className={`appearance-none rounded-xl border px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
                        isDarkMode
                          ? "bg-[#262730] border-slate-700 text-white focus:border-indigo-500"
                          : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                      }`}
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.name}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* AI power status indicator */}
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>AI Translation Ready</span>
                    <span className="text-emerald-500 animate-pulse">●</span>
                  </div>
                </div>

                {/* Main twin editor layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  {/* Left: Input box */}
                  <div className="relative flex flex-col">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Enter text to translate..."
                      className={`w-full min-h-[180px] flex-1 rounded-2xl border p-4 text-base focus:outline-none transition-all resize-none ${
                        isDarkMode
                          ? "bg-[#262730] border-slate-700 text-white placeholder:text-slate-500 focus:border-[#FF4B4B]"
                          : "bg-slate-50 border-slate-100 text-slate-800 placeholder:text-slate-300 focus:border-[#FF4B4B]"
                      }`}
                    />
                    <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-400 bg-slate-800/10 dark:bg-slate-900/30 px-2 py-0.5 rounded">
                      {inputText.length} / 5000 chars
                    </div>
                  </div>

                  {/* Right: Translated Box / Output */}
                  <div className="relative flex flex-col">
                    {isLoading ? (
                      <div className={`w-full min-h-[180px] flex-1 rounded-2xl border p-6 flex flex-col items-center justify-center space-y-3 transition-all ${
                        isDarkMode ? "bg-slate-800/30 border-slate-700" : "bg-indigo-50/20 border-indigo-100"
                      }`}>
                        <svg className="animate-spin h-8 w-8 text-[#FF4B4B]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-xs text-slate-400 font-semibold animate-pulse">Running streamlit translator...</span>
                      </div>
                    ) : (
                      <div className={`w-full min-h-[180px] flex-1 rounded-2xl border p-4 text-base transition-all overflow-y-auto whitespace-pre-wrap select-all font-medium ${
                        translatedText
                          ? isDarkMode
                            ? "bg-[#FF4B4B]/5 border-[#FF4B4B]/20 text-slate-100"
                            : "bg-indigo-50/50 border-indigo-100 text-slate-800"
                          : isDarkMode
                            ? "bg-slate-800/20 border-slate-850 text-slate-500 italic"
                            : "bg-slate-50 border-slate-100 text-slate-400 italic"
                      }`}>
                        {translatedText || "Translation output will appear here..."}
                      </div>
                    )}

                    {/* Copy translation action button overlay */}
                    {translatedText && !isLoading && (
                      <div className="absolute bottom-3 right-3">
                        <button
                          onClick={() => copyToClipboard(translatedText, setCopiedText)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm transition-all flex items-center space-x-1 cursor-pointer ${
                            copiedText
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : isDarkMode
                                ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {copiedText ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Big Translate Now Primary Action Button */}
                <button
                  onClick={handleTranslate}
                  disabled={isLoading}
                  className={`w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-indigo-500/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-indigo-200 animate-bounce" />
                  <span>Translate Now</span>
                </button>

                {/* Display errors neatly */}
                {errorMsg && (
                  <div className="p-4 rounded-xl border border-rose-800/30 bg-rose-950/20 text-rose-400 text-xs flex items-center gap-2">
                    <span>⚠️</span>
                    <p>{errorMsg}</p>
                  </div>
                )}
              </section>

              {/* BENTO CARD 2: History (Col Span: 4, full height spans on lg) */}
              <section className={`col-span-12 lg:col-span-4 rounded-3xl border shadow-sm p-6 flex flex-col justify-between transition-all duration-300 ${
                isDarkMode 
                  ? "bg-[#262730] border-slate-800 text-[#fafafa]" 
                  : "bg-white border-slate-200 text-slate-800"
              }`}>
                <div className="flex-grow flex flex-col">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700/10">
                    <h2 className="text-sm font-bold flex items-center gap-2 text-slate-400 uppercase tracking-wider">
                      <span>🕒</span> Translation History
                    </h2>
                    {history.length > 0 && (
                      <button
                        onClick={handleClearHistory}
                        className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Scrollable logs list */}
                  <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 flex-grow">
                    {history.length === 0 ? (
                      <div className={`text-center py-12 px-4 rounded-2xl border border-dashed text-xs ${
                        isDarkMode ? "border-slate-750 bg-slate-900/10 text-slate-400" : "border-slate-250 bg-slate-50/50 text-slate-400"
                      }`}>
                        <History className="w-8 h-8 mx-auto mb-2 text-slate-350 opacity-50" />
                        No translations in this session.<br />Start translating to see logs!
                      </div>
                    ) : (
                      history.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border text-left transition-all group ${
                            isDarkMode
                              ? "bg-slate-800/40 border-slate-750 hover:bg-slate-750/70"
                              : "bg-slate-50 border-slate-100 hover:bg-slate-100/70"
                          }`}
                        >
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                            <span className="text-indigo-500 font-bold">
                              {item.src} ➡️ {item.tgt}
                            </span>
                            <span>{item.time}</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-200 truncate mb-1">
                            "{item.original}"
                          </p>
                          <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-700/5">
                            <button
                              onClick={() => {
                                setInputText(item.original);
                                setSourceLang(item.src);
                                setTargetLang(item.tgt);
                                setTranslatedText(item.translation);
                              }}
                              className="text-[10px] font-bold text-indigo-500 hover:underline cursor-pointer"
                            >
                              🔄 Restore
                            </button>
                            <button
                              onClick={() => copyToClipboard(item.translation, () => {})}
                              className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
                            >
                              <Copy className="w-2.5 h-2.5" />
                              Copy result
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Subtitle/Button bottom */}
                <div className={`mt-4 p-4 rounded-xl text-xs border ${
                  isDarkMode ? "bg-slate-800/30 border-slate-700" : "bg-slate-50 border-slate-200"
                }`}>
                  <span className="font-bold text-slate-400 block mb-0.5">Streamlit App Sidebar</span>
                  <span className="text-slate-400 leading-relaxed">
                    This sidebar manages localized cache history for student presentation reviews.
                  </span>
                </div>
              </section>

              {/* BENTO CARD 3: Statistics (Col Span: 4) */}
              <section className="col-span-12 md:col-span-4 bg-indigo-600 rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg shadow-indigo-600/10 min-h-[160px] relative overflow-hidden">
                <div className="absolute right-[-10px] top-[-10px] opacity-10">
                  <Languages className="w-32 h-32" />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-indigo-200 z-10">
                  Total Session Runs
                </div>
                <div className="flex items-end gap-2 z-10">
                  <div className="text-5xl font-black tracking-tight">{history.length}</div>
                  <div className="text-xs mb-2 text-indigo-200 font-semibold">
                    +{history.length > 0 ? "1" : "0"} active now
                  </div>
                </div>
                <div className="text-[10px] text-indigo-200 font-medium z-10">
                  Dynamically updated from Streamlit state cache.
                </div>
              </section>

              {/* BENTO CARD 4: Supported Languages (Col Span: 4) */}
              <section className={`col-span-12 md:col-span-4 rounded-3xl border shadow-sm p-6 flex items-center gap-6 transition-all duration-300 ${
                isDarkMode 
                  ? "bg-[#262730] border-slate-800 text-[#fafafa]" 
                  : "bg-white border-slate-200 text-slate-800"
              }`}>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Supported
                  </div>
                  <div className="text-3xl font-black text-slate-800 dark:text-white">
                    100+
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Global Languages
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-sm shadow-sm">🇺🇸</div>
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-sm shadow-sm">🇫🇷</div>
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-sm shadow-sm">🇪🇸</div>
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-sm shadow-sm">🇯🇵</div>
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-sm shadow-sm">🇩🇪</div>
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-sm shadow-sm">🇮🇳</div>
                </div>
              </section>

              {/* BENTO CARD 5: Portfolio details card (Col Span: 4) */}
              <section className={`col-span-12 md:col-span-4 rounded-3xl border shadow-sm p-6 flex flex-col justify-between transition-all duration-300 ${
                isDarkMode 
                  ? "bg-[#262730] border-slate-800 text-[#fafafa]" 
                  : "bg-white border-slate-200 text-slate-800"
              }`}>
                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-rose-500" />
                    How this demo works
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    This simulator acts exactly like your Python Streamlit application! Under the hood, it securely communicates with a server-side Gemini 3.5 AI translator to provide free translation instantly.
                  </p>
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-3">
                  Google Translate Engine Enabled
                </div>
              </section>

            </motion.div>
          )}

          {/* TAB 2: CODE EXPLORER */}
          {activeTab === "code" && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className={`rounded-2xl shadow-xl border overflow-hidden flex flex-col md:grid md:grid-cols-4 min-h-[550px] transition-all duration-300 ${
                isDarkMode 
                  ? "bg-[#262730] border-slate-800 text-slate-200" 
                  : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              {/* File Side Rail */}
              <div className={`md:col-span-1 p-5 border-b md:border-b-0 md:border-r flex flex-col justify-between ${
                isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"
              }`}>
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4 flex items-center">
                    <Code className="w-4 h-4 mr-1.5 text-rose-500" />
                    Project Files
                  </h3>
                  
                  {/* File Buttons */}
                  <div className="space-y-1">
                    {Object.keys(sourceFiles).map((fileName) => {
                      const isActive = selectedFile === fileName;
                      return (
                        <button
                          key={fileName}
                          onClick={() => {
                            setSelectedFile(fileName);
                            setCopiedFileCode(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-mono tracking-tight flex items-center justify-between transition-all cursor-pointer ${
                            isActive
                              ? "bg-indigo-600 text-white font-semibold shadow-sm"
                              : "text-slate-400 hover:text-slate-250 hover:bg-slate-800/40"
                          }`}
                        >
                          <span className="truncate">{fileName}</span>
                          <span className="text-[10px]">
                            {fileName.endsWith(".py") ? "🐍" : fileName.endsWith(".toml") ? "⚙️" : "📄"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Info block inside file explorer */}
                <div className={`mt-8 p-4 rounded-xl text-xs border ${
                  isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-100 border-slate-200"
                }`}>
                  <span className="font-bold text-rose-500 block mb-1">
                    📥 Download Instructions:
                  </span>
                  <span className="text-slate-400 leading-relaxed">
                    All these files are actively stored inside your workspaces directory in `/AI_Language_Translator/`. You can copy them or export the folder to use for your internship report!
                  </span>
                </div>
              </div>

              {/* Code display panel */}
              <div className="md:col-span-3 flex flex-col h-full bg-slate-950 text-slate-300">
                {/* File Details bar */}
                <div className="bg-slate-950/80 border-b border-slate-850 px-6 py-3.5 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-mono text-slate-300">
                      {sourceFiles[selectedFile].label}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => copyToClipboard(sourceFiles[selectedFile].content, setCopiedFileCode)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1.5 cursor-pointer ${
                      copiedFileCode
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                        : "bg-slate-850 border-slate-750 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {copiedFileCode ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Code Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Syntax Code Viewer */}
                <div className="p-6 overflow-auto max-h-[500px] flex-grow">
                  <pre className="text-xs font-mono leading-relaxed text-slate-300 bg-slate-950/40 p-4 rounded-xl border border-slate-850/60 overflow-x-auto select-all">
                    <code>{sourceFiles[selectedFile].content}</code>
                  </pre>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: RUN & DEPLOYMENT GUIDE */}
          {activeTab === "guide" && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className={`rounded-2xl shadow-xl border p-6 md:p-8 space-y-8 transition-all duration-300 ${
                isDarkMode 
                  ? "bg-[#262730] border-slate-800 text-slate-200" 
                  : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              {/* Main Guide Headers */}
              <div className="border-b pb-4 flex items-center space-x-3 border-slate-700/10">
                <div className="bg-indigo-100 dark:bg-indigo-950 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Terminal className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-xl md:text-2xl text-slate-900 dark:text-white">
                    Setup & Cloud Deployment Guide
                  </h3>
                  <p className="text-slate-400 text-sm">
                    How to install dependencies, run your translator app locally, and launch to Streamlit Cloud.
                  </p>
                </div>
              </div>

              {/* Steps grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Local environment Setup */}
                <div className="space-y-4">
                  <h4 className="font-display font-bold text-lg text-slate-850 dark:text-white flex items-center">
                    <span className="w-7 h-7 rounded-lg bg-rose-500 text-white font-mono text-sm flex items-center justify-center mr-2">
                      1
                    </span>
                    Local Machine Setup
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Make sure you have **Python 3.8+** installed. Then navigate to your project directory inside the terminal and execute these commands:
                  </p>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 block uppercase">
                      Create & Activate Virtual Environment:
                    </span>
                    <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-lg overflow-x-auto relative group">
                      <code>{`# Windows
python -m venv venv
venv\\Scripts\\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate`}</code>
                    </pre>

                    <span className="text-xs font-bold text-slate-400 block uppercase pt-2">
                      Install Required Python Libraries:
                    </span>
                    <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-lg overflow-x-auto">
                      <code>pip install -r requirements.txt</code>
                    </pre>

                    <span className="text-xs font-bold text-slate-400 block uppercase pt-2">
                      Launch Streamlit App:
                    </span>
                    <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-lg overflow-x-auto">
                      <code>streamlit run app.py</code>
                    </pre>
                  </div>
                </div>

                {/* Cloud Deployment details */}
                <div className="space-y-4 border-t md:border-t-0 md:border-l md:pl-8 border-slate-200 dark:border-slate-800">
                  <h4 className="font-display font-bold text-lg text-slate-850 dark:text-white flex items-center">
                    <span className="w-7 h-7 rounded-lg bg-indigo-500 text-white font-mono text-sm flex items-center justify-center mr-2">
                      2
                    </span>
                    Free Streamlit Cloud Hosting
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Streamlit lets you host your Python web applications for free indefinitely. Follow this streamlined workflow:
                  </p>

                  {/* Visual Timeline / Bullet sequence */}
                  <div className="space-y-4 pt-1">
                    <div className="flex items-start space-x-3 text-sm">
                      <div className="text-indigo-500 mt-0.5">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-slate-800 dark:text-slate-200 block">Step 2.1: Upload to GitHub</strong>
                        <span className="text-slate-400">
                          Create a public repository on GitHub, and push the `/AI_Language_Translator/` files inside of it. Ensure `requirements.txt` is in the repository root.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 text-sm">
                      <div className="text-indigo-500 mt-0.5">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-slate-800 dark:text-slate-200 block">Step 2.2: Sign into Streamlit Share</strong>
                        <span className="text-slate-400">
                          Visit <a href="https://share.streamlit.io" target="_blank" rel="noopener noreferrer" className="text-indigo-500 font-bold hover:underline inline-flex items-center">share.streamlit.io <ExternalLink className="w-3 h-3 ml-0.5" /></a> and connect with your GitHub account.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 text-sm">
                      <div className="text-indigo-500 mt-0.5">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-slate-800 dark:text-slate-200 block">Step 2.3: Point & Deploy</strong>
                        <span className="text-slate-400">
                          Click "New App", select your repository name, and type `app.py` in the main file path input. Click **Deploy!**
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Callout box */}
                  <div className="p-4 bg-indigo-50/50 dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 mt-6 leading-relaxed">
                    <strong>💡 Why deep-translator is the best option:</strong> Because deep-translator retrieves translate answers instantly from translation endpoints without requiring API Keys, your hosted application will run safely, quickly, and completely free of charge forever without exposing sensitive secrets!
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding Info */}
      <footer className={`border-t py-6 px-4 transition-all duration-300 ${
        isDarkMode ? "bg-[#0e1117] border-slate-850 text-slate-500" : "bg-white border-slate-200 text-slate-450"
      }`}>
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold">
          <div className="flex gap-6 flex-wrap justify-center">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="text-[10px] uppercase tracking-wider">Deep-Translator Online</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <span className="text-[10px] uppercase tracking-wider">Free Google Translation Engine API</span>
            </div>
          </div>
          <div className="text-center md:text-right text-[10px] text-slate-400 dark:text-slate-500">
            Built with Python & Streamlit • Zero Cost Translation Package
          </div>
        </div>
      </footer>
    </div>
  );
}

