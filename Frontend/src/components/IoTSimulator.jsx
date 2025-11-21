import React from 'react'
import { io } from 'socket.io-client'

export default function IoTSimulator({ sessionId }) {
  const [running, setRunning] = React.useState(false);
  const socketRef = React.useRef(null);
  const intervalRef = React.useRef(null);

  React.useEffect(() => {
    socketRef.current = io('http://localhost:4000');
    socketRef.current.emit('joinSession', { sessionId, role: 'iot' });
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionId]);

  function start() {
    setRunning(true);
    intervalRef.current = setInterval(() => {
      const point = {
        heartRate: Math.floor(60 + Math.random() * 40),
        bodyTemperature: (36 + Math.random() * 2).toFixed(1),
        bloodOxygen: Math.floor(92 + Math.random() * 8),
        timestamp: new Date()
      };
      if (socketRef.current) {
        socketRef.current.emit('health:update', { sessionId, point });
      }
    }, 3000);
  }

  function stop() {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  return (
    <div className="border p-4 rounded mt-4">
      <h3 className="font-semibold mb-2">IoT Simulator</h3>
      <p className="text-sm text-gray-600 mb-2">Simulates automatic health data every 3 seconds</p>
      {!running && <button onClick={start} className="px-4 py-2 bg-green-600 text-white rounded">Start IoT</button>}
      {running && <button onClick={stop} className="px-4 py-2 bg-red-600 text-white rounded">Stop IoT</button>}
    </div>
  );
}
