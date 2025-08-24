from __future__ import annotations

from collections import defaultdict, deque
from datetime import date, timedelta
from typing import Dict, Iterable, List, Tuple

from sqlmodel import select

from app.db import get_session
from app.models import Project, Task, TaskDependency, TaskSchedule, ProjectSchedule


class CycleError(Exception):
    pass


def _topological_order(task_ids: Iterable[int], edges: Dict[int, List[int]]) -> List[int]:
    indegree: Dict[int, int] = {t: 0 for t in task_ids}
    for u in edges:
        for v in edges[u]:
            indegree[v] += 1

    queue: deque[int] = deque([t for t in task_ids if indegree[t] == 0])
    order: List[int] = []
    while queue:
        u = queue.popleft()
        order.append(u)
        for v in edges[u]:
            indegree[v] -= 1
            if indegree[v] == 0:
                queue.append(v)

    if len(order) != len(list(task_ids)):
        raise CycleError("Task dependency graph has a cycle")
    return order


def _add_days(start: date, days: int) -> date:
    return start + timedelta(days=days)


def compute_cpm(project_id: int, persist_planned_dates: bool = True) -> Tuple[ProjectSchedule, Dict[int, TaskSchedule]]:
    with get_session() as session:
        project = session.get(Project, project_id)
        if not project or not project.start_date:
            raise ValueError("Project not found or project.start_date not set")

        tasks: List[Task] = list(session.exec(select(Task).where(Task.project_id == project_id)))
        deps: List[TaskDependency] = list(
            session.exec(select(TaskDependency).where(TaskDependency.project_id == project_id))
        )

        task_by_id: Dict[int, Task] = {t.id: t for t in tasks if t.id is not None}
        task_ids: List[int] = list(task_by_id.keys())

        successors: Dict[int, List[int]] = defaultdict(list)
        predecessors: Dict[int, List[int]] = defaultdict(list)
        for d in deps:
            successors[d.predecessor_id].append(d.successor_id)
            predecessors[d.successor_id].append(d.predecessor_id)

        order = _topological_order(task_ids, successors)

        es: Dict[int, date] = {}
        ef: Dict[int, date] = {}

        for tid in order:
            if not predecessors[tid]:
                es[tid] = project.start_date
            else:
                max_pred_ef = max(ef[p] for p in predecessors[tid])
                es[tid] = max_pred_ef
            duration = max(1, task_by_id[tid].duration_days)
            ef[tid] = _add_days(es[tid], duration)

        project_finish = max(ef.values()) if ef else project.start_date

        # Backward pass
        ls: Dict[int, date] = {}
        lf: Dict[int, date] = {}

        reverse_order = list(reversed(order))
        for tid in reverse_order:
            if not successors[tid]:
                lf[tid] = project_finish
            else:
                min_succ_ls = min(ls[s] for s in successors[tid])
                lf[tid] = min_succ_ls
            duration = max(1, task_by_id[tid].duration_days)
            ls[tid] = _add_days(lf[tid], -duration)

        schedule_by_task: Dict[int, TaskSchedule] = {}
        critical_path_ids: List[int] = []
        for tid in order:
            total_float = (ls[tid] - es[tid]).days
            is_critical = total_float == 0
            if is_critical:
                critical_path_ids.append(tid)
            schedule_by_task[tid] = TaskSchedule(
                task_id=tid,
                early_start=es[tid],
                early_finish=ef[tid],
                late_start=ls[tid],
                late_finish=lf[tid],
                total_float_days=total_float,
                is_critical=is_critical,
            )

        project_schedule = ProjectSchedule(
            project_id=project_id,
            start_date=project.start_date,
            finish_date=project_finish,
            critical_path_task_ids=critical_path_ids,
        )

        if persist_planned_dates:
            for tid, sched in schedule_by_task.items():
                t = task_by_id[tid]
                t.planned_start_date = sched.early_start
                t.planned_finish_date = sched.early_finish
            session.add_all(task_by_id.values())

        return project_schedule, schedule_by_task