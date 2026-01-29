# app/core/scoring_utils.py
from typing import List
import math

def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))

def percentile_midrank(values_sorted: List[float], x: float) -> float:
    n = len(values_sorted)
    lt = 0
    eq = 0
    for v in values_sorted:
        if v < x:
            lt += 1
        elif v == x:
            eq += 1
    p = (lt + 0.5 * eq) / n
    eps = 0.5 / n
    if p < eps: p = eps
    if p > 1 - eps: p = 1 - eps
    return p

def stretch(p: float, k: float = 2.2) -> float:
    return max(0.0, min(1.0, 0.5 + (p - 0.5) * k))

def match_from_percentile(p: float, floor: int = 55, ceil: int = 99, gamma: float = 1.6) -> int:
    p = max(0.0, min(1.0, p))
    shaped = p ** gamma
    score = floor + (ceil - floor) * shaped
    return int(round(max(0, min(100, score))))
