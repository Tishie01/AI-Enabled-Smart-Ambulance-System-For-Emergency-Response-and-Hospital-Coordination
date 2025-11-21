const Session = require('./models/Session');

function setupIO(io){
  io.on('connection', socket=>{
    console.log('socket connected', socket.id);

    socket.on('joinSession', async ({sessionId, role})=>{
      socket.join(sessionId);
      console.log('joined', sessionId, role);
    });

    socket.on('health:update', async ({sessionId, point})=>{
      const s = await Session.findById(sessionId);
      if (!s) return;
      s.healthPoints.push(point);
      await s.save();
      io.to(sessionId).emit('health:update', point);
    });

    socket.on('chat:send', async ({sessionId, sender, text})=>{
      const s = await Session.findById(sessionId);
      if (!s) return;
      const msg = { sender, text, timestamp: new Date() };
      s.chat.push(msg);
      await s.save();
      io.to(sessionId).emit('chat:message', msg);
    });

    socket.on('status:update', async ({sessionId, status})=>{
      const s = await Session.findById(sessionId);
      if (!s) return;
      s.status = status;
      if (status === 'arriving') s.endedAt = new Date();
      await s.save();
      io.to(sessionId).emit('status:changed', {status});
    });

  });
}

module.exports = setupIO;
