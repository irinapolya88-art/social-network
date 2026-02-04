"use client"

import { useEffect, useState, use, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface UserProfile {
  id: string
  name: string
  email: string
  avatar: string | null
  bio: string | null
  createdAt: string
}

interface Post {
  id: string
  content: string | null
  media: string | null
  mediaType: string | null
  createdAt: string
  author: {
    id: string
    name: string
    avatar: string | null
  }
}

export default function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params)
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isContact, setIsContact] = useState(false)
  const [contactLoading, setContactLoading] = useState(false)
  const router = useRouter()

  // Posts state
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [postContent, setPostContent] = useState("")
  const [postMedia, setPostMedia] = useState<string | null>(null)
  const [postMediaType, setPostMediaType] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isOwnProfile = session?.user?.id === resolvedParams.userId

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchProfile()
      fetchPosts()
      if (!isOwnProfile) {
        checkContactStatus()
      }
    }
  }, [session, resolvedParams.userId])

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profile/${resolvedParams.userId}`)
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/posts?userId=${resolvedParams.userId}`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data)
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error)
    } finally {
      setPostsLoading(false)
    }
  }

  const checkContactStatus = async () => {
    try {
      const res = await fetch(`/api/contacts/check?userId=${resolvedParams.userId}`)
      if (res.ok) {
        const data = await res.json()
        setIsContact(data.isContact)
      }
    } catch (error) {
      console.error("Failed to check contact status:", error)
    }
  }

  const toggleContact = async () => {
    setContactLoading(true)
    try {
      if (isContact) {
        await fetch("/api/contacts", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactId: resolvedParams.userId }),
        })
        setIsContact(false)
      } else {
        await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactId: resolvedParams.userId }),
        })
        setIsContact(true)
      }
    } catch (error) {
      console.error("Failed to toggle contact:", error)
    } finally {
      setContactLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")

    if (!isImage && !isVideo) {
      alert("Please select an image or video file")
      return
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPostMedia(reader.result as string)
      setPostMediaType(isImage ? "image" : "video")
    }
    reader.readAsDataURL(file)
  }

  const removeMedia = () => {
    setPostMedia(null)
    setPostMediaType(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const createPost = async () => {
    if (!postContent.trim() && !postMedia) return

    setPosting(true)
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: postContent.trim() || null,
          media: postMedia,
          mediaType: postMediaType,
        }),
      })

      if (res.ok) {
        const newPost = await res.json()
        setPosts([newPost, ...posts])
        setPostContent("")
        removeMedia()
      }
    } catch (error) {
      console.error("Failed to create post:", error)
    } finally {
      setPosting(false)
    }
  }

  const deletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== postId))
      }
    } catch (error) {
      console.error("Failed to delete post:", error)
    }
  }

  const deleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your page?")) return

    try {
      const res = await fetch("/api/account", { method: "DELETE" })
      if (res.ok) {
        signOut({ callbackUrl: "/" })
      }
    } catch (error) {
      console.error("Failed to delete account:", error)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-emerald-700">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-emerald-700">
        <div className="text-center text-white">
          <p className="text-xl mb-4">User not found</p>
          <Link href="/chat" className="underline">Back to chats</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-emerald-700">
      <header className="p-4 flex items-center gap-4">
        <Link href="/chat" className="text-white hover:text-green-200">
          ← Back
        </Link>
        <h1 className="text-xl font-bold text-white">Profile</h1>
      </header>

      <main className="p-4 max-w-md mx-auto space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          {/* Avatar */}
          <div className="flex justify-center mb-6">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-green-500"
              />
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-green-500">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name */}
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            {profile.name}
          </h2>

          {/* Email */}
          <p className="text-center text-gray-500 mb-4">{profile.email}</p>

          {/* Bio */}
          {profile.bio && (
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <p className="text-gray-700">{profile.bio}</p>
            </div>
          )}

          {/* Member since */}
          <p className="text-center text-gray-400 text-sm mb-6">
            Member since {new Date(profile.createdAt).toLocaleDateString("en-US")}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {isOwnProfile ? (
              <>
                <Link
                  href="/profile/edit"
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold text-center hover:bg-green-700 transition"
                >
                  Edit Profile
                </Link>
                <button
                  onClick={deleteAccount}
                  className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  Delete Page
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={toggleContact}
                  disabled={contactLoading}
                  className={`w-full py-3 rounded-lg font-semibold transition disabled:opacity-50 ${
                    isContact
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {contactLoading
                    ? "..."
                    : isContact
                    ? "Remove from Contacts"
                    : "Add to Contacts"}
                </button>
                <Link
                  href={`/chat/${profile.id}`}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold text-center hover:bg-green-700 transition"
                >
                  Send Message
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Create Post Form (only on own profile) */}
        {isOwnProfile && (
          <div className="bg-white rounded-2xl p-4 shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-3">Create Post</h3>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
            />

            {/* Media Preview */}
            {postMedia && (
              <div className="relative mt-3">
                {postMediaType === "image" ? (
                  <img
                    src={postMedia}
                    alt="Preview"
                    className="w-full max-h-64 object-contain rounded-lg"
                  />
                ) : (
                  <video
                    src={postMedia}
                    controls
                    className="w-full max-h-64 rounded-lg"
                  />
                )}
                <button
                  onClick={removeMedia}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                >
                  X
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 mt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Add Photo/Video
              </button>
              <button
                onClick={createPost}
                disabled={posting || (!postContent.trim() && !postMedia)}
                className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold text-lg">
            {isOwnProfile ? "Your Posts" : `${profile.name}'s Posts`}
          </h3>

          {postsLoading ? (
            <div className="bg-white rounded-2xl p-6 shadow-xl text-center text-gray-500">
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 shadow-xl text-center text-gray-500">
              No posts yet
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl p-4 shadow-xl">
                {/* Post Header */}
                <div className="flex items-center gap-3 mb-3">
                  {post.author.avatar ? (
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                      {post.author.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{post.author.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {isOwnProfile && (
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {/* Post Content */}
                {post.content && (
                  <p className="text-gray-700 mb-3">{post.content}</p>
                )}

                {/* Post Media */}
                {post.media && (
                  <div className="rounded-lg overflow-hidden">
                    {post.mediaType === "image" ? (
                      <img
                        src={post.media}
                        alt="Post media"
                        className="w-full max-h-96 object-contain bg-gray-100"
                      />
                    ) : (
                      <video
                        src={post.media}
                        controls
                        className="w-full max-h-96"
                      />
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
