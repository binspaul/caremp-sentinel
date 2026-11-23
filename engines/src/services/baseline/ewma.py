from typing import Optional

class EWMABaseline:
    """
    Exponentially Weighted Moving Average (EWMA) with adaptive spike filtering
    and time-delta awareness.

    Formula:
      Baseline: S_t = alpha_eff * Y_clipped + (1 - alpha_eff) * S_{t-1}
      Mean Absolute Deviation (MAD): D_t = beta_eff * |Y_clipped - S_{t-1}| + (1 - beta_eff) * D_{t-1}

    Where:
      alpha_eff = 1 - (1 - alpha)^(dt / 60)
      If dt = 60s, alpha_eff = alpha exactly.

    If the absolute deviation of a new value exceeds k * MAD, it is treated as a spike
    and clipped to S_{t-1} +/- k * MAD to prevent it from heavily distorting the baseline.
    """

    def __init__(self, alpha: float = 0.1, beta: float = 0.1, k: float = 3.0):
        self.alpha = alpha
        self.beta = beta
        self.k = k
        self.baseline: Optional[float] = None
        self.mad: Optional[float] = None

    def update(self, value: Optional[float], dt_seconds: float = 60.0) -> Optional[float]:
        """
        Updates the EWMA baseline with a new value.
        Ignores None values and filters out spikes.

        Returns:
            The updated baseline value, or the current baseline if input is None.
        """
        if value is None:
            return self.baseline

        # If it's the first reading, initialize baseline and MAD
        if self.baseline is None:
            self.baseline = float(value)
            # Initialize MAD with a default fraction of the starting value to prevent zero division.
            # Uses a minimum of 1.0 to handle values at or near zero.
            self.mad = max(1.0, abs(float(value)) * 0.1)
            return self.baseline

        # Detect and filter spikes
        diff = abs(value - self.baseline)
        if diff > self.k * self.mad:
            # Value is a spike; clip it
            if value > self.baseline:
                clipped_value = self.baseline + (self.k * self.mad)
            else:
                clipped_value = self.baseline - (self.k * self.mad)
        else:
            clipped_value = float(value)

        # Time-delta adjusted smoothing factor
        # When dt = 60 seconds (standard cadence), factor = 1.0 and alpha_eff = self.alpha
        dt_factor = max(0.1, min(1440.0, dt_seconds / 60.0))
        alpha_eff = 1.0 - (1.0 - self.alpha) ** dt_factor
        beta_eff = 1.0 - (1.0 - self.beta) ** dt_factor

        # Update baseline
        old_baseline = self.baseline
        self.baseline = alpha_eff * clipped_value + (1.0 - alpha_eff) * old_baseline

        # Update MAD (Mean Absolute Deviation)
        current_diff = abs(clipped_value - old_baseline)
        self.mad = beta_eff * current_diff + (1.0 - beta_eff) * self.mad

        return self.baseline
