from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Optional

from pydantic import BaseModel
from sqlmodel import Field, Relationship, SQLModel


class Project(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    budget: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    tasks: list["Task"] = Relationship(back_populates="project")


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    name: str
    duration_days: int = Field(default=1, ge=1)

    planned_start_date: Optional[date] = None
    planned_finish_date: Optional[date] = None

    cost_planned: float = 0.0
    cost_actual: float = 0.0
    percent_complete: float = Field(default=0.0, ge=0.0, le=100.0)

    notes: Optional[str] = None

    project: Optional[Project] = Relationship(back_populates="tasks")


class TaskDependency(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    predecessor_id: int = Field(foreign_key="task.id")
    successor_id: int = Field(foreign_key="task.id")


class TaskSchedule(BaseModel):
    task_id: int
    early_start: date
    early_finish: date
    late_start: date
    late_finish: date
    total_float_days: int
    is_critical: bool


class ProjectSchedule(BaseModel):
    project_id: int
    start_date: date
    finish_date: date
    critical_path_task_ids: list[int]