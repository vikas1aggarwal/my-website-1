from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

from sqlmodel import select

from db import get_session
from models import Project, Task


@dataclass
class ProjectCostSummary:
    project_id: int
    planned_cost: float
    actual_cost: float
    variance: float
    cpi: float  # Cost Performance Index (EV/AC); use planned as EV proxy in MVP


def get_project_costs(project_id: int) -> ProjectCostSummary:
    with get_session() as session:
        project = session.get(Project, project_id)
        if not project:
            raise ValueError("Project not found")

        tasks = list(session.exec(select(Task).where(Task.project_id == project_id)))
        planned = sum(t.cost_planned for t in tasks)
        actual = sum(t.cost_actual for t in tasks)
        variance = actual - planned
        cpi = (planned / actual) if actual > 0 else 0.0

        return ProjectCostSummary(
            project_id=project_id,
            planned_cost=planned,
            actual_cost=actual,
            variance=variance,
            cpi=cpi,
        )