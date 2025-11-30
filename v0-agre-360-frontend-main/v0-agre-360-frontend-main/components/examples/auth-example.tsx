'use client'

import { useState } from 'react'
import api from '@/lib/api'

/**
 * Example: Authentication Component
 * Shows how to use login/register endpoints
 */
export default function AuthExample() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [token, setToken] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.auth.login({ email, password })
      console.log('Login successful:', response)
      setToken(response.token)
      // Token is automatically stored by the API service
      alert('Login successful!')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Login Example</h2>
      
      {error && <div className="bg-red-100 p-3 rounded mb-4">{error}</div>}
      
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {token && (
        <div className="mt-4 p-3 bg-green-100 rounded">
          <p>✅ Logged in successfully!</p>
          <p className="text-sm text-gray-600">Token: {token.slice(0, 20)}...</p>
        </div>
      )}
    </div>
  )
}
