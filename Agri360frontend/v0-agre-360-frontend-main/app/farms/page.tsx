"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function FarmsIndexPage() {
  const [farmsList, setFarmsList] = useState<any[]>([])

  useEffect(() => {
    // No list endpoint was provided; this page provides links to create or view farms
  }, [])

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Farms</h1>
        <Link href="/farms/new">
          <Button>Create Farm</Button>
        </Link>
      </div>

      {farmsList.length === 0 ? (
        <div className="p-6 border rounded">No farms available.</div>
      ) : (
        <ul>
          {farmsList.map((f) => (
            <li key={f._id}>{f.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
