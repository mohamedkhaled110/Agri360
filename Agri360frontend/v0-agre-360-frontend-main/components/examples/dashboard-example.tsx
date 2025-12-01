'use client'

import { useEffect, useState } from 'react'
import api, { DashboardData } from '@/lib/api'

/**
 * Example: Dashboard Component
 * Shows how to fetch and display dashboard statistics
 */
export default function DashboardExample() {
  const [stats, setStats] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.dashboard.getStats()
        console.log('Dashboard stats:', data)
        setStats(data)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const handleComputeStats = async () => {
    setLoading(true)
    try {
      const result = await api.dashboard.computeAndStore({
        // Add any required parameters
      })
      console.log('Stats computed:', result)
      // Refresh stats after computation
      const newStats = await api.dashboard.getStats()
      setStats(newStats)
      alert('Statistics updated successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to compute stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-6">Loading dashboard...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Dashboard Example</h2>

      {error && <div className="bg-red-100 p-3 rounded mb-4">{error}</div>}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded">
            <p className="text-gray-600 text-sm">Total Crops</p>
            <p className="text-3xl font-bold text-blue-600">{stats.stats?.totalCrops || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <p className="text-gray-600 text-sm">Total Animals</p>
            <p className="text-3xl font-bold text-green-600">{stats.stats?.totalAnimals || 0}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded">
            <p className="text-gray-600 text-sm">Pending Orders</p>
            <p className="text-3xl font-bold text-purple-600">
              {stats.stats?.pendingOrders || 0}
            </p>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={handleComputeStats}
        disabled={loading}
        className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Computing...' : 'Refresh Statistics'}
      </button>

      {/* Raw Data Display */}
      {stats && (
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <p className="font-bold mb-2">Raw Data:</p>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(stats, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
