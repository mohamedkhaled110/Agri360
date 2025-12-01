"use client"

import { useLanguage } from "@/contexts/language-context"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CloudRain, TrendingUp, Droplets, Smartphone, LineChart, Bug, ArrowRight } from 'lucide-react'
import Link from "next/link"

export default function HomePage() {
  const { t } = useLanguage()

  const features = [
    {
      icon: TrendingUp,
      title: t.landing.features.yieldPrediction.title,
      description: t.landing.features.yieldPrediction.description,
    },
    {
      icon: CloudRain,
      title: t.landing.features.weatherAnalytics.title,
      description: t.landing.features.weatherAnalytics.description,
    },
    {
      icon: Droplets,
      title: t.landing.features.smartIrrigation.title,
      description: t.landing.features.smartIrrigation.description,
    },
    {
      icon: Smartphone,
      title: t.landing.features.mobileAccess.title,
      description: t.landing.features.mobileAccess.description,
    },
    {
      icon: LineChart,
      title: t.landing.features.marketInsights.title,
      description: t.landing.features.marketInsights.description,
    },
    {
      icon: Bug,
      title: t.landing.features.pestAlerts.title,
      description: t.landing.features.pestAlerts.description,
    },
  ]

  const stats = [
    { value: "95%", label: t.landing.stats.accuracy },
    { value: "40%", label: t.landing.stats.waterSaved },
    { value: "30%", label: t.landing.stats.yieldIncrease },
    { value: "10k+", label: t.landing.stats.users },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            {t.landing.hero.subtitle}
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
            {t.landing.hero.title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            {t.landing.hero.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" asChild className="text-base">
              <Link href="/signup">
                {t.landing.hero.cta}
                <ArrowRight className="h-4 w-4 ltr:ml-2 rtl:mr-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base">
              <Link href="#features">{t.landing.hero.learnMore}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 md:py-32">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">
            {t.landing.features.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            {t.landing.features.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">
              {t.landing.cta.title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              {t.landing.cta.description}
            </p>
            <Button size="lg" asChild className="text-base">
              <Link href="/signup">
                {t.landing.cta.button}
                <ArrowRight className="h-4 w-4 ltr:ml-2 rtl:mr-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Agre 360. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
