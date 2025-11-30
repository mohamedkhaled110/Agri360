"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { PlanEditor } from "@/components/plan-editor"
import { DashboardNavbar } from "@/components/dashboard-navbar"
import { Skeleton } from "@/components/ui/skeleton"

function PlanningContent() {
  const searchParams = useSearchParams()
  const planType = searchParams.get("type") || "farming"
  
  // Validate plan type
  const validTypes = ["farming", "business", "market", "crop", "animal", "mixed"]
  const type = validTypes.includes(planType) ? planType : "farming"

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <div className="container mx-auto px-4 py-6">
        <PlanEditor 
          planType={type as "farming" | "business" | "market" | "crop" | "animal" | "mixed"} 
        />
      </div>
    </div>
  )
}

export default function PlanningPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    }>
      <PlanningContent />
    </Suspense>
  )
}
