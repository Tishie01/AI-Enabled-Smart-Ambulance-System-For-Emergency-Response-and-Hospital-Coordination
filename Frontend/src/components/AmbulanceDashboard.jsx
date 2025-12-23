import React from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'
import IoTSimulator from './IoTSimulator'

export default function AmbulanceDashboard({ ambulanceId, onLogout }){
  const [form, setForm] = React.useState({ambulanceId,paramedicName:'',paramedicId:'',patientName:'',patientAge:'',guardianNIC:'',guardianContact:'',mode:'automatic'});
  const [session, setSession] = React.useState(null);
  const [health, setHealth] = React.useState([]);
  const [chat, setChat] = React.useState([]);
  const [manualHealth, setManualHealth] = React.useState({heartRate:'',bodyTemperature:'',bloodOxygen:''});
  const [pastSessions, setPastSessions] = React.useState([]);
  const [showHistory, setShowHistory] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const socketRef = React.useRef(null);

  React.useEffect(() => {
    loadPastSessions();
    restoreActiveSession();
  }, [ambulanceId]);

  async function restoreActiveSession() {
    try {
      setIsLoading(true);
      const res = await axios.get(`http://localhost:4000/api/ambulance/session/active/${ambulanceId}`);
      if (res.data.session) {
        const activeSession = res.data.session;
        setSession(activeSession);
        setHealth(activeSession.healthPoints || []);
        setChat(activeSession.chat || []);
        
        // Reconnect socket
        connectSocket(activeSession._id);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function connectSocket(sessionId) {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    socketRef.current = io('http://localhost:4000');
    socketRef.current.emit('joinSession', { sessionId, role: 'paramedic' });
    
    socketRef.current.on('health:update', (point)=>{
      console.log('📊 Received health update:', point);
      console.log('🔮 Risk prediction in point:', point.riskPrediction);
      setHealth(h=>[...h, point]);
    });
    socketRef.current.on('chat:message', (msg)=>{
      setChat(c=>[...c, msg]);
    });
  }

  async function loadPastSessions() {
    try {
      const res = await axios.get(`http://localhost:4000/api/ambulance/sessions/${ambulanceId}`);
      setPastSessions(res.data.sessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  }

  async function startSession(){
    const res = await axios.post('http://localhost:4000/api/ambulance/session/start', form);
    setSession(res.data.session);
    // send guardian link
    await axios.post(`http://localhost:4000/api/guardian/session/${res.data.session._id}/send-guardian-link`);
    // connect socket
    connectSocket(res.data.session._id);
  }

  async function stopSession(){
    await axios.post(`http://localhost:4000/api/ambulance/session/${session._id}/stop`);
    if (socketRef.current) {
      socketRef.current.emit('status:update', { sessionId: session._id, status: 'arriving' });
    }
    setSession({...session, status:'arriving'});
  }

  async function endSession(){
    await axios.post(`http://localhost:4000/api/ambulance/session/${session._id}/end`);
    if (socketRef.current) {
      socketRef.current.emit('status:update', { sessionId: session._id, status: 'ended' });
      socketRef.current.disconnect();
    }
    alert('Session ended. Summary sent to guardian.');
    await loadPastSessions();
    setSession(null);
    setHealth([]);
    setChat([]);
  }

  function sendManualHealth(){
    if (!socketRef.current || !session) return;
    const point = { 
      heartRate: parseFloat(manualHealth.heartRate) || 0, 
      bodyTemperature: parseFloat(manualHealth.bodyTemperature) || 0, 
      bloodOxygen: parseFloat(manualHealth.bloodOxygen) || 0,
      timestamp: new Date()
    };
    socketRef.current.emit('health:update', { sessionId: session._id, point });
    setManualHealth({heartRate:'',bodyTemperature:'',bloodOxygen:''});
  }

  function sendChat(text){
    if (!socketRef.current || !session) return;
    socketRef.current.emit('chat:send', { sessionId: session._id, sender:'paramedic', text });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <div>
              <h1 className="text-xl font-bold">Emergency Medical System</h1>
              <p className="text-sm text-red-100">Ambulance: {ambulanceId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition font-semibold flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>History</span>
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-semibold">Loading...</p>
            </div>
          </div>
        ) : showHistory ? (
          <SessionHistory sessions={pastSessions} onClose={() => setShowHistory(false)} />
        ) : !session ? (
          <SessionForm form={form} setForm={setForm} onStart={startSession} />
        ) : (
          <ActiveSession 
            session={session}
            health={health}
            chat={chat}
            manualHealth={manualHealth}
            setManualHealth={setManualHealth}
            onStop={stopSession}
            onEnd={endSession}
            onSendHealth={sendManualHealth}
            onSendChat={sendChat}
          />
        )}
      </div>
    </div>
  )
}

function SessionForm({ form, setForm, onStart }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
        <h2 className="text-2xl font-bold text-white">New Emergency Session</h2>
        <p className="text-blue-100 mt-1">Fill in patient and guardian details to begin</p>
      </div>

      <div className="p-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Paramedic Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Paramedic Information
            </h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Paramedic Name</label>
              <input className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="Full name" value={form.paramedicName} onChange={e=>setForm({...form,paramedicName:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Paramedic ID</label>
              <input className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="ID number" value={form.paramedicId} onChange={e=>setForm({...form,paramedicId:e.target.value})} />
            </div>
          </div>

          {/* Patient Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Patient Information
            </h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Patient Name</label>
              <input className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                placeholder="Full name" value={form.patientName} onChange={e=>setForm({...form,patientName:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Patient Age</label>
              <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                placeholder="Age" value={form.patientAge} onChange={e=>setForm({...form,patientAge:e.target.value})} />
            </div>
          </div>

          {/* Guardian Info */}
          <div className="space-y-4 md:col-span-2">
            <h3 className="font-bold text-lg text-gray-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Guardian Contact Information
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Guardian NIC</label>
                <input className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                  placeholder="NIC number" value={form.guardianNIC} onChange={e=>setForm({...form,guardianNIC:e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Guardian Contact</label>
                <input className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                  placeholder="+94771234567" value={form.guardianContact} onChange={e=>setForm({...form,guardianContact:e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Monitoring Mode</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white" 
                  value={form.mode} onChange={e=>setForm({...form,mode:e.target.value})}>
                  <option value="automatic">Automatic (IoT)</option>
                  <option value="manual">Manual Entry</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={onStart} 
            className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <span>Start Emergency Session</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function ActiveSession({ session, health, chat, manualHealth, setManualHealth, onStop, onEnd, onSendHealth, onSendChat }) {
  const latestHealth = health[health.length - 1]
  const latestRisk = latestHealth?.riskPrediction
  
  // Debug logging
  console.log('🔍 Latest health data:', latestHealth);
  console.log('🔍 Latest risk prediction:', latestRisk);
  console.log('🔍 Total health entries:', health.length);

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-sm text-gray-600">Session Status</p>
              <p className="text-2xl font-bold text-gray-900">
                {session.status === 'ongoing' ? '🚑 En Route to Hospital' : '🏥 Arriving to Hospital'}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            {session.status === 'ongoing' && (
              <button onClick={onStop} className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition shadow-md">
                Mark Arriving
              </button>
            )}
            {session.status === 'arriving' && (
              <button onClick={onEnd} className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition shadow-md">
                End Session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Risk Assessment Banner */}
      {latestRisk && (
        <div className={`rounded-xl shadow-lg border-2 p-6 ${
          latestRisk.prediction === 'High Risk' 
            ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-400' 
            : 'bg-gradient-to-r from-green-50 to-green-100 border-green-400'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                latestRisk.prediction === 'High Risk' ? 'bg-red-200' : 'bg-green-200'
              }`}>
                {latestRisk.prediction === 'High Risk' ? '⚠️' : '✅'}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">AI Risk Assessment</h3>
                <p className={`text-3xl font-bold ${
                  latestRisk.prediction === 'High Risk' ? 'text-red-700' : 'text-green-700'
                }`}>
                  {latestRisk.prediction}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-600 mb-1">Risk Score</p>
              <p className={`text-4xl font-bold ${
                latestRisk.prediction === 'High Risk' ? 'text-red-700' : 'text-green-700'
              }`}>
                {(latestRisk.riskScore * 100).toFixed(1)}%
              </p>
              <div className="mt-2 w-48 bg-gray-300 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    latestRisk.prediction === 'High Risk' ? 'bg-red-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${latestRisk.riskScore * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Health Monitoring */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vital Signs Cards */}
          {latestHealth && (
            <div className="grid grid-cols-3 gap-4">
              <VitalCard icon="❤️" label="Heart Rate" value={latestHealth.heartRate} unit="bpm" color="red" />
              <VitalCard icon="🌡️" label="Temperature" value={latestHealth.bodyTemperature} unit="°C" color="orange" />
              <VitalCard icon="🫁" label="Blood Oxygen" value={latestHealth.bloodOxygen} unit="%" color="blue" />
            </div>
          )}

          {/* IoT Simulator or Manual Entry */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              {session.mode === 'automatic' ? 'IoT Device Monitor' : 'Manual Health Entry'}
            </h3>
            
            {session.mode === 'automatic' ? (
              <IoTSimulator sessionId={session._id} />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <input className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    placeholder="HR (bpm)" type="number" value={manualHealth.heartRate} 
                    onChange={e=>setManualHealth({...manualHealth,heartRate:e.target.value})} />
                  <input className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    placeholder="Temp (°C)" type="number" step="0.1" value={manualHealth.bodyTemperature} 
                    onChange={e=>setManualHealth({...manualHealth,bodyTemperature:e.target.value})} />
                  <input className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    placeholder="O2 (%)" type="number" value={manualHealth.bloodOxygen} 
                    onChange={e=>setManualHealth({...manualHealth,bloodOxygen:e.target.value})} />
                </div>
                <button onClick={onSendHealth} className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
                  Submit Vitals
                </button>
              </div>
            )}
          </div>

          {/* Health History */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Health Data Log ({health.length})</h3>
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">#</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">❤️ HR (bpm)</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">🌡️ Temp (°C)</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">🫁 SpO2 (%)</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">AI Risk</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {health.slice().reverse().map((h, i) => (
                    <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-3 py-3 font-semibold text-gray-600">{health.length - i}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="font-bold text-red-600">{h.heartRate}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="font-bold text-orange-600">{h.bodyTemperature}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="font-bold text-blue-600">{h.bloodOxygen}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {h.riskPrediction ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            h.riskPrediction.prediction === 'High Risk'
                              ? 'bg-red-100 text-red-700 border border-red-300'
                              : 'bg-green-100 text-green-700 border border-green-300'
                          }`}>
                            {h.riskPrediction.prediction === 'High Risk' ? '⚠️' : '✅'} {(h.riskPrediction.riskScore * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-gray-500">
                        {new Date(h.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                  {health.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-3 py-8 text-center text-gray-500">
                        No health data recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            Guardian Chat
          </h3>
          <div className="h-96 flex flex-col">
            <div className="flex-1 overflow-auto border border-gray-200 rounded-lg p-3 mb-4 space-y-2">
              {chat.map((m, i) => (
                <div key={i} className={`p-2 rounded-lg ${m.sender === 'paramedic' ? 'bg-blue-100 text-right' : 'bg-green-100'}`}>
                  <p className="text-xs font-semibold text-gray-600 mb-1">{m.sender}</p>
                  <p className="text-sm">{m.text}</p>
                </div>
              ))}
            </div>
            <ChatInput onSend={onSendChat} />
          </div>
        </div>
      </div>
    </div>
  )
}

function VitalCard({ icon, label, value, unit, color }) {
  const colors = {
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
    blue: 'from-blue-500 to-blue-600'
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-xl shadow-lg p-6`}>
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm opacity-90">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}<span className="text-lg ml-1">{unit}</span></p>
    </div>
  )
}

function ChatInput({ onSend }) {
  const [text, setText] = React.useState('');
  return (
    <div className="flex gap-2">
      <input className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" 
        value={text} onChange={e => setText(e.target.value)} 
        onKeyPress={e => e.key === 'Enter' && text.trim() && (onSend(text), setText(''))}
        placeholder="Type message..." />
      <button onClick={() => { if (text.trim()) { onSend(text); setText(''); } }} 
        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
        Send
      </button>
    </div>
  )
}

function SessionHistory({ sessions, onClose }) {
  const [selectedSession, setSelectedSession] = React.useState(null);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-between items-center rounded-t-xl">
        <h2 className="text-2xl font-bold flex items-center">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Session History
        </h2>
        <button onClick={onClose} className="hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {!selectedSession ? (
        <div className="p-6">
          {sessions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-lg font-semibold">No past sessions</p>
              <p className="text-sm mt-1">Session history will appear here</p>
            </div>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((s) => (
              <div
                key={s._id}
                onClick={() => setSelectedSession(s)}
                className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-lg cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800 mb-1">{s.patientName}</h3>
                    <p className="text-sm text-gray-600">{s.patientAge} years old</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    s.status === 'ended' ? 'bg-gray-300 text-gray-700' :
                    s.status === 'arriving' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-green-200 text-green-800'
                  }`}>
                    {s.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span>{new Date(s.startedAt || s.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                    </svg>
                    <span>{s.paramedicName}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{s.healthPoints.length} health records</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span className="truncate">{s.guardianContact}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-300 text-center">
                  <span className="text-xs text-blue-600 font-semibold">Click to view details →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <SessionDetail session={selectedSession} onBack={() => setSelectedSession(null)} />
      )}
    </div>
  )
}

function SessionDetail({ session, onBack }) {
  return (
    <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
      <div className="p-6 bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
        <button onClick={onBack} className="flex items-center text-blue-600 hover:text-blue-700 mb-4 font-semibold">
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to List
        </button>
        <h3 className="font-bold text-2xl text-gray-800 mb-2">{session.patientName}</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            {new Date(session.startedAt || session.createdAt).toLocaleString()}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            session.status === 'ended' ? 'bg-gray-300 text-gray-700' :
            session.status === 'arriving' ? 'bg-yellow-200 text-yellow-800' :
            'bg-green-200 text-green-800'
          }`}>
            {session.status}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Paramedic Info */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4">
            <h4 className="font-bold text-blue-900 mb-3 flex items-center text-lg">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
              </svg>
              Paramedic Information
            </h4>
            <div className="space-y-2">
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Name</p>
                <p className="font-semibold text-gray-800">{session.paramedicName}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">ID</p>
                <p className="font-semibold text-gray-800">{session.paramedicId}</p>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-4">
            <h4 className="font-bold text-green-900 mb-3 flex items-center text-lg">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Patient Information
            </h4>
            <div className="space-y-2">
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Name</p>
                <p className="font-semibold text-gray-800">{session.patientName}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Age</p>
                <p className="font-semibold text-gray-800">{session.patientAge} years</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Monitoring Mode</p>
                <p className="font-semibold text-gray-800 capitalize">{session.mode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Guardian Info */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-4">
          <h4 className="font-bold text-purple-900 mb-3 flex items-center text-lg">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            Guardian Contact
          </h4>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">NIC</p>
              <p className="font-semibold text-gray-800">{session.guardianNIC}</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Contact</p>
              <p className="font-semibold text-gray-800">{session.guardianContact}</p>
            </div>
          </div>
        </div>

        {/* Health Data Log */}
        <div className="bg-white border-2 border-gray-300 rounded-xl p-5">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
            <svg className="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Health Data Log
            <span className="ml-2 px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-full">
              {session.healthPoints.length} readings
            </span>
          </h4>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 border-b-2 border-gray-300">#</th>
                  <th className="px-3 py-3 text-center font-bold text-gray-700 border-b-2 border-gray-300">❤️ HR (bpm)</th>
                  <th className="px-3 py-3 text-center font-bold text-gray-700 border-b-2 border-gray-300">🌡️ Temp (°C)</th>
                  <th className="px-3 py-3 text-center font-bold text-gray-700 border-b-2 border-gray-300">🫁 SpO2 (%)</th>
                  <th className="px-3 py-3 text-center font-bold text-gray-700 border-b-2 border-gray-300">AI Risk Assessment</th>
                  <th className="px-3 py-3 text-center font-bold text-gray-700 border-b-2 border-gray-300">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {session.healthPoints.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-3 py-8 text-center text-gray-500">
                      No health data recorded
                    </td>
                  </tr>
                )}
                {session.healthPoints.slice().reverse().map((h, i) => (
                  <tr key={i} className="border-b border-gray-200 hover:bg-blue-50 transition">
                    <td className="px-3 py-4 font-bold text-gray-700">{session.healthPoints.length - i}</td>
                    <td className="px-3 py-4 text-center">
                      <span className="text-xl font-bold text-red-600">{h.heartRate}</span>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className="text-xl font-bold text-orange-600">{h.bodyTemperature}</span>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className="text-xl font-bold text-blue-600">{h.bloodOxygen}</span>
                    </td>
                    <td className="px-3 py-4 text-center">
                      {h.riskPrediction ? (
                        <div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                            h.riskPrediction.prediction === 'High Risk'
                              ? 'bg-red-100 text-red-700 border-2 border-red-400'
                              : 'bg-green-100 text-green-700 border-2 border-green-400'
                          }`}>
                            {h.riskPrediction.prediction === 'High Risk' ? '⚠️ High Risk' : '✅ Low Risk'}
                          </span>
                          <div className="text-xs text-gray-600 mt-1 font-semibold">{(h.riskPrediction.riskScore * 100).toFixed(1)}%</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No prediction</span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-center text-xs text-gray-600">
                      <div>{new Date(h.timestamp).toLocaleDateString()}</div>
                      <div className="font-semibold">{new Date(h.timestamp).toLocaleTimeString()}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
