from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional, Sequence

# A trend is only called "Increasing"/"Decreasing" once the regression slope moves
# the value by more than this fraction of the window's mean per reading; anything
# smaller is noise and reported as "Stable".
DEFAULT_STABILITY_THRESHOLD = 0.01


@dataclass
class TrendResult:
    slope: float
    direction: str
    first_value: float
    last_value: float
    absolute_change: float
    percentage_change: Optional[float]
    strength: float


def _fit_line(x_vals: Sequence[float], y_vals: Sequence[float]) -> Optional[tuple]:
    """
    Ordinary least-squares fit of y_vals against x_vals.
    Returns (slope, intercept), or None if a line can't be fit.
    """
    n = len(y_vals)
    if n < 2 or len(x_vals) != n:
        return None

    x_mean = sum(x_vals) / n
    y_mean = sum(y_vals) / n

    numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_vals, y_vals))
    denominator = sum((x - x_mean) ** 2 for x in x_vals)
    if denominator == 0:
        return None

    slope = numerator / denominator
    intercept = y_mean - slope * x_mean
    return slope, intercept


def _r_squared(x_vals: Sequence[float], y_vals: Sequence[float], slope: float, intercept: float) -> float:
    """
    Coefficient of determination for the fitted line, used as the trend's "strength":
    1.0 means the values fall perfectly on the trend line, 0.0 means no linear relationship.
    """
    n = len(y_vals)
    y_mean = sum(y_vals) / n
    ss_tot = sum((y - y_mean) ** 2 for y in y_vals)
    if ss_tot == 0:
        return 1.0

    ss_res = sum((y - (slope * x + intercept)) ** 2 for x, y in zip(x_vals, y_vals))
    return max(0.0, 1.0 - (ss_res / ss_tot))


def _clip_isolated_spikes(values: Sequence[float]) -> List[float]:
    """
    Outlier-resistant filter: suppresses transient single-reading spikes
    (e.g., wrist motion artifacts) from heavily skewing the regression slope.
    """
    n = len(values)
    if n < 3:
        return list(values)

    sorted_vals = sorted(values)
    median = sorted_vals[n // 2]
    mad = sorted(abs(v - median) for v in values)[n // 2]
    # Floor MAD to prevent clipping flat signals
    mad = max(1.0, mad)

    clipped = []
    for v in values:
        if abs(v - median) > 3.5 * mad:
            # Clip spike toward median +/- 3.5*MAD
            clipped_val = median + 3.5 * mad if v > median else median - 3.5 * mad
            clipped.append(clipped_val)
        else:
            clipped.append(v)
    return clipped


def compute_trend(
    values: Sequence[float],
    timestamps: Optional[Sequence[Optional[datetime]]] = None,
    stability_threshold: float = DEFAULT_STABILITY_THRESHOLD
) -> Optional[TrendResult]:
    """
    Fits a linear regression over a rolling window of values and derives
    direction, magnitude, and strength from it.
    
    If timestamps are provided, x is derived as elapsed minutes from the first reading.
    Otherwise, evenly-spaced index steps (0..n-1) are used for x.
    """
    n = len(values)
    if n < 2:
        return None

    # Apply outlier suppression for motion spikes
    clean_values = _clip_isolated_spikes(values)

    # Determine x values (either true elapsed minutes or discrete indices)
    if timestamps and len(timestamps) == n and all(isinstance(t, datetime) for t in timestamps):
        t0 = timestamps[0]
        x_vals = [(t - t0).total_seconds() / 60.0 for t in timestamps]
        # Avoid degenerate case where all readings have the exact same timestamp
        if x_vals[-1] == 0:
            x_vals = list(range(n))
    else:
        x_vals = list(range(n))

    fit = _fit_line(x_vals, clean_values)
    if fit is None:
        return None
    slope, intercept = fit

    mean_value = sum(clean_values) / n
    scale = abs(mean_value) if abs(mean_value) > 1e-9 else 1.0
    relative_slope = slope / scale

    if relative_slope > stability_threshold:
        direction = "Increasing"
    elif relative_slope < -stability_threshold:
        direction = "Decreasing"
    else:
        direction = "Stable"

    first_value = clean_values[0]
    last_value = clean_values[-1]
    absolute_change = last_value - first_value
    percentage_change = (absolute_change / first_value * 100.0) if first_value != 0 else None

    strength = _r_squared(x_vals, clean_values, slope, intercept)

    return TrendResult(
        slope=slope,
        direction=direction,
        first_value=first_value,
        last_value=last_value,
        absolute_change=absolute_change,
        percentage_change=percentage_change,
        strength=strength
    )
