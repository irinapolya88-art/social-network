"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function EditProfilePage() {
  const { data: session, status } = useSession()
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [avatar, setAvatar] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profile/${session?.user?.id}`)
      if (res.ok) {
        const data = await res.json()
        setName(data.name || "")
        setBio(data.bio || "")
        setAvatar(data.avatar || null)
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Convert to base64 for simple storage
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, avatar }),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error("Failed to save profile:", error)
    } finally {
      setSaving(false)
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
        <h1 className="text-xl font-bold text-white">Edit Profile</h1>
      </header>

      <main className="p-4 max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer relative group"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-green-500"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-green-500">
                  {name.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <span className="text-white text-sm">Change</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-gray-500 text-sm mt-2">Click to change photo</p>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Your name"
            />
          </div>

          {/* Bio */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Tell about yourself..."
            />
          </div>

          {/* Save button */}
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
