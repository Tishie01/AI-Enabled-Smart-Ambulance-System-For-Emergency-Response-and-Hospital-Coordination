import socketio
from fastapi import FastAPI

# Create Socket.IO server
sio = socketio.AsyncServer(
    cors_allowed_origins=["http://localhost:3000"],
    async_mode='asgi'
)

# Create ASGI app for Socket.IO
sio_app = socketio.ASGIApp(sio)

@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f"Client disconnected: {sid}")

@sio.event
async def join_room(sid, data):
    """Join a room (e.g., hospital room)"""
    room = data.get('room')
    if room:
        sio.enter_room(sid, room)
        await sio.emit('joined_room', {'room': room}, room=sid)

@sio.event
async def leave_room(sid, data):
    """Leave a room"""
    room = data.get('room')
    if room:
        sio.leave_room(sid, room)
        await sio.emit('left_room', {'room': room}, room=sid)

# Real-time data events
@sio.event
async def vital_signs_update(sid, data):
    """Broadcast vital signs update"""
    room = data.get('room')
    if room:
        await sio.emit('vital_signs', data, room=room)

@sio.event
async def location_update(sid, data):
    """Broadcast ambulance location update"""
    room = data.get('room')
    if room:
        await sio.emit('location', data, room=room)

