import React from 'react'
import axios from 'axios'

export default function AmbulanceLogin({ onLogin }) {
  const [isLogin, setIsLogin] = React.useState(true)
  const [form, setForm] = React.useState({ ambulanceId: '', password: '' })
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isLogin ? 'login' : 'signup'
      const res = await axios.post(`http://localhost:4000/api/ambulance/${endpoint}`, form)
      
      if (isLogin) {
        localStorage.setItem('ambulanceToken', res.data.token)
        localStorage.setItem('ambulanceId', form.ambulanceId)
        onLogin(form.ambulanceId, res.data.token)
      } else {
        setIsLogin(true)
        setError('Account created! Please login.')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-center">Emergency Medical</h1>
            <p className="text-center text-red-100 mt-2">Ambulance Management System</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 pb-3 text-center font-semibold transition-colors ${
                  isLogin ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 pb-3 text-center font-semibold transition-colors ${
                  !isLogin ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ambulance ID
                </label>
                <input
                  type="text"
                  required
                  value={form.ambulanceId}
                  onChange={(e) => setForm({ ...form, ambulanceId: e.target.value })}
                  placeholder="e.g., AMB001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
              </div>

              {error && (
                <div className={`p-3 rounded-lg text-sm ${
                  error.includes('created') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
              </button>
            </form>

            {isLogin && (
              <p className="text-center text-sm text-gray-600 mt-6">
                Test credentials: <span className="font-semibold">AMB001</span> / <span className="font-semibold">password123</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
