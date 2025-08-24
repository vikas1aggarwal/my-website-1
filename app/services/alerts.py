from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import List

from sqlmodel import select

from db import get_session
from models import Project, Task


@dataclass
class Alert:
    level: str  # INFO, WARNING, CRITICAL
    message: str


def get_alerts(project_id: int) -> List[Alert]:
    today = date.today()
    alerts: List[Alert] = []

    with get_session() as session:
        project = session.get(Project, project_id)
        if not project:
            return [Alert(level="CRITICAL", message="Project not found")] 

        tasks = list(session.exec(select(Task).where(Task.project_id == project_id)))
        for t in tasks:
            if t.planned_finish_date and t.percent_complete < 100.0 and today > t.planned_finish_date:
                alerts.append(
                    Alert(
                        level="CRITICAL",
                        message=f"Task '{t.name}' is delayed past planned finish {t.planned_finish_date}",
                    )
                )
            if t.percent_complete < 100.0 and t.planned_start_date and today > t.planned_start_date:
                alerts.append(
                    Alert(
                        level="WARNING",
                        message=f"Task '{t.name}' should have started on {t.planned_start_date}",
                    )
                )

    if not alerts:
        alerts.append(Alert(level="INFO", message="No alerts. Project is on track."))
    return alerts