'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Farm {
  _id: string
  name: string
  location: string
  size: number
  [key: string]: any
}

/**
 * Example: Farm Management Component
 * Shows how to fetch and display farm data
 */
export default function FarmExample() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    size: '',
  })

  // Fetch farm on component mount
  useEffect(() => {
    // Note: You'll need to create a list endpoint in your backend
    // This is an example of how to use the API
  }, [])

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const newFarm = await api.farms.create({
        ...formData,
        size: parseFloat(formData.size),
      })
      console.log('Farm created:', newFarm)
      setFarms([...farms, newFarm])
      setFormData({ name: '', location: '', size: '' })
      alert('Farm created successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to create farm')
    } finally {
      setLoading(false)
    }
  }

  const handleGetFarm = async (farmId: string) => {
    setLoading(true)
    try {
      const farm = await api.farms.getFarm(farmId)
      console.log('Farm data:', farm)
      alert(`Farm loaded: ${farm.name}`)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch farm')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Farm Management Example</h2>

      {error && <div className="bg-red-100 p-3 rounded mb-4">{error}</div>}

      {/* Create Farm Form */}
      <div className="bg-gray-50 p-4 rounded mb-6">
        <h3 className="font-bold mb-3">Create New Farm</h3>
        <form onSubmit={handleCreateFarm} className="space-y-3">
          <input
            type="text"
            placeholder="Farm Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="number"
            placeholder="Size (hectares)"
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Farm'}
          </button>
        </form>
      </div>

      {/* Farm List */}
      <div>
        <h3 className="font-bold mb-3">Your Farms</h3>
        {farms.length === 0 ? (
          <p className="text-gray-500">No farms yet</p>
        ) : (
          <div className="space-y-2">
            {farms.map((farm) => (
              <div key={farm._id} className="p-3 border rounded flex justify-between items-center">
                <div>
                  <p className="font-semibold">{farm.name}</p>
                  <p className="text-sm text-gray-600">{farm.location}</p>
                </div>
                <button
                  onClick={() => handleGetFarm(farm._id)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
