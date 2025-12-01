"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sprout, CheckCircle2 } from 'lucide-react'

export default function SignUpPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }
    if (!acceptTerms) {
      alert("Please accept the terms and conditions")
      return
    }
    try {
      const api = (await import("@/lib/api")).auth
      const res: any = await api.register({ name, email, password })
      if (res?.token) localStorage.setItem("token", res.token)
      setIsSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)
    } catch (err: any) {
      alert(err.message || "Registration failed")
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {isSuccess && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-primary" />
                <p className="text-lg font-medium">{t.auth.signUp.success}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Left Side - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-primary p-12 flex-col justify-between text-primary-foreground">
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl">
          <Sprout className="h-8 w-8" />
          <span>Agre 360</span>
        </Link>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight text-balance">
            {t.landing.hero.title}
          </h1>
          <p className="text-lg text-primary-foreground/90 text-pretty">
            {t.landing.hero.description}
          </p>
        </div>
        <div className="text-sm text-primary-foreground/80">
          © 2025 Agre 360. All rights reserved.
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-between items-center md:hidden mb-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Sprout className="h-6 w-6 text-primary" />
              <span>Agre 360</span>
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="hidden md:flex justify-end">
            <LanguageSwitcher />
          </div>

          <Card className="border-2">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">{t.auth.signUp.title}</CardTitle>
              <CardDescription className="text-base">{t.auth.signUp.subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">{t.auth.signUp.name}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t.auth.signUp.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="farmer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t.auth.signUp.password}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t.auth.signUp.confirm}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    className="mt-1"
                  />
                  <Label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
                    {t.auth.signUp.terms}
                  </Label>
                </div>

                <Button type="submit" className="w-full h-11 text-base">
                  {t.auth.signUp.button}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">{t.auth.signUp.hasAccount}</span>{" "}
                <Link href="/signin" className="text-primary font-medium hover:underline">
                  {t.auth.signUp.signInLink}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
