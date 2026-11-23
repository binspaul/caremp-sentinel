"""
Long-Term Memory Compactor Service

Merges newly shared user health attributes into the existing long-term memory profile
using Google Gemini (or structured heuristic fallback when offline/unauthenticated),
ensuring token efficiency and enforcing database character constraints.
"""
import logging
import os
from ..config import MODEL_NAME, MAX_LTM_CHAR_LIMIT, MAX_COMPACTION_TOKENS, GEMINI_API_KEY

logger = logging.getLogger(__name__)


def compact_long_term_memory(existing_ltm: str, new_info: str) -> str:
    """
    Combines existing long-term memory with new user information,
    invoking Gemini to rewrite and compact into a structured document <= 6000 chars.
    """
    prompt = f"""You are an AI Memory Synthesizer for a Personalized Health Care Coach.
Merge the new user information into the existing long-term memory profile.

## Existing Long-Term Memory Profile
{existing_ltm if existing_ltm else "No existing long-term memory recorded."}

## New Information to Incorporate
{new_info}

## Compaction Guidelines
1. Organize into clean markdown sections:
   - ## LIFESTYLE & EXERCISE
   - ## DIET & ALLERGIES
   - ## CHRONIC CONDITIONS & MEDICATIONS
   - ## GOALS & PREFERENCES
2. Seamlessly merge and deduplicate details (e.g. replace outdated habits with new routines).
3. Keep the content clear, clinically relevant, and concise.
4. Output MUST NOT exceed {MAX_LTM_CHAR_LIMIT} characters.
5. Output ONLY the updated markdown profile text with no conversational preamble or meta-commentary.
"""

    # 1. Attempt Gemini compaction via google-genai
    try:
        from google import genai
        api_key = GEMINI_API_KEY or os.getenv("GOOGLE_API_KEY")
        client = genai.Client(api_key=api_key) if api_key else genai.Client()
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
        )
        if response and response.text:
            compacted = response.text.strip()
            if len(compacted) > MAX_LTM_CHAR_LIMIT:
                compacted = compacted[:MAX_LTM_CHAR_LIMIT]
            return compacted
    except Exception as e:
        logger.warning(f"Gemini compaction failed ({e}), falling back to direct synthesis.")

    # 2. Resilient local fallback when LLM API is unavailable
    merged = (
        f"{existing_ltm}\n\n"
        f"## RECENTLY ADDED\n- {new_info.strip()}"
    ).strip()

    if len(merged) > MAX_LTM_CHAR_LIMIT:
        merged = merged[:MAX_LTM_CHAR_LIMIT]
    return merged
