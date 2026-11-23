from .mapper import (
    build_reading_from_twin,
    map_baselines,
    map_trends,
    map_correlations,
    map_healthy_ageing,
)

# Backwards compatibility alias
extract_vital_reading = build_reading_from_twin

__all__ = [
    "build_reading_from_twin",
    "extract_vital_reading",
    "map_baselines",
    "map_trends",
    "map_correlations",
    "map_healthy_ageing",
]
