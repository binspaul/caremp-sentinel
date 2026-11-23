from dataclasses import dataclass
from typing import Optional, Sequence

# |r| below this is treated as no meaningful linear relationship.
NO_CORRELATION_THRESHOLD = 0.1

# Strength buckets based on Evans (1996) correlation guidelines:
# 0.1 - 0.39: Weak
# 0.4 - 0.59: Moderate
# 0.6 - 1.0:  Strong
WEAK_THRESHOLD = 0.4
MODERATE_THRESHOLD = 0.6


@dataclass
class CorrelationResult:
    coefficient: float
    direction: str
    strength: str


def _pearson(x: Sequence[float], y: Sequence[float]) -> Optional[float]:
    """
    Pearson product-moment correlation coefficient between two equal-length,
    paired series. Returns None if there aren't enough points or either series
    has zero variance (a correlation is undefined against a constant series).
    """
    n = len(x)
    if n < 2 or len(y) != n:
        return None

    x_mean = sum(x) / n
    y_mean = sum(y) / n

    numerator = sum((xi - x_mean) * (yi - y_mean) for xi, yi in zip(x, y))
    x_var = sum((xi - x_mean) ** 2 for xi in x)
    y_var = sum((yi - y_mean) ** 2 for yi in y)
    denominator = (x_var * y_var) ** 0.5

    if denominator == 0:
        return None

    # Clamp for floating-point drift that can push |r| fractionally past 1.0
    return max(-1.0, min(1.0, numerator / denominator))


def _direction(r: float) -> str:
    if abs(r) < NO_CORRELATION_THRESHOLD:
        return "None"
    return "Positive" if r > 0 else "Negative"


def _strength(r: float) -> str:
    magnitude = abs(r)
    if magnitude < WEAK_THRESHOLD:
        return "Weak"
    elif magnitude < MODERATE_THRESHOLD:
        return "Moderate"
    else:
        return "Strong"


def compute_correlation(x: Sequence[float], y: Sequence[float]) -> Optional[CorrelationResult]:
    """
    Computes the Pearson correlation between two paired series and derives a
    direction and strength label from it. Returns None if a coefficient can't
    be computed (too few points, or a constant series).
    """
    r = _pearson(x, y)
    if r is None:
        return None

    return CorrelationResult(
        coefficient=r,
        direction=_direction(r),
        strength=_strength(r)
    )
