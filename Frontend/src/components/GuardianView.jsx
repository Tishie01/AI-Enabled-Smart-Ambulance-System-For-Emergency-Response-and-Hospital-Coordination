import React from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'

export default function GuardianView(){
  const [sessionId, setSessionId] = React.useState('');
  const [nic, setNic] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [token, setToken] = React.useState(null);
  const [health, setHealth] = React.useState([]);
  const [chat, setChat] = React.useState([]);
  const [error, setError] = React.useState('');
  const [sessionStatus, setSessionStatus] = React.useState('ongoing');
  const socketRef = React.useRef(null);

  React.useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('sessionId');
    if(sid) setSessionId(sid);
  },[]);

  async function verify(){
    setError('');
    try {
      const res = await axios.post('http://localhost:4000/api/guardian/verify', { sessionId, nic, otp });
      setToken(res.data.token);
      socketRef.current = io('http://localhost:4000');
      socketRef.current.emit('joinSession', { sessionId, role: 'guardian' });

      socketRef.current.on('health:update', (point)=>{
        console.log('👨‍👩‍👧 Guardian received health update:', point);
        console.log('🔮 Risk prediction in point:', point.riskPrediction);
        setHealth(h=>[...h, point]);
      });
      socketRef.current.on('chat:message', (msg)=>{
        setChat(c=>[...c, msg]);
      });
      socketRef.current.on('status:changed', ({status})=>{
        setSessionStatus(status);
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    }
  }

  function sendChat(text){
    if (!socketRef.current) return;
    socketRef.current.emit('chat:send', { sessionId, sender:'guardian', text });
  }

  const latestHealth = health[health.length - 1];
  const latestRisk = latestHealth?.riskPrediction;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {!token ? (
        <div className="min-h-screen flex overflow-hidden">
          {/* Left Side - Hero Section with Background Image */}
          <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-green-800 via-green-600 to-teal-600">
            <div className="absolute inset-0 bg-[url('https://png.pngtree.com/thumb_back/fw800/background/20250323/pngtree-paramedic-delivers-happy-patient-in-professional-ambulance-setting-photo-photo-image_68325444.webp')] bg-cover bg-center opacity-20"></div>
            <div className="relative z-10 flex flex-col justify-center px-12 text-white">
              <div className="mb-6">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <h1 className="text-5xl font-bold mb-4 leading-tight">Your Loved One<br />Is in Safe Hands</h1>
                <div className="w-24 h-1 bg-white mb-6"></div>
                <p className="text-xl text-green-100 mb-8 leading-relaxed">
                  Take a deep breath. Our team of professional paramedics and advanced AI technology are working together to ensure the best care.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Real-Time Monitoring</h3>
                    <p className="text-green-100 text-sm">Watch live health vitals and receive instant AI-powered risk assessments</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Direct Communication</h3>
                    <p className="text-green-100 text-sm">Chat directly with the paramedic team caring for your loved one</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Certified Care Team</h3>
                    <p className="text-green-100 text-sm">Experienced professionals trained in emergency medical response</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Complete Transparency</h3>
                    <p className="text-green-100 text-sm">Full access to health records, treatment updates, and journey status</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 pt-8 border-t border-white border-opacity-20">
                <p className="text-sm text-green-100 italic">"We understand this is a stressful time. Stay calm, stay informed, and trust that your loved one is receiving the best possible care with cutting-edge technology and compassionate professionals."</p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-green-50 via-white to-teal-50">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-8 text-white">
                  <div className="flex items-center justify-center mb-4">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold text-center">Guardian Access</h1>
                  <p className="text-center text-green-100 mt-2">Stay Connected & Informed</p>
                </div>

                <div className="p-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Session ID</label>
                    <input className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50" 
                      placeholder="Session ID from SMS" value={sessionId} onChange={e=>setSessionId(e.target.value)} disabled={!!sessionId} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Your NIC</label>
                    <input className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                      placeholder="Enter NIC number" value={nic} onChange={e=>setNic(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">OTP Code</label>
                    <input className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                      placeholder="6-digit code from SMS" value={otp} onChange={e=>setOtp(e.target.value)} maxLength={6} />
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
                      {error}
                    </div>
                  )}

                  <button onClick={verify} 
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg">
                    Verify & Join Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      ) : (
        <div>
          {/* Header */}
          <header className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h1 className="text-xl font-bold">Guardian Monitoring</h1>
                    <p className="text-sm text-green-100">Patient Health Status - Live</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {sessionStatus === 'ongoing' && (
                    <>
                      <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                      <span className="px-4 py-2 bg-white bg-opacity-20 rounded-lg font-semibold">🚑 On the way</span>
                    </>
                  )}
                  {sessionStatus === 'arriving' && (
                    <>
                      <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                      <span className="px-4 py-2 bg-yellow-500 rounded-lg font-semibold">🏥 Arriving to Hospital</span>
                    </>
                  )}
                  {sessionStatus === 'ended' && (
                    <span className="px-4 py-2 bg-gray-500 rounded-lg font-semibold">Session Ended</span>
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto p-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Health Monitoring */}
              <div className="lg:col-span-2 space-y-6">
                {/* AI Risk Assessment */}
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
                          <p className="text-sm text-gray-600 mt-1">
                            {latestRisk.prediction === 'High Risk' 
                              ? 'Patient requires immediate medical attention'
                              : 'Patient condition is stable'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Current Vitals */}
                {latestHealth && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6">
                      <div className="text-3xl mb-2">❤️</div>
                      <p className="text-sm opacity-90">Heart Rate</p>
                      <p className="text-3xl font-bold mt-2">{latestHealth.heartRate}<span className="text-lg ml-1">bpm</span></p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6">
                      <div className="text-3xl mb-2">🌡️</div>
                      <p className="text-sm opacity-90">Temperature</p>
                      <p className="text-3xl font-bold mt-2">{latestHealth.bodyTemperature}<span className="text-lg ml-1">°C</span></p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
                      <div className="text-3xl mb-2">🫁</div>
                      <p className="text-sm opacity-90">Blood Oxygen</p>
                      <p className="text-3xl font-bold mt-2">{latestHealth.bloodOxygen}<span className="text-lg ml-1">%</span></p>
                    </div>
                  </div>
                )}

                {/* Health History */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Health Data Timeline ({health.length} readings)
                  </h3>
                  <div className="max-h-96 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-blue-50 to-green-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">#</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-700">❤️ Heart Rate</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-700">🌡️ Temperature</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-700">🫁 Blood O₂</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-700">AI Risk Assessment</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-700">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {health.slice().reverse().map((h, i) => (
                          <tr key={i} className="border-b border-gray-200 hover:bg-blue-50 transition">
                            <td className="px-3 py-3 font-semibold text-gray-600">{health.length - i}</td>
                            <td className="px-3 py-3 text-center">
                              <div className="font-bold text-red-600 text-lg">{h.heartRate}</div>
                              <div className="text-xs text-gray-500">bpm</div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <div className="font-bold text-orange-600 text-lg">{h.bodyTemperature}</div>
                              <div className="text-xs text-gray-500">°C</div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <div className="font-bold text-blue-600 text-lg">{h.bloodOxygen}</div>
                              <div className="text-xs text-gray-500">%</div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              {h.riskPrediction ? (
                                <div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                                    h.riskPrediction.prediction === 'High Risk'
                                      ? 'bg-red-100 text-red-700 border border-red-300'
                                      : 'bg-green-100 text-green-700 border border-green-300'
                                  }`}>
                                    {h.riskPrediction.prediction === 'High Risk' ? '⚠️ High Risk' : '✅ Low Risk'}
                                  </span>
                                </div>
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
                              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                              </svg>
                              <p>Waiting for health data...</p>
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
                  Chat with Paramedic
                </h3>
                <div className="h-96 flex flex-col">
                  <div className="flex-1 overflow-auto border border-gray-200 rounded-lg p-3 mb-4 space-y-2 bg-gray-50">
                    {chat.map((m, i) => (
                      <div key={i} className={`p-3 rounded-lg ${m.sender === 'guardian' ? 'bg-green-100 ml-8' : 'bg-blue-100 mr-8'}`}>
                        <p className="text-xs font-semibold text-gray-600 mb-1">{m.sender === 'guardian' ? 'You' : 'Paramedic'}</p>
                        <p className="text-sm">{m.text}</p>
                      </div>
                    ))}
                    {chat.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <p className="text-sm">No messages yet</p>
                      </div>
                    )}
                  </div>
                  <ChatInput onSend={sendChat} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
        placeholder="Type your message..." />
      <button onClick={() => { if (text.trim()) { onSend(text); setText(''); } }} 
        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
        Send
      </button>
    </div>
  )
}
