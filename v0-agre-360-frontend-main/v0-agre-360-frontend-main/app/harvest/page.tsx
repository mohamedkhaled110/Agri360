"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function HarvestPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [crop, setCrop] = useState("wheat")
  const [plantingDate, setPlantingDate] = useState("")
  const [harvestDate, setHarvestDate] = useState("")
  const [expectedYield, setExpectedYield] = useState("")
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const api = (await import("@/lib/api")).harvest
      const res = await api.list()
      setPlans(Array.isArray(res) ? res : [])
    } catch (err) {
      console.error(err)
    }
  }

  const create = async () => {
    try {
      if (!crop || !plantingDate || !harvestDate) {
        alert("Please fill in all required fields")
        return
      }

      const api = (await import("@/lib/api")).harvest
      await api.create({
        crop,
        plantingDate: new Date(plantingDate).toISOString(),
        harvestDate: new Date(harvestDate).toISOString(),
        expectedYield: expectedYield ? parseFloat(expectedYield) : undefined,
        irrigationSchedule: {},
        fertilizerSchedule: {}
      })

      alert("Harvest plan created successfully!")
      setCrop("wheat")
      setPlantingDate("")
      setHarvestDate("")
      setExpectedYield("")
      setShowForm(false)

      await loadPlans()
    } catch (err) {
      console.error(err)
      alert("Failed to create harvest plan: " + (err as any).message)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Harvest Plans</h1>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700"
        >
          {showForm ? "Cancel" : "New Plan"}
        </Button>
      </div>

      {showForm && (
        <div className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
          <div>
            <Label>Crop Type *</Label>
            <select 
              value={crop} 
              onChange={(e) => setCrop(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="wheat">Wheat</option>
              <option value="maize">Maize</option>
              <option value="rice">Rice</option>
              <option value="tomato">Tomato</option>
              <option value="cotton">Cotton</option>
              <option value="sugarcane">Sugarcane</option>
              <option value="olive">Olive</option>
              <option value="date">Date Palm</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Planting Date *</Label>
              <Input 
                type="date"
                value={plantingDate} 
                onChange={(e) => setPlantingDate(e.target.value)} 
              />
            </div>
            <div>
              <Label>Harvest Date *</Label>
              <Input 
                type="date"
                value={harvestDate} 
                onChange={(e) => setHarvestDate(e.target.value)} 
              />
            </div>
          </div>

          <div>
            <Label>Expected Yield (kg/hectare)</Label>
            <Input 
              type="number"
              placeholder="e.g., 5000"
              value={expectedYield} 
              onChange={(e) => setExpectedYield(e.target.value)} 
              step="100"
            />
          </div>

          <Button onClick={create} className="w-full bg-green-600 hover:bg-green-700">
            Create Plan
          </Button>
        </div>
      )}

      <div>
        {plans.length === 0 ? (
          <div className="p-4 border rounded text-center text-gray-500">
            No harvest plans yet. Create one to get started!
          </div>
        ) : (
          <ul className="space-y-3">
            {plans.map((p) => (
              <li 
                key={p._id} 
                className="p-4 border rounded-lg hover:shadow-md transition"
              >
                <div className="font-bold text-lg">{p.crop}</div>
                <div className="text-sm text-gray-600">
                  Planting: {p.plantingDate ? new Date(p.plantingDate).toLocaleDateString() : "N/A"}
                </div>
                <div className="text-sm text-gray-600">
                  Harvest: {p.harvestDate ? new Date(p.harvestDate).toLocaleDateString() : "N/A"}
                </div>
                {p.expectedYield && (
                  <div className="text-sm text-gray-600">
                    Expected Yield: {p.expectedYield} kg/ha
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
