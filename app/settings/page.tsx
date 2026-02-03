"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

const LANGUAGES = [
  { code: "ru", name: "Русский" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "pt", name: "Português" },
  { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "ar", name: "العربية" },
  { code: "hi", name: "हिन्दी" },
  { code: "tr", name: "Türkçe" },
  { code: "pl", name: "Polski" },
  { code: "uk", name: "Українська" },
]

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [language, setLanguage] = useState("ru")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    // Load current language
    async function loadLanguage() {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        setLanguage(data.language || "ru")
      }
    }
    if (status === "authenticated") {
      loadLanguage()
    }
  }, [status])

  async function handleSave() {
    setSaving(true)
    setSaved(false)

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
    })

    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-emerald-700">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-emerald-700">
      <header className="p-4 flex items-center gap-4">
        <Link href="/chat" className="text-white hover:text-green-200">
          ← Back
        </Link>
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </header>

      <main className="p-4 max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Translation Language
          </h2>
          <p className="text-gray-600 mb-4 text-sm">
            Select the language messages will be translated to
          </p>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save"}
          </button>
        </div>
      </main>
    </div>
  )
}
