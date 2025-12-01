"use client"

import { useLanguage } from "@/contexts/language-context"
import { DashboardNavbar } from "@/components/dashboard-navbar"
import { PlanEditor } from "@/components/plan-editor"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react'
import Link from "next/link"

export default function BusinessPlanPage() {
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
          <h1 className="text-3xl font-bold mb-2">{t.planning.businessPlan.title}</h1>
          <p className="text-muted-foreground">{t.planning.businessPlan.subtitle}</p>
        </div>

        <PlanEditor
          title={t.planning.businessPlan.title}
          sections={t.planning.businessPlan.sections}
          planType="business"
        />
      </div>
    </div>
  )
}
