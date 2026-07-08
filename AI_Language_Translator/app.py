# ==============================================================================
# AI Language Translator - Streamlit Application
# Built for: Internship Project
# Language: Python 3.8+
# Framework: Streamlit
# Library: deep-translator (completely free, no API keys required!)
# ==============================================================================

import streamlit as st
from deep_translator import GoogleTranslator
import time

# ------------------------------------------------------------------------------
# 1. Page Configuration & Custom CSS Styling
# ------------------------------------------------------------------------------
# Set the page title, emoji icon, layout, and sidebar state
st.set_page_config(
    page_title="AI Language Translator",
    page_icon="🔮",
    layout="centered",
    initial_sidebar_state="expanded"
)

# Custom CSS styling to elevate the UI and give it a premium, modern feel
st.markdown("""
<style>
    /* Gradient text effect for the main heading */
    .title-text {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        font-weight: 800;
        text-align: center;
        background: linear-gradient(90deg, #FF4B4B, #FF8F8F);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 5px;
    }
    
    /* Centered subtle subtitle styling */
    .subtitle-text {
        text-align: center;
        color: #888888;
        font-size: 1.1rem;
        margin-bottom: 25px;
    }
    
    /* Set textarea fonts to be slightly larger and cleaner */
    .stTextArea textarea {
        font-size: 16px !important;
    }
    
    /* Custom container styling for the displayed translation */
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
    
    /* Add styling for details inside history cards */
    .history-card {
        padding: 10px;
        border-radius: 5px;
        background-color: rgba(255, 255, 255, 0.03);
        border-left: 3px solid #FF4B4B;
        margin-bottom: 10px;
    }
</style>
""", unsafe_allow_html=True)


# ------------------------------------------------------------------------------
# 2. Retrieve & Cache Supported Languages
# ------------------------------------------------------------------------------
# Caching saves resources and ensures fast loads on subsequent interactions
@st.cache_data
def load_languages():
    """
    Fetches the supported languages from GoogleTranslator and returns a sorted dict.
    If the API fails (e.g., offline or network error), returns a robust fallback list.
    """
    try:
        # Retrieve the dictionary of format {language_name: language_code}
        langs = GoogleTranslator().get_supported_languages(as_dict=True)
        # Format language names to Title Case and sort alphabetically
        sorted_langs = {k.title(): v for k, v in sorted(langs.items())}
        return sorted_langs
    except Exception:
        # High-quality fallback of common languages in case the external API fails
        return {
            "English": "en", "Spanish": "es", "French": "fr", "German": "de", 
            "Italian": "it", "Portuguese": "pt", "Russian": "ru", "Chinese (Simplified)": "zh-CN",
            "Chinese (Traditional)": "zh-TW", "Japanese": "ja", "Hindi": "hi", "Arabic": "ar", 
            "Korean": "ko", "Turkish": "tr", "Vietnamese": "vi", "Dutch": "nl"
        }

# Load the language mapping
languages_dict = load_languages()
language_list = list(languages_dict.keys())


# ------------------------------------------------------------------------------
# 3. Session State Initialization
# ------------------------------------------------------------------------------
# Initialize persistent session variables to retain data across app reruns
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


# ------------------------------------------------------------------------------
# 4. Sidebar Panel: History and Project Information
# ------------------------------------------------------------------------------
with st.sidebar:
    st.markdown("### 📜 Translation History")
    
    if not st.session_state.history:
        st.info("No translations yet! Start translating to see history items here.")
    else:
        # Iterate over translation history items (most recent first)
        for idx, item in enumerate(reversed(st.session_state.history)):
            title = f"{item['src']} ➡️ {item['tgt']} ({item['time']})"
            with st.expander(title):
                st.markdown(f"**Original:**\n*{item['original']}*")
                st.markdown(f"**Translation:**\n*{item['translation']}*")
                
                # Add button to quickly reuse this specific input text
                if st.button("🔄 Reuse Text", key=f"reuse_{idx}"):
                    st.session_state.input_text = item['original']
                    st.rerun()
        
        # Button to clear the history
        st.write("")
        if st.button("🧹 Clear All History", use_container_width=True):
            st.session_state.history = []
            st.rerun()

    # Information box about the student internship project
    st.markdown("---")
    st.markdown("### ℹ️ Internship Project Details")
    st.markdown("""
    **Project Title:** AI Language Translator  
    **Author:** Internship Student  
    **Framework:** Streamlit (Python)  
    **Engine:** Google Translate API (`deep-translator`)  
    **API Cost:** \$0.00 (Completely Free)  
    
    *Supports 100+ global languages natively and instantly without configuring any credentials.*
    """)


