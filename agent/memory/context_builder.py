"""
Context Builder Service for Care Coach Agent

Combines Digital Twin State, Long-Term Memory, and Short-Term Memory into a single
structured context block before every conversation turn.
"""
from typing import Optional
from ..api_client import api_client, parse_resident_id


def get_long_term_memory(user_id: Optional[str] = None) -> str:
    """Retrieves long-term memory string."""
    res_id = parse_resident_id(user_id) if user_id else 1
    data = api_client.get_long_term_memory(res_id)
    if not data or not data.get("memoryText"):
        return ""
    return data["memoryText"].strip()


def get_short_term_memory(user_id: Optional[str] = None) -> str:
    """Retrieves active short-term memory string."""
    res_id = parse_resident_id(user_id) if user_id else 1
    data = api_client.get_short_term_memory(res_id)
    if not data or data.get("isExpired") or not data.get("memoryText"):
        return ""
    return data["memoryText"].strip()


def build_additional_context(user_id: str) -> str:
    """
    Constructs the dynamic context block sent to the LLM before every turn.

    Args:
        user_id: The unique ID of the user requesting context.

    Returns:
        Formatted markdown context string containing Twin State, Long-Term Memory,
        and Short-Term Memory.
    """
    resident_id = parse_resident_id(user_id)

    twin = api_client.get_digital_twin(resident_id)
    long_term = get_long_term_memory(user_id)
    short_term = get_short_term_memory(user_id)

    return f"""## Current Digital Twin State
{twin}

## Long-Term Memory Profile
{long_term if long_term else "No persistent long-term memory recorded yet."}

## Short-Term Memory (Acute / Recent Context)
{short_term if short_term else "No active temporary memories."}"""
