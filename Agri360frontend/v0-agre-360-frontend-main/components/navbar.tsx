"use client"

import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import { Sprout } from 'lucide-react'

export function Navbar() {
  const { t } = useLanguage()

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Sprout className="h-6 w-6 text-primary" />
          <span>Agre 360</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm hover:text-primary transition-colors">
            {t.nav.features}
          </Link>
          <Link href="#about" className="text-sm hover:text-primary transition-colors">
            {t.nav.about}
          </Link>
          <Link href="#contact" className="text-sm hover:text-primary transition-colors">
            {t.nav.contact}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/signin">{t.nav.signIn}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">{t.nav.signUp}</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
