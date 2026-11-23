"""
Live End-to-End LLM Reasoning & Dynamic Context Injection Test (Google Gemini)
"""
import sys
import os

# Add project root to sys.path
repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

from agent.config import MODEL_NAME, GEMINI_API_KEY
from agent.memory.context_builder import build_additional_context
from agent.agent import CARE_COACH_INSTRUCTION
from agent.tools.twin_tools import get_current_twin_state, get_health_record, get_twin_analytics
from agent.tools.memory_tools import update_short_term_memory, update_long_term_memory


def run_live_test():
    print("=" * 60)
    print(f"  Live Agent Test: Care Coach with {MODEL_NAME}")
    print("=" * 60)

    if not GEMINI_API_KEY:
        print("[!] GEMINI_API_KEY not configured in agent/.env. Skipping live test.")
        return

    from google import genai

    client = genai.Client(api_key=GEMINI_API_KEY)
    user_id = "1"

    dynamic_context = build_additional_context(user_id)
    system_prompt = f"{CARE_COACH_INSTRUCTION}\n\n[CURRENT USER HEALTH CONTEXT]\n{dynamic_context}\n[END CONTEXT]"

    test_prompt = "Hi Care Coach! I've been feeling run down today with a mild fever of 99.8 F since morning. How does that connect with my recent sleep and vitals?"
    print(f"\nUser Query: \"{test_prompt}\"\n")

    chat = client.chats.create(
        model=MODEL_NAME,
        config={
            "system_instruction": system_prompt,
            "tools": [
                get_current_twin_state,
                get_health_record,
                get_twin_analytics,
                update_short_term_memory,
                update_long_term_memory,
            ]
        }
    )

    response = chat.send_message(test_prompt)
    print("Care Coach Response:\n")
    print(response.text)
    print("\n" + "=" * 60)
    print("  [✓] Live Reasoning Test Completed Successfully!")
    print("=" * 60)


if __name__ == "__main__":
    run_live_test()
