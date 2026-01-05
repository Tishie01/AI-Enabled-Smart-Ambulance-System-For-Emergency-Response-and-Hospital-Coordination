from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from app.routes import api_router
from app.websocket import sio_app

# Create FastAPI app
app = FastAPI(
    title="Emergency Data Relay System API",
    description="Real-Time Emergency Data Relay System with Multi-Hospital Coordination",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

# Mount Socket.IO app
app.mount("/ws", sio_app)

@app.get("/")
async def root():
    return {"message": "Emergency Data Relay System API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

