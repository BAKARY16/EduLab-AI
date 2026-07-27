"""Generate a privacy-safe, reproducible learner analytics dataset.

The generated rows are synthetic and must never be presented as real pupils.
They mirror EduLab's operational schema so the analysis can later consume an
anonymised Supabase export without changing the business workflow.
"""
from __future__ import annotations

import csv
import hashlib
import math
import random
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "synthetic" / "student_learning_analytics.csv"
SEED = 20260727
LEARNERS = 300
ACTIVITIES_PER_LEARNER = 8
GRADES = ["3e", "Terminale C", "Terminale D"]
SUBJECTS = ["Mathématiques", "Physique-Chimie", "SVT"]
ACTIVITY_TYPES = ["course", "exercise", "exam", "laboratory"]
LEARNING_STYLES = ["visuel", "auditif", "pratique"]
CONNECTIVITY = ["faible", "moyenne", "bonne"]


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def learner_hash(index: int) -> str:
    return "ELV-" + hashlib.sha256(f"edulab-{SEED}-{index}".encode()).hexdigest()[:10]


def generate_rows() -> list[dict[str, object]]:
    rng = random.Random(SEED)
    start = date(2026, 1, 5)
    rows: list[dict[str, object]] = []
    for learner_index in range(LEARNERS):
        learner_id = learner_hash(learner_index)
        grade = rng.choice(GRADES)
        learning_style = rng.choice(LEARNING_STYLES)
        connectivity = rng.choices(CONNECTIVITY, weights=[0.22, 0.43, 0.35], k=1)[0]
        baseline = clamp(rng.gauss(0.56, 0.16), 0.12, 0.93)
        regularity = clamp(rng.gauss(0.63, 0.2))
        for activity_index in range(ACTIVITIES_PER_LEARNER):
            subject = SUBJECTS[(learner_index + activity_index) % len(SUBJECTS)]
            activity_type = rng.choices(ACTIVITY_TYPES, weights=[0.3, 0.4, 0.15, 0.15], k=1)[0]
            event_date = start + timedelta(days=activity_index * rng.randint(3, 8) + rng.randint(0, 4))
            connectivity_penalty = {"faible": 0.09, "moyenne": 0.03, "bonne": 0.0}[connectivity]
            subject_shift = {"Mathématiques": -0.035, "Physique-Chimie": -0.015, "SVT": 0.025}[subject]
            mastery_before = clamp(baseline + subject_shift + rng.gauss(0, 0.08))
            attempts = max(1, min(6, int(round(3.8 - mastery_before * 3 + rng.gauss(0, 0.8)))))
            hints_used = max(0, min(5, int(round(3.2 - mastery_before * 3 + rng.gauss(0, 0.7)))))
            session_minutes = max(4, int(rng.gauss(24 + attempts * 3, 8)))
            accuracy = clamp(mastery_before + 0.05 * math.log1p(session_minutes) - 0.035 * hints_used - connectivity_penalty + rng.gauss(0, 0.07))
            gain = 0.04 + 0.1 * accuracy + (0.025 if activity_type == "laboratory" else 0) - 0.012 * hints_used
            mastery_after = clamp(mastery_before + gain + rng.gauss(0, 0.025))
            inactivity_days = max(0, int(rng.expovariate(1 / max(2, 16 - regularity * 12))))
            completed = rng.random() < clamp(0.45 + 0.45 * accuracy + 0.12 * regularity - connectivity_penalty)
            needs_remediation = mastery_after < 0.60 or accuracy < 0.55 or inactivity_days >= 14
            rows.append(
                {
                    "learner_id": learner_id,
                    "event_date": event_date.isoformat(),
                    "grade": grade,
                    "subject": subject,
                    "activity_type": activity_type,
                    "learning_style": learning_style,
                    "connectivity": connectivity,
                    "session_minutes": session_minutes,
                    "attempts": attempts,
                    "hints_used": hints_used,
                    "accuracy": round(accuracy, 4),
                    "mastery_before": round(mastery_before, 4),
                    "mastery_after": round(mastery_after, 4),
                    "inactivity_days": inactivity_days,
                    "completed": int(completed),
                    "needs_remediation": int(needs_remediation),
                    "origin": "synthetic",
                }
            )
    return rows


def main() -> None:
    rows = generate_rows()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(f"Generated {len(rows)} synthetic rows in {OUTPUT}")


if __name__ == "__main__":
    main()
