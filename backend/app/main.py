from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, employees, attendance, time_off, salary, notifications, profile
from app.models import User, Employee, Attendance, TimeOffType, TimeOffRequest, TimeOffAllocation, SalaryStructure, SalaryComponent, Notification, Document

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DAYFLOW HRMS",
    description="Human Resource Management System - Every workday, perfectly aligned.",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(attendance.router)
app.include_router(time_off.router)
app.include_router(salary.router)
app.include_router(notifications.router)
app.include_router(profile.router)


@app.get("/")
def root():
    return {
        "name": "DAYFLOW HRMS",
        "tagline": "Every workday, perfectly aligned.",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)