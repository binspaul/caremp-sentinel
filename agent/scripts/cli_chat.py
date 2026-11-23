"""
Interactive CLI Console for careMP Sentinel Care Coach Agent
Includes real-time spinner, 503 retry resilience, and automatic model fallback.
"""
import os
import sys
import time
import threading

# Add project root to sys.path
repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

from agent.config import (
    MODEL_NAME,
    GEMINI_API_KEY,
    USE_VERTEX_AI,
    GOOGLE_CLOUD_PROJECT,
    GOOGLE_CLOUD_LOCATION,
)
from agent.memory.context_builder import build_additional_context
from agent.agent import CARE_COACH_INSTRUCTION
from agent.tools.twin_tools import get_current_twin_state, get_health_record, get_twin_analytics
from agent.tools.memory_tools import (
    update_short_term_memory,
    update_long_term_memory,
    get_short_term_memory,
    get_long_term_memory,
)


class ThinkingSpinner:
    """Displays an active elapsed-time spinner in the terminal so you know Gemini is working."""
    def __init__(self, message="Care Coach is thinking"):
        self.message = message
        self.running = False
        self.thread = None
        self.start_time = None

    def start(self):
        self.running = True
        self.start_time = time.time()
        self.thread = threading.Thread(target=self._spin, daemon=True)
        self.thread.start()

    def _spin(self):
        frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
        idx = 0
        while self.running:
            elapsed = int(time.time() - self.start_time)
            frame = frames[idx % len(frames)]
            sys.stdout.write(f"\r{frame} {self.message}... ({elapsed}s)")
            sys.stdout.flush()
            idx += 1
            time.sleep(0.1)

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join()
        sys.stdout.write("\r" + " " * 60 + "\r")
        sys.stdout.flush()


def create_chat_session(client, model_name, user_id="1"):
    """Creates a configured chat session with system instruction and tools."""
    from google.genai import types
    dynamic_context = build_additional_context(user_id)
    system_prompt = f"{CARE_COACH_INSTRUCTION}\n\n[CURRENT USER HEALTH CONTEXT]\n{dynamic_context}\n[END CONTEXT]"

    config_args = {
        "system_instruction": system_prompt,
        "tools": [
            get_current_twin_state,
            get_health_record,
            get_twin_analytics,
            update_short_term_memory,
            update_long_term_memory,
        ]
    }
    # Only non-lite models accept thinking_config
    if "lite" not in model_name:
        config_args["thinking_config"] = types.ThinkingConfig(thinking_budget=0)

    return client.chats.create(
        model=model_name,
        config=types.GenerateContentConfig(**config_args)
    )


def main():
    print("=" * 65)
    print("  careMP Sentinel Care Coach — Interactive CLI Console")
    print(f"  Primary Model: {MODEL_NAME}")
    print("=" * 65)
    print("Commands:")
    print("  /context   - View current injected dynamic context (Twin + LTM + STM)")
    print("  /ltm       - View persistent Long-Term Memory")
    print("  /stm       - View active Short-Term Memory")
    print("  /exit      - Quit console\n")

    client = None
    try:
        from google import genai
        api_key = GEMINI_API_KEY or os.getenv("GOOGLE_API_KEY")
        if api_key:
            client_kwargs = {"api_key": api_key}
            if USE_VERTEX_AI:
                client_kwargs["vertexai"] = True
                if GOOGLE_CLOUD_PROJECT:
                    client_kwargs["project"] = GOOGLE_CLOUD_PROJECT
                if GOOGLE_CLOUD_LOCATION:
                    client_kwargs["location"] = GOOGLE_CLOUD_LOCATION
                print(f"[✓] Connected to Google Cloud Vertex AI (Project: {GOOGLE_CLOUD_PROJECT or 'default'}).")
            else:
                print("[✓] Connected to Google Gemini API.")
            client = genai.Client(**client_kwargs)
        else:
            print("[!] GEMINI_API_KEY not set in agent/.env.")
    except ImportError:
        print("[!] google-genai package not found. Run with `uv run --with google-genai`.")

    user_id = "1"
    active_model = MODEL_NAME
    chat = None

    if client:
        try:
            print("[*] Pre-compiling Digital Twin context...")
            chat = create_chat_session(client, active_model, user_id)
            print(f"[✓] Care Coach is ready on {active_model}! Type your message below.\n")
        except Exception as e:
            print(f"[!] Error initializing chat session on {active_model}: {e}")
            # Try fast lite model if initial model had issues
            try:
                active_model = "gemini-3.5-flash-lite"
                chat = create_chat_session(client, active_model, user_id)
                print(f"[✓] Connected on fallback model {active_model}!\n")
            except Exception as e2:
                print(f"[!] Fallback initialization error: {e2}\n")

    # Fallback models in priority order
    fallback_models = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]

    while True:
        try:
            user_input = input("User > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting...")
            break

        if not user_input:
            continue

        if user_input.lower() in ("/exit", "exit", "quit"):
            print("Goodbye!")
            break

        if user_input.lower() == "/context":
            print("\n--- Injected Dynamic Health Context ---")
            print(build_additional_context(user_id))
            print("--------------------------------------\n")
            continue

        if user_input.lower() == "/ltm":
            print("\n--- Long-Term Memory Profile ---")
            print(get_long_term_memory(user_id) or "(Empty)")
            print("--------------------------------\n")
            continue

        if user_input.lower() == "/stm":
            print("\n--- Active Short-Term Memory ---")
            print(get_short_term_memory(user_id) or "(Empty)")
            print("--------------------------------\n")
            continue

        if not client:
            print("[Coach] (Offline): Set GEMINI_API_KEY in agent/.env for live dialogue.\n")
            continue

        spinner = ThinkingSpinner()
        spinner.start()

        response_text = None
        last_error = None
        models_to_try = [active_model] + [m for m in fallback_models if m != active_model]

        for model_candidate in models_to_try:
            try:
                if chat is None or model_candidate != active_model:
                    spinner.stop()
                    print(f"\n[*] Connecting to model '{model_candidate}'...")
                    spinner = ThinkingSpinner(f"Retrying on {model_candidate}")
                    spinner.start()
                    chat = create_chat_session(client, model_candidate, user_id)
                    active_model = model_candidate

                response = chat.send_message(user_input)
                response_text = response.text
                break
            except Exception as e:
                last_error = e
                err_str = str(e)
                # If 503 unavailable or 429 quota, retry with next candidate
                if "503" in err_str or "UNAVAILABLE" in err_str or "429" in err_str:
                    time.sleep(1)
                    continue
                else:
                    break

        spinner.stop()
        if response_text:
            print(f"\nCare Coach > {response_text}\n")
        else:
            print(f"\n[Error generating response]: {last_error}\n")


if __name__ == "__main__":
    main()
