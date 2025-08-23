from __future__ import annotations

import pandas as pd
import plotly.express as px
import streamlit as st
from datetime import date
from sqlmodel import select

from app.db import init_db, get_session
from app.models import Project, Task, TaskDependency
from app.services.schedule import compute_cpm
from app.services.costs import get_project_costs
from app.services.alerts import get_alerts


st.set_page_config(page_title="Project Planner", layout="wide")
init_db()

st.title("Real Estate Project Planning")

# Sidebar: Project selector and creator
with st.sidebar:
    st.header("Projects")
    with get_session() as session:
        projects = list(session.exec(select(Project)))
    project_names = [f"{p.id} - {p.name}" for p in projects]

    selected_project_label = st.selectbox("Select project", ["<Create new>"] + project_names)

    if selected_project_label == "<Create new>":
        with st.form("create_project"):
            name = st.text_input("Project name")
            description = st.text_area("Description", height=80)
            start_date = st.date_input("Start date", value=date.today())
            budget = st.number_input("Budget", min_value=0.0, step=1000.0, value=0.0)
            submitted = st.form_submit_button("Create")
        if submitted and name:
            with get_session() as session:
                p = Project(name=name, description=description, start_date=start_date, budget=budget)
                session.add(p)
            st.rerun()
        current_project_id = None
    else:
        current_project_id = int(selected_project_label.split(" - ", 1)[0])

if not current_project_id:
    st.info("Create or select a project to begin.")
    st.stop()

# Load current project data
with get_session() as session:
    project = session.get(Project, current_project_id)
    tasks = list(session.exec(select(Task).where(Task.project_id == current_project_id)))
    deps = list(session.exec(select(TaskDependency).where(TaskDependency.project_id == current_project_id)))

# Tabs for CRUD and views
tab_tasks, tab_deps, tab_schedule, tab_costs, tab_alerts = st.tabs([
    "Tasks", "Dependencies", "Schedule", "Costs", "Alerts"
])

with tab_tasks:
    st.subheader("Tasks")

    # Task creation form
    with st.form("create_task"):
        c1, c2, c3, c4 = st.columns(4)
        name = c1.text_input("Name")
        duration = c2.number_input("Duration (days)", min_value=1, step=1, value=5)
        cost_planned = c3.number_input("Planned Cost", min_value=0.0, step=1000.0)
        cost_actual = c4.number_input("Actual Cost", min_value=0.0, step=1000.0)
        c5, c6 = st.columns(2)
        percent_complete = c5.slider("% Complete", 0.0, 100.0, 0.0, 1.0)
        notes = c6.text_input("Notes")
        submitted = st.form_submit_button("Add Task")
    if submitted and name:
        with get_session() as session:
            t = Task(
                project_id=current_project_id,
                name=name,
                duration_days=int(duration),
                cost_planned=float(cost_planned),
                cost_actual=float(cost_actual),
                percent_complete=float(percent_complete),
                notes=notes or None,
            )
            session.add(t)
        st.rerun()

    # Existing tasks table with inline edits
    if tasks:
        df = pd.DataFrame([
            {
                "id": t.id,
                "name": t.name,
                "duration_days": t.duration_days,
                "planned_start_date": t.planned_start_date,
                "planned_finish_date": t.planned_finish_date,
                "cost_planned": t.cost_planned,
                "cost_actual": t.cost_actual,
                "percent_complete": t.percent_complete,
                "notes": t.notes,
            }
            for t in tasks
        ])
        st.dataframe(df, use_container_width=True, height=250)

        with st.expander("Edit or delete a task"):
            task_ids = [t.id for t in tasks]
            edit_id = st.selectbox("Task", task_ids)
            t = next(t for t in tasks if t.id == edit_id)
            col1, col2, col3 = st.columns(3)
            name = col1.text_input("Name", value=t.name)
            duration_days = col2.number_input("Duration (days)", min_value=1, step=1, value=int(t.duration_days))
            percent = col3.slider("% Complete", 0.0, 100.0, float(t.percent_complete), 1.0)
            col4, col5 = st.columns(2)
            cost_planned = col4.number_input("Planned Cost", min_value=0.0, step=1000.0, value=float(t.cost_planned))
            cost_actual = col5.number_input("Actual Cost", min_value=0.0, step=1000.0, value=float(t.cost_actual))
            notes = st.text_input("Notes", value=t.notes or "")
            c1, c2 = st.columns(2)
            if c1.button("Save changes"):
                with get_session() as session:
                    ut = session.get(Task, edit_id)
                    ut.name = name
                    ut.duration_days = int(duration_days)
                    ut.percent_complete = float(percent)
                    ut.cost_planned = float(cost_planned)
                    ut.cost_actual = float(cost_actual)
                    ut.notes = notes or None
                st.success("Saved")
                st.rerun()
            if c2.button("Delete task"):
                with get_session() as session:
                    dt = session.get(Task, edit_id)
                    session.delete(dt)
                st.warning("Deleted")
                st.rerun()
    else:
        st.info("No tasks yet. Add the first task above.")

