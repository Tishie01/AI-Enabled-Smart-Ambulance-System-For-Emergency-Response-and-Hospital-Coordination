require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const setupIO = require('./io');

const ambulanceRoutes = require('./routes/ambulance');
const guardianRoutes = require('./routes/guardian');
const predictionRoutes = require('./routes/prediction');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/ambulance', ambulanceRoutes);
app.use('/api/guardian', guardianRoutes);
app.use('/api/prediction', predictionRoutes);

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });
setupIO(io);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/ambulance', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>{
    server.listen(PORT, ()=>console.log('Server listening on', PORT));
  })
  .catch(err=>{ console.error('Mongo connect error', err); process.exit(1);} );

app.get('/', (req,res)=>res.json({ok:true}));