# ------------------------------------------------------------------------------
# 5. Header Layout
# ------------------------------------------------------------------------------
st.markdown("<h1 class='title-text'>🔮 AI Language Translator</h1>", unsafe_allow_html=True)
st.markdown("<p class='subtitle-text'>Translate your documents, sentences, and words instantly for free!</p>", unsafe_allow_html=True)


# ------------------------------------------------------------------------------
# 6. Language Selectors & Swap Button
# ------------------------------------------------------------------------------
# Set up a three-column layout (Source Language | Swap Button | Target Language)
col_src, col_btn, col_tgt = st.columns([4, 1, 4])

with col_src:
    # Safely locate current source index in list, default to index 0 if not found
    src_idx = language_list.index(st.session_state.source_lang) if st.session_state.source_lang in language_list else 0
    source_sel = st.selectbox(
        "Source Language 🌐",
        options=language_list,
        index=src_idx,
        key="src_dropdown"
    )
    st.session_state.source_lang = source_sel

with col_btn:
    st.write("") # Spacer to push the button down align with dropdowns
    st.write("")
    # Language swap button logic
    if st.button("⇆", help="Swap Source and Target Languages"):
        st.session_state.source_lang, st.session_state.target_lang = st.session_state.target_lang, st.session_state.source_lang
        st.rerun()

with col_tgt:
    # Safely locate current target index in list, default to index 1 if not found
    tgt_idx = language_list.index(st.session_state.target_lang) if st.session_state.target_lang in language_list else 1
    target_sel = st.selectbox(
        "Target Language 🎯",
        options=language_list,
        index=tgt_idx,
        key="tgt_dropdown"
    )
    st.session_state.target_lang = target_sel


# ------------------------------------------------------------------------------
# 7. Text Input Area & Analysis
# ------------------------------------------------------------------------------
st.write("") # Spacer

input_val = st.text_area(
    "Enter text to translate:",
    value=st.session_state.input_text,
    placeholder="Type or paste your text here (e.g., Hello, how are you today?)...",
    height=160,
    key="text_to_translate"
)
st.session_state.input_text = input_val

# Calculate word and character count in real time
char_count = len(input_val)
word_count = len(input_val.split()) if input_val else 0
st.caption(f"📊 **Statistics:** Characters: `{char_count}` | Words: `{word_count}`")


# ------------------------------------------------------------------------------
# 8. Main Translation Logic
# ------------------------------------------------------------------------------
if st.button("🚀 Translate Now", type="primary", use_container_width=True):
    if not input_val.strip():
        st.warning("⚠️ Please write some text first before clicking Translate!")
    else:
        # Show loading spinner while requesting Google Translator API
        with st.spinner("🔮 Translating your text... Please wait."):
            try:
                # Retrieve language codes from our loaded dictionary
                src_code = languages_dict[st.session_state.source_lang]
                tgt_code = languages_dict[st.session_state.target_lang]
                
                # Instantiate the translator and translate
                translator = GoogleTranslator(source=src_code, target=tgt_code)
                translation_result = translator.translate(input_val)
                
                # Update output state
                st.session_state.translated_text = translation_result
                
                # Append to persistent history log with a clean timestamp
                current_time = time.strftime("%H:%M:%S")
                st.session_state.history.append({
                    "src": st.session_state.source_lang,
                    "tgt": st.session_state.target_lang,
                    "original": input_val,
                    "translation": translation_result,
                    "time": current_time
                })
                
                # Limit history log size to 10 entries to keep layout fast
                if len(st.session_state.history) > 10:
                    st.session_state.history.pop(0)
                
                st.success("✅ Text Translated Successfully!")
                st.rerun() # Refresh layout to display results instantly
                
            except Exception as e:
                st.error(f"❌ Translation failed! Error: {str(e)}")
                st.info("💡 Tip: Make sure you have an active internet connection to contact the Google Translate engine.")


# ------------------------------------------------------------------------------
# 9. Results Display & Easy Copy Feature
# ------------------------------------------------------------------------------
if st.session_state.translated_text:
    st.write("---")
    st.markdown("### 🎉 Translated Output:")
    
    # Styled block displaying the result beautifully
    st.markdown(f"<div class='translation-box'>{st.session_state.translated_text}</div>", unsafe_allow_html=True)
    
    # Text area specifically used to provide a "copy-to-clipboard" icon natively in Streamlit
    # The default text_area in Streamlit has a copy button at the top-right corner
    st.text_area(
        "👇 Click the icon in the top-right of this box to Copy:",
        value=st.session_state.translated_text,
        height=100,
        disabled=True,
        help="Quick-copy the translation to your clipboard!"
    )
