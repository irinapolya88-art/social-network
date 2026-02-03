"use client"

import { useEffect, useState, useRef, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Message {
  id: string
  content: string
  createdAt: string
  senderId: string
  sender: { id: string; name: string }
  receiver: { id: string; name: string }
}

interface User {
  id: string
  name: string
  email: string
  avatar: string | null
}

export default function ChatWithUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params)
  const { data: session, status } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [otherUser, setOtherUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [translating, setTranslating] = useState<Record<string, boolean>>({})
  const [userLanguage, setUserLanguage] = useState("ru")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchUserAndMessages()
      fetchUserLanguage()
      const interval = setInterval(fetchMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [session, resolvedParams.userId])

  const fetchUserLanguage = async () => {
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        setUserLanguage(data.language || "ru")
      }
    } catch (error) {
      console.error("Failed to fetch language:", error)
    }
  }

  const translateMessage = async (messageId: string, text: string) => {
    setTranslating((prev) => ({ ...prev, [messageId]: true }))
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang: userLanguage }),
      })
      if (res.ok) {
        const data = await res.json()
        setTranslations((prev) => ({ ...prev, [messageId]: data.translation }))
      }
    } catch (error) {
      console.error("Translation failed:", error)
    } finally {
      setTranslating((prev) => ({ ...prev, [messageId]: false }))
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchUserAndMessages = async () => {
    try {
      const [profileRes, messagesRes] = await Promise.all([
        fetch(`/api/profile/${resolvedParams.userId}`),
        fetch(`/api/messages?userId=${resolvedParams.userId}`)
      ])

      if (profileRes.ok) {
        const user = await profileRes.json()
        setOtherUser(user)
      }

      const msgs = await messagesRes.json()
      setMessages(msgs)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?userId=${resolvedParams.userId}`)
      const msgs = await res.json()
      setMessages(msgs)
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: resolvedParams.userId,
          content: newMessage.trim(),
        }),
      })

      if (res.ok) {
        const message = await res.json()
        setMessages((prev) => [...prev, message])
        setNewMessage("")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setSending(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!session || !otherUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">User not found</p>
          <Link href="/chat" className="text-green-600 hover:underline">
            Back to chats
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/chat"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <Link href={`/profile/${otherUser.id}`} className="flex items-center gap-4 hover:opacity-80 transition">
            {otherUser.avatar ? (
              <img
                src={otherUser.avatar}
                alt={otherUser.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-green-400"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                {otherUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="font-semibold text-gray-900">{otherUser.name}</h1>
              <p className="text-sm text-gray-500">{otherUser.email}</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === session.user.id
              const hasTranslation = translations[message.id]
              const isTranslating = translating[message.id]
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      isOwn
                        ? "bg-green-600 text-white rounded-br-md"
                        : "bg-white text-gray-900 rounded-bl-md shadow"
                    }`}
                  >
                    <p>{message.content}</p>
                    {hasTranslation && (
                      <p className={`mt-2 pt-2 border-t ${
                        isOwn ? "border-green-400 text-green-100" : "border-gray-200 text-gray-600"
                      }`}>
                        🌐 {translations[message.id]}
                      </p>
                    )}
                    <div className={`flex items-center gap-2 mt-1 ${
                      isOwn ? "text-green-200" : "text-gray-400"
                    }`}>
                      <p className="text-xs">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {!hasTranslation && (
                        <button
                          onClick={() => translateMessage(message.id, message.content)}
                          disabled={isTranslating}
                          className={`text-xs hover:underline ${
                            isOwn ? "text-green-200 hover:text-white" : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          {isTranslating ? "..." : "🌐 Перевести"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-6 py-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "..." : "Send"}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
