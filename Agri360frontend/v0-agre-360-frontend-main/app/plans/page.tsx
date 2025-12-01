"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PlansIndex() {
  const [plansList, setPlansList] = useState<any[]>([])
  const [title, setTitle] = useState("")

  useEffect(() => {
    import("@/lib/api").then(async ({ businessPlan }) => {
      try {
        const res = await businessPlan.list()
        setPlansList(Array.isArray(res) ? res : [])
      } catch (err) {
        console.error(err)
      }
    })
  }, [])

  const create = async () => {
    try {
      const api = (await import("@/lib/api")).businessPlan
      await api.create({ title })
      const res = await api.list()
      setPlansList(Array.isArray(res) ? res : [])
      setTitle("")
    } catch (err) {
      alert("Failed to create plan")
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Plans</h1>
        <Link href="/plans/new">
          <Button>Create</Button>
        </Link>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <Label>Quick create</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <Button onClick={create}>Create</Button>
      </div>

      <div>
        {plansList.length === 0 ? (
          <div className="p-4 border">No plans yet.</div>
        ) : (
          <ul className="space-y-2">
            {plansList.map((p) => (
              <li key={p._id} className="p-3 border rounded">{p.title || p.name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
