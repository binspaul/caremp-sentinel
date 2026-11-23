from abc import ABC, abstractmethod
from collections import deque
from typing import Deque, Dict, List


class BaseCorrelationRepository(ABC):
    """
    Abstract interface for storing rolling windows of per-reading metric
    snapshots, keyed by resident.
    """

    @abstractmethod
    def add_reading(self, resident_id: int, values: Dict[str, float], max_size: int) -> List[Dict[str, float]]:
        """
        Appends one reading's snapshot of metric values to the resident's
        rolling window, evicting the oldest reading once max_size is exceeded.
        """
        pass

    @abstractmethod
    def get_window(self, resident_id: int) -> List[Dict[str, float]]:
        """
        Retrieves the current rolling window (oldest to newest) without modifying it.
        """
        pass


class InMemoryCorrelationRepository(BaseCorrelationRepository):
    """
    In-memory implementation of the correlation repository. Keeps one bounded
    deque of reading snapshots per resident.
    """

    def __init__(self):
        self._windows: Dict[int, Deque[Dict[str, float]]] = {}

    def add_reading(self, resident_id: int, values: Dict[str, float], max_size: int) -> List[Dict[str, float]]:
        window = self._windows.get(resident_id)

        if window is None or window.maxlen != max_size:
            existing = list(window) if window is not None else []
            window = deque(existing[-max_size:], maxlen=max_size)
            self._windows[resident_id] = window

        window.append(values)
        return list(window)

    def get_window(self, resident_id: int) -> List[Dict[str, float]]:
        window = self._windows.get(resident_id)
        return list(window) if window is not None else []

    def clear(self) -> None:
        """Helper to clear stored windows (useful in testing)."""
        self._windows.clear()
