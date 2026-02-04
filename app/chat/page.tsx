"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface User {
  id: string
  name: string
  email: string
  avatar: string | null
}

export default function ChatPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [contacts, setContacts] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [myAvatar, setMyAvatar] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchUsers()
      fetchContacts()
      fetchMyProfile()
    }
  }, [session])

  const fetchMyProfile = async () => {
    try {
      const res = await fetch(`/api/profile/${session?.user?.id}`)
      if (res.ok) {
        const data = await res.json()
        setMyAvatar(data.avatar)
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    }
  }

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contacts")
      const data = await res.json()
      if (Array.isArray(data)) {
        setContacts(data)
      } else {
        setContacts([])
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error)
      setContacts([])
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users")
      const data = await res.json()
      if (Array.isArray(data)) {
        setUsers(data)
      } else {
        setUsers([])
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600">
        <div className="text-2xl text-white font-semibold animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Business Chat
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${session.user?.id}`}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-green-50 transition group"
            >
              {myAvatar ? (
                <img
                  src={myAvatar}
                  alt={session.user?.name || ""}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-green-400 ring-offset-2"
                />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {session.user?.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <span className="text-gray-700 font-medium group-hover:text-green-600 transition hidden sm:block">
                {session.user?.name}
              </span>
            </Link>
            <Link
              href="/settings"
              className="px-3 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition text-sm font-medium"
            >
              Select language
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition"
              title="Sign Out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* My Contacts */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-emerald-500 to-green-500 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">My Contacts</h2>
              <p className="text-green-100 text-sm">{contacts.length} contacts</p>
            </div>
          </div>

          {contacts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <p className="text-gray-500">No contacts yet</p>
              <p className="text-gray-400 text-sm mt-1">Visit a profile and click "Add to Contacts"</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {contacts.map((user) => (
                <li key={user.id}>
                  <Link href={`/profile/${user.id}`} className="flex items-center p-4 hover:bg-green-50 transition">
                    <div className="shrink-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-green-300 hover:ring-green-500 transition shadow-md"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md hover:shadow-lg transition">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex items-center ml-4">
                      <div>
                        <p className="font-semibold text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Contact</span>
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* All Users */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">All Users</h2>
              <p className="text-teal-100 text-sm">{users.length} users</p>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-500">No other users yet</p>
              <p className="text-gray-400 text-sm mt-1">Invite your friends to join!</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {users.map((user) => (
                <li key={user.id}>
                  <Link href={`/profile/${user.id}`} className="flex items-center p-4 hover:bg-teal-50 transition">
                    <div className="shrink-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-teal-300 hover:ring-teal-500 transition shadow-md"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md hover:shadow-lg transition">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex items-center ml-4">
                      <div>
                        <p className="font-semibold text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <svg className="ml-auto w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
