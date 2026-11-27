import os
import re
from typing import Any, Dict, Optional, Tuple
import httpx
from dotenv import load_dotenv

# Ensure engines/.env is always loaded
load_dotenv()

try:
    import litellm
except ImportError:
    litellm = None

DEFAULT_MODEL = os.getenv("LLM_MODEL", "gemma-4-26b-a4b-it")

SYSTEM_PROMPT = """You are a warm, supportive health assistant writing directly to a memory care resident.
Summarise the resident's current wellness state based on the structured data provided.

STRICT GUIDELINES:
- Warm, empathetic, and encouraging tone.
- Speak directly to the resident ("you", "your").
- NEVER use clinical jargon, medical abbreviations (e.g. "HR", "BP", "HRV", "SpO2", "NEWS2"), or numerical vitals values.
- If late-afternoon restlessness, nighttime activity, or sleep rhythm shifts are noted, offer gentle reassurance, grounding suggestions (soft lighting, calm music, a warm drink, resting feet), and reassurance that caregivers are nearby.
- If a resident name is given, use it as a warm personal touch alongside that direct "you" address.

Respond in EXACTLY this format, two lines, nothing else:
Headline: <headline>
Summary: <1-2 sentence summary>
"""


def generate_template_summary(context: Dict[str, Any]) -> str:
    """
    Fallback deterministic wellness template generator.
    Produces warm, friendly, non-clinical summaries without requiring an LLM API key.
    """
    name = context.get("resident_name")
    name_str = f", {name}" if name else ""
    category = context.get("category", "Good")
    score = context.get("score", 85)
    sundowning = context.get("sundowning_status")
    wandering = context.get("wandering_status")
    circadian = context.get("circadian_status")

    if sundowning in ("AGITATED", "SURGE_ALERT", "RESTLESS"):
        headline = f"Take a gentle, quiet moment to unwind{name_str}."
        summary = "The late afternoon can feel a bit restless. Dimming bright lights, sipping a warm cup of herbal tea, and resting your feet will help your body settle peacefully."
    elif wandering in ("PERIMETER_ALERT", "NOCTURNAL_BED_EXIT", "PACING_LOOP"):
        headline = f"Checking in to keep you safe and comfortable{name_str}."
        summary = "We noticed you've been on your feet and moving about. Remember to take your time, and let a caregiver assist you whenever you need comfort or companionship."
    elif circadian in ("DAY_NIGHT_REVERSAL", "MODERATE_IRREGULARITY"):
        headline = f"Gentle reminder for your daily rhythm{name_str}."
        summary = "Spending a little time in the bright daylight and staying gently active today will help you enjoy a deep, soothing sleep tonight."
    elif category in ("Excellent", "Good") or score >= 75:
        headline = f"You're doing wonderfully today{name_str}!"
        summary = "Your daily rhythms are steady and balanced, and your body is well-rested. Keep enjoying your day!"
    elif category in ("Fair", "Watch") or score >= 60:
        headline = f"Gentle reminder to take it easy{name_str}."
        summary = "Your body is showing a little extra tiredness today. Be sure to drink plenty of water and take relaxing pauses throughout your afternoon."
    else:
        headline = f"Checking in on you{name_str}."
        summary = "A few of your vitals are feeling slightly different from your usual rhythm today. Take some restful time, and let a caregiver or staff know if you need any comfort."

    return f"Headline: {headline}\nSummary: {summary}"


def _build_user_prompt(context: Dict[str, Any]) -> str:
    lines = []
    resident_name = context.get("resident_name")
    if resident_name:
        lines.append(f"Resident's name: {resident_name}")

    lines.append(f"Wellness score: {context['score']}/100 ({context['category']})")

    if context.get("sundowning_status") and context["sundowning_status"] != "CALM":
        lines.append(f"Afternoon state: {context['sundowning_status']} (late-afternoon restlessness)")
    if context.get("wandering_status") and context["wandering_status"] != "NORMAL":
        lines.append(f"Mobility/Safety state: {context['wandering_status']}")
    if context.get("circadian_status") and context["circadian_status"] != "OPTIMAL":
        lines.append(f"Sleep rhythm state: {context['circadian_status']}")

    if context.get("triggered_rule_descriptions"):
        lines.append("Things flagged:")
        for description in context["triggered_rule_descriptions"]:
            lines.append(f"- {description}")
    else:
        lines.append("Nothing flagged - rhythms are steady and comfortable.")

    if context.get("trends"):
        lines.append("Recent trends:")
        for metric, direction in context["trends"].items():
            lines.append(f"- {metric.replace('_', ' ')}: {direction}")

    lines.append("\nWrite the update now, following the format exactly.")
    return "\n".join(lines)


def parse_summary(raw_text: str, default_name: Optional[str] = None) -> Tuple[str, str]:
    """
    Parses 'Headline: ...\nSummary: ...' out of the response.
    Sanitizes markdown tags (e.g. bold asterisks, bullets).
    """
    headline = ""
    summary = ""
    for line in raw_text.strip().splitlines():
        stripped = line.strip()
        # Clean potential markdown bold, bullets, asterisks, italics
        cleaned = re.sub(r"^[#*_\-\s]+", "", stripped).strip()
        cleaned = re.sub(r"[*_]+$", "", cleaned).strip()
        if re.match(r"^headline\s*:", cleaned, re.IGNORECASE):
            headline = re.split(r"^headline\s*:\s*", cleaned, flags=re.IGNORECASE)[1].strip()
        elif re.match(r"^summary\s*:", cleaned, re.IGNORECASE):
            summary = re.split(r"^summary\s*:\s*", cleaned, flags=re.IGNORECASE)[1].strip()

    if not headline and not summary:
        summary = raw_text.strip()
    if not headline and summary:
        name_str = f", {default_name}" if default_name else ""
        headline = f"Wellness update{name_str}."

    return headline, summary


def generate_summary(context: Dict[str, Any], model: str = DEFAULT_MODEL) -> str:
    """
    Generates a wellness summary. If GEMINI_API_KEY is not set,
    seamlessly falls back to the deterministic template generator.
    When GEMINI_API_KEY is provided, calls Gemini Flash directly via HTTP.
    """
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return generate_template_summary(context)

    # 1. Direct call to Google Generative Language API
    candidate_models = [DEFAULT_MODEL, "gemini-flash-lite-latest", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-flash-latest"]
    user_prompt = _build_user_prompt(context)
    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [{"parts": [{"text": user_prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 300}
    }

    for m in candidate_models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
            res = httpx.post(url, json=payload, timeout=20.0)
            if res.status_code == 200:
                data = res.json()
                parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                if parts and "text" in parts[0]:
                    return parts[0]["text"]
            elif res.status_code == 503:
                # 503 High demand on this specific model, try next candidate model
                continue
            else:
                print(f"[Gemini API {res.status_code} ({m})]: {res.text[:150]}")
        except Exception:
            continue

    # 2. Litellm fallback if installed
    if litellm is not None:
        try:
            user_prompt = _build_user_prompt(context)
            response = litellm.completion(
                model=model,
                api_key=api_key,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,
                max_tokens=150,
                timeout=10,
            )
            return response.choices[0].message.content
        except Exception:
            pass

    # 3. Graceful fallback directly to template
    return generate_template_summary(context)
