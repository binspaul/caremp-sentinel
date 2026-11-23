from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseBaselineRepository(ABC):
    """
    Abstract interface for retrieving and saving baseline tracking states.
    Can be subclassed in the future for PostgreSQL or other persistent stores.
    """

    @abstractmethod
    def get_baselines_for_resident(self, resident_id: int) -> Dict[str, Any]:
        """
        Retrieves the baseline dictionary state for a specific resident.

        Returns:
            A dict mapping metric names to their current EWMA state, e.g.:
            {
               "heart_rate": {"baseline": 72.5, "mad": 5.0},
               ...
            }
        """
        pass

    @abstractmethod
    def save_baselines_for_resident(self, resident_id: int, baselines: Dict[str, Any]) -> None:
        """
        Saves or updates the baseline state dictionary for a specific resident.
        """
        pass


class InMemoryBaselineRepository(BaseBaselineRepository):
    """
    In-memory implementation of the baseline repository.
    Keeps states partitioned by resident_id in a Python dict.
    """

    def __init__(self):
        # Maps resident_id (int) -> dict of metric baseline states
        self._store: Dict[int, Dict[str, Any]] = {}

    def get_baselines_for_resident(self, resident_id: int) -> Dict[str, Any]:
        return self._store.get(resident_id, {})

    def save_baselines_for_resident(self, resident_id: int, baselines: Dict[str, Any]) -> None:
        self._store[resident_id] = baselines

    def clear(self) -> None:
        """Helper to clear stored states (useful in testing)."""
        self._store.clear()
