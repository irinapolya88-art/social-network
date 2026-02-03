import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const otherUserId = searchParams.get("userId")

  if (!otherUserId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 })
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: session.user.id },
      ]
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    }
  })

  return NextResponse.json(messages)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { receiverId, content } = await req.json()

  if (!receiverId || !content) {
    return NextResponse.json(
      { error: "Receiver and content required" },
      { status: 400 }
    )
  }

  const message = await prisma.message.create({
    data: {
      content,
      senderId: session.user.id,
      receiverId,
    },
    include: {
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    }
  })

  return NextResponse.json(message)
}
