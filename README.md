# Real Estate Project Planning App

An MVP application to plan real estate projects, estimate cost, compute schedules (CPM), and flag delays.

## Features
- Create projects and tasks
- Define task dependencies
- Compute CPM schedule (critical path, floats, end date)
- Cost estimation (planned vs budget)
- Delay alerts and simple Gantt timeline

## Tech Stack
- Python, Streamlit UI
- SQLModel + SQLite for persistence
- Plotly for timeline chart

## Setup
```bash
python -m venv .venv && source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Run
```bash
streamlit run app/main.py --server.headless true --server.port 8501
```

Open the app at http://localhost:8501 (port may vary if already in use).

## Project Structure
```
app/
  main.py
  db.py
  models.py
  services/
    __init__.py
    schedule.py
    costs.py
    alerts.py
```