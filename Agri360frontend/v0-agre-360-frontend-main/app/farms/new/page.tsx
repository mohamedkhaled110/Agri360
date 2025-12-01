"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function CreateFarmPage() {
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [lat, setLat] = useState("30.0444") // Default Cairo
  const [lon, setLon] = useState("31.2357")
  const [fieldSizeHectares, setFieldSizeHectares] = useState("")
  const [ph, setPh] = useState("")
  const [nitrogen, setNitrogen] = useState("")
  const [waterSource, setWaterSource] = useState("well")
  const router = useRouter()

  const handleCreate = async () => {
    try {
      if (!name || !address || !fieldSizeHectares) {
        alert("Please fill in all required fields")
        return
      }

      const api = (await import("@/lib/api")).farms
      await api.create({
        name,
        location: address,
        size: parseFloat(fieldSizeHectares),
        sizeUnit: "hectares",
        coordinates: {
          lat: parseFloat(lat),
          lng: parseFloat(lon)
        },
        soilType: ph ? `pH: ${ph}` : undefined,
        waterSource: waterSource
      })
      alert("Farm created successfully!")
      router.push("/farms")
    } catch (err) {
      console.error(err)
      alert("Failed to create farm: " + (err as any).message)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create Farm</h1>
      <div className="space-y-4">
        <div>
          <Label>Farm Name *</Label>
          <Input 
            placeholder="e.g., North Field"
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
        </div>

        <div>
          <Label>Farm Address *</Label>
          <Input 
            placeholder="e.g., Cairo, Egypt"
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Latitude</Label>
            <Input 
              placeholder="30.0444"
              value={lat} 
              onChange={(e) => setLat(e.target.value)} 
              type="number"
              step="0.0001"
            />
          </div>
          <div>
            <Label>Longitude</Label>
            <Input 
              placeholder="31.2357"
              value={lon} 
              onChange={(e) => setLon(e.target.value)} 
              type="number"
              step="0.0001"
            />
          </div>
        </div>

        <div>
          <Label>Field Size (Hectares) *</Label>
          <Input 
            placeholder="e.g., 5"
            value={fieldSizeHectares} 
            onChange={(e) => setFieldSizeHectares(e.target.value)} 
            type="number"
            step="0.1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Soil pH</Label>
            <Input 
              placeholder="7.0"
              value={ph} 
              onChange={(e) => setPh(e.target.value)} 
              type="number"
              step="0.1"
              min="0"
              max="14"
            />
          </div>
          <div>
            <Label>Nitrogen Level</Label>
            <Input 
              placeholder="e.g., 50"
              value={nitrogen} 
              onChange={(e) => setNitrogen(e.target.value)} 
              type="number"
              step="0.1"
            />
          </div>
        </div>

        <div>
          <Label>Water Source</Label>
          <select 
            value={waterSource} 
            onChange={(e) => setWaterSource(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="well">Well</option>
            <option value="irrigation">Irrigation Canal</option>
            <option value="rainfall">Rainfall</option>
            <option value="borehole">Borehole</option>
            <option value="river">River</option>
          </select>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">Create Farm</Button>
          <Button variant="outline" onClick={() => router.push('/farms')}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}
