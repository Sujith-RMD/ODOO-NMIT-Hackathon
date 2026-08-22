from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.database import Base, engine
from app.routers import auth, employees, attendance, time_off, salary, notifications, profile
import os

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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create an API Router to namespace all backend routes under /api
api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(employees.router)
api_router.include_router(attendance.router)
api_router.include_router(time_off.router)
api_router.include_router(salary.router)
api_router.include_router(notifications.router)
api_router.include_router(profile.router)

@api_router.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Include the API router in the main app
app.include_router(api_router)

# Mount the frontend 'dist' directory
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")

if os.path.exists(frontend_dist):
    # Mount assets and static files
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    # Serve index.html for all other non-API routes (SPA routing support)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Ignore API routes to let them 404 naturally
        if full_path.startswith("api/"):
            return {"error": "Not found"}
        
        # Check if requesting a specific file in dist (like favicon.ico)
        possible_file = os.path.join(frontend_dist, full_path)
        if os.path.isfile(possible_file):
            return FileResponse(possible_file)
            
        # Otherwise, serve index.html for React Router
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)