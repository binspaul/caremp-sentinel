from abc import ABC, abstractmethod
from typing import Any, Dict
from .models import VitalReading

class BaseEngine(ABC):
    """
    Abstract base class for all analytical engines.
    Every engine processes vital readings and returns updated state metrics.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable identifier for the engine."""
        pass

    @abstractmethod
    def process_reading(self, reading: VitalReading) -> Dict[str, Any]:
        """
        Processes a single VitalReading and computes analytics/state updates.
        """
        pass
