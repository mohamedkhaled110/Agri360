"use client"

import { useLanguage } from "@/contexts/language-context"
import { DashboardNavbar } from "@/components/dashboard-navbar"
import { PlanEditor } from "@/components/plan-editor"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react'
import Link from "next/link"

export default function MarketPlanPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{t.planning.marketPlan.title}</h1>
          <p className="text-muted-foreground">{t.planning.marketPlan.subtitle}</p>
        </div>

        <PlanEditor
          title={t.planning.marketPlan.title}
          sections={t.planning.marketPlan.sections}
          planType="market"
        />
      </div>
    </div>
  )
}