with tab_deps:
    st.subheader("Dependencies")
    if not tasks:
        st.info("Add tasks first to create dependencies.")
    else:
        task_options = {f"{t.id}: {t.name}": t.id for t in tasks}
        with st.form("add_dep"):
            c1, c2 = st.columns(2)
            pred_label = c1.selectbox("Predecessor", list(task_options.keys()))
            succ_label = c2.selectbox("Successor", list(task_options.keys()))
            submitted = st.form_submit_button("Add Dependency")
        if submitted:
            pred_id = task_options[pred_label]
            succ_id = task_options[succ_label]
            if pred_id == succ_id:
                st.error("A task cannot depend on itself.")
            else:
                with get_session() as session:
                    session.add(TaskDependency(project_id=current_project_id, predecessor_id=pred_id, successor_id=succ_id))
                st.rerun()

        if deps:
            df_deps = pd.DataFrame([
                {"id": d.id, "predecessor_id": d.predecessor_id, "successor_id": d.successor_id}
                for d in deps
            ])
            st.dataframe(df_deps, use_container_width=True, height=200)

            del_id = st.selectbox("Delete dependency", [None] + [d.id for d in deps])
            if del_id and st.button("Delete selected"):
                with get_session() as session:
                    dd = session.get(TaskDependency, del_id)
                    session.delete(dd)
                st.rerun()
        else:
            st.info("No dependencies added yet.")

with tab_schedule:
    st.subheader("Schedule & Critical Path")
    if st.button("Compute Schedule (CPM)"):
        try:
            project_schedule, sched_map = compute_cpm(current_project_id)
            st.success(f"Finish date: {project_schedule.finish_date}")
        except Exception as e:
            st.error(str(e))
            sched_map = None
            project_schedule = None
        if sched_map:
            df_sched = pd.DataFrame([
                {
                    "task_id": s.task_id,
                    "early_start": s.early_start,
                    "early_finish": s.early_finish,
                    "late_start": s.late_start,
                    "late_finish": s.late_finish,
                    "total_float_days": s.total_float_days,
                    "is_critical": s.is_critical,
                }
                for s in sched_map.values()
            ])
            st.dataframe(df_sched, use_container_width=True, height=280)

            # Simple Gantt
            gantt_df = df_sched.merge(
                pd.DataFrame([{ "id": t.id, "name": t.name } for t in tasks]),
                left_on="task_id", right_on="id", how="left"
            )
            gantt_df["Start"] = gantt_df["early_start"]
            gantt_df["Finish"] = gantt_df["early_finish"]
            fig = px.timeline(gantt_df, x_start="Start", x_end="Finish", y="name", color="is_critical", title="Timeline")
            fig.update_yaxes(autorange="reversed")
            st.plotly_chart(fig, use_container_width=True)

with tab_costs:
    st.subheader("Costs")
    try:
        summary = get_project_costs(current_project_id)
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Planned", f"${summary.planned_cost:,.0f}")
        c2.metric("Actual", f"${summary.actual_cost:,.0f}")
        c3.metric("Variance", f"${summary.variance:,.0f}", delta=f"{summary.variance:,.0f}")
        c4.metric("CPI", f"{summary.cpi:.2f}")
    except Exception as e:
        st.error(str(e))

with tab_alerts:
    st.subheader("Alerts")
    alerts = get_alerts(current_project_id)
    for a in alerts:
        if a.level == "CRITICAL":
            st.error(a.message)
        elif a.level == "WARNING":
            st.warning(a.message)
        else:
            st.info(a.message)