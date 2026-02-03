"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/chat")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-emerald-700">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-emerald-700 flex flex-col">
      <header className="p-6">
        <h1 className="text-2xl font-bold text-white">International Business Chat</h1>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Connect with Partners
          </h2>
          <p className="text-xl text-green-100 mb-12 max-w-xl mx-auto">
            Join our global business community and start connecting with partners worldwide.
            Simple, fast, and secure messaging.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-green-700 rounded-full font-semibold text-lg hover:bg-gray-100 transition shadow-lg"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold text-lg hover:bg-white/10 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-green-200">
        <p>&copy; 2025 International Business Chat. All rights reserved.</p>
      </footer>
    </div>
  )
}
