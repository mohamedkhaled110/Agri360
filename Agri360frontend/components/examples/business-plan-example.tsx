'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface BusinessPlan {
  _id: string
  name: string
  description: string
  status: string
  createdAt: string
  [key: string]: any
}

/**
 * Example: Business Plans Component
 * Shows CRUD operations with business plans
 */
export default function BusinessPlanExample() {
  const [plans, setPlans] = useState<BusinessPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [planName, setPlanName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Fetch all plans on mount
  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const data = await api.businessPlan.list()
      console.log('Plans loaded:', data)
      setPlans(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || 'Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planName.trim()) return

    setLoading(true)
    try {
      const newPlan = await api.businessPlan.create({
        name: planName,
        description: 'Created from example component',
      })
      console.log('Plan created:', newPlan)
      setPlans([...plans, newPlan])
      setPlanName('')
      alert('Plan created successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to create plan')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePlan = async (id: string) => {
    if (!planName.trim()) return

    setLoading(true)
    try {
      const updated = await api.businessPlan.update(id, {
        name: planName,
        status: 'updated',
      })
      console.log('Plan updated:', updated)
      setPlans(plans.map((p) => (p._id === id ? updated : p)))
      setPlanName('')
      setEditingId(null)
      alert('Plan updated successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to update plan')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Delete this plan?')) return

    setLoading(true)
    try {
      await api.businessPlan.delete(id)
      console.log('Plan deleted')
      setPlans(plans.filter((p) => p._id !== id))
      alert('Plan deleted successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to delete plan')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (plan: BusinessPlan) => {
    setEditingId(plan._id)
    setPlanName(plan.name)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Business Plans Example (CRUD)</h2>

      {error && <div className="bg-red-100 p-3 rounded mb-4">{error}</div>}

      {/* Create/Edit Form */}
      <div className="bg-gray-50 p-4 rounded mb-6">
        <h3 className="font-bold mb-3">{editingId ? 'Edit Plan' : 'Create New Plan'}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            editingId ? handleUpdatePlan(editingId) : handleCreatePlan(e)
          }}
          className="space-y-3"
        >
          <input
            type="text"
            placeholder="Plan Name"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Processing...' : editingId ? 'Update Plan' : 'Create Plan'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setPlanName('')
                }}
                className="px-4 bg-gray-400 text-white p-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Plans List */}
      <div>
        <h3 className="font-bold mb-3">Your Plans</h3>
        {loading && <p className="text-gray-500">Loading plans...</p>}
        {plans.length === 0 && !loading ? (
          <p className="text-gray-500">No plans yet</p>
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className="p-4 border rounded flex justify-between items-start hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-semibold">{plan.name}</p>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(plan)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan._id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
