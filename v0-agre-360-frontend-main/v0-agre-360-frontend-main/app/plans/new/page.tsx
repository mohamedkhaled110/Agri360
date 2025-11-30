"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function NewPlanPage() {
  const [title, setTitle] = useState("")
  const router = useRouter()

  const create = async () => {
    try {
      const api = (await import("@/lib/api")).plans
      await api.create({ title })
      router.push('/plans')
    } catch (err) {
      alert('Failed to create plan')
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-4">New Plan</h1>
      <div className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button onClick={create}>Create</Button>
          <Button variant="outline" onClick={() => router.push('/plans')}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}
