from abc import ABC, abstractmethod
from collections import deque
from datetime import datetime
from typing import Deque, Dict, List, Optional, Tuple, Union

# (resident_id, metric, window_name) -> rolling window of (timestamp, value)
WindowKey = Tuple[int, str, str]
WindowEntry = Tuple[Optional[datetime], float]


class BaseTrendRepository(ABC):
    """
    Abstract interface for storing and retrieving rolling windows of metric values.
    Can be subclassed in the future for a database- or cache-backed store.
    """

    @abstractmethod
    def add_reading(
        self,
        resident_id: int,
        metric: str,
        window_name: str,
        timestamp: Optional[datetime],
        value: float,
        max_size: int
    ) -> List[WindowEntry]:
        """
        Appends a (timestamp, value) reading to the named rolling window.
        """
        pass

    @abstractmethod
    def get_window_entries(self, resident_id: int, metric: str, window_name: str) -> List[WindowEntry]:
        """
        Retrieves the (timestamp, value) pairs ordered oldest to newest.
        """
        pass

    @abstractmethod
    def get_window(self, resident_id: int, metric: str, window_name: str) -> List[float]:
        """
        Retrieves just the raw float values (oldest to newest).
        """
        pass


class InMemoryTrendRepository(BaseTrendRepository):
    """
    In-memory implementation of the trend repository storing (timestamp, value) pairs.
    """

    def __init__(self):
        self._windows: Dict[WindowKey, Deque[WindowEntry]] = {}

    def add_reading(
        self,
        resident_id: int,
        metric: str,
        window_name: str,
        timestamp: Optional[datetime],
        value: float,
        max_size: int
    ) -> List[WindowEntry]:
        key = (resident_id, metric, window_name)
        window = self._windows.get(key)

        if window is None or window.maxlen != max_size:
            existing = list(window) if window is not None else []
            window = deque(existing[-max_size:], maxlen=max_size)
            self._windows[key] = window

        window.append((timestamp, float(value)))
        return list(window)

    def add_value(
        self,
        resident_id: int,
        metric: str,
        window_name: str,
        value: float,
        max_size: int
    ) -> List[float]:
        """Convenience method compatible with original signature."""
        self.add_reading(resident_id, metric, window_name, None, value, max_size)
        return self.get_window(resident_id, metric, window_name)

    def get_window_entries(self, resident_id: int, metric: str, window_name: str) -> List[WindowEntry]:
        key = (resident_id, metric, window_name)
        window = self._windows.get(key)
        return list(window) if window is not None else []

    def get_window(self, resident_id: int, metric: str, window_name: str) -> List[float]:
        entries = self.get_window_entries(resident_id, metric, window_name)
        return [val for _, val in entries]

    def clear(self) -> None:
        """Helper to clear stored windows (useful in testing)."""
        self._windows.clear()
