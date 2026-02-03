import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, bio, avatar } = await request.json()

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name || undefined,
      bio: bio || null,
      avatar: avatar || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      bio: true,
    },
  })

  return NextResponse.json(user)
}
