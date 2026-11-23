"""
Memory Management Tools for Care Coach Agent
"""
from typing import Optional
from ..config import MAX_STM_CHAR_LIMIT, DEFAULT_STM_TTL_DAYS
from ..api_client import api_client, parse_resident_id
from ..memory.compactor import compact_long_term_memory
from ..memory.context_builder import get_long_term_memory, get_short_term_memory


def update_short_term_memory(
    information: str,
    resident_id: int = 1,
    ttl_days: int = DEFAULT_STM_TTL_DAYS
) -> str:
    """
    Call this tool when the user mentions temporary or acute health info,
    current symptoms, travel plans, upcoming stressors, or recent recovery status.

    Args:
        information: The temporary situation or fact to remember (max 500 characters).
        resident_id: Integer ID of the resident (default 1).
        ttl_days: Number of days this information remains relevant.
                  MUST be determined strictly by the agent based on context
                  (e.g., 3 days for acute fever/headache, 7 days for travel, 14 days for recovery). Default is 7 days.
    """
    if not ttl_days or ttl_days <= 0:
        ttl_days = DEFAULT_STM_TTL_DAYS

    # Guardrail check against character limits
    if len(information) > MAX_STM_CHAR_LIMIT:
        return (
            f"ERROR: Short-term memory text exceeds the {MAX_STM_CHAR_LIMIT} character limit "
            f"(received {len(information)} characters). Please summarize concisely under "
            f"{MAX_STM_CHAR_LIMIT} characters and call `update_short_term_memory` again."
        )

    res_id = parse_resident_id(resident_id)
    api_client.save_short_term_memory(res_id, information.strip(), ttl_days=ttl_days)
    return f"Short-term memory recorded (TTL: {ttl_days} days) for resident #{res_id}: '{information.strip()}'"


def update_long_term_memory(
    information: str,
    resident_id: int = 1
) -> str:
    """
    Call this tool when the user mentions permanent health attributes,
    chronic medical conditions, allergies, dietary requirements, lifestyle routines, or long-term goals.

    Args:
        information: The permanent fact, preference, habit, or condition to remember.
        resident_id: Integer ID of the resident (default 1).
    """
    res_id = parse_resident_id(resident_id)

    # Retrieve existing long-term memory profile
    existing_ltm = get_long_term_memory(str(res_id))

    # Invoke Gemini compactor to synthesize and compact
    updated_ltm = compact_long_term_memory(existing_ltm, information)

    # Persist via API client (or mock store)
    api_client.save_long_term_memory(res_id, updated_ltm)
    return f"Long-term memory updated and compacted successfully for resident #{res_id}."
