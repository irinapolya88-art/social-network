import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

// Get posts by userId
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }

  const posts = await prisma.post.findMany({
    where: { authorId: userId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(posts)
}

// Create a new post
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { content, media, mediaType } = await request.json()

  if (!content && !media) {
    return NextResponse.json(
      { error: "Content or media required" },
      { status: 400 }
    )
  }

  if (media && !mediaType) {
    return NextResponse.json(
      { error: "mediaType required when media is provided" },
      { status: 400 }
    )
  }

  const post = await prisma.post.create({
    data: {
      content: content || null,
      media: media || null,
      mediaType: mediaType || null,
      authorId: session.user.id,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  })

  return NextResponse.json(post)
}
