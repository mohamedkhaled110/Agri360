"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function FarmPage() {
  const [farm, setFarm] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const id = pathname?.split("/").pop() || ""

  useEffect(() => {
    if (!id) return
    import("@/lib/api").then(async ({ farms }) => {
      try {
        const data = await farms.getFarm(id)
        setFarm(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    })
  }, [id])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Farm</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/farms')}>Back</Button>
        </div>
      </div>
      {farm ? (
        <div className="space-y-4">
          <div><strong>Name:</strong> {farm.name}</div>
          <div><strong>Country:</strong> {farm.country}</div>
        </div>
      ) : (
        <div>No farm found.</div>
      )}
    </div>
  )
}
