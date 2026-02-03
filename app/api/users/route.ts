import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: session.user.id }
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    }
  })

  return NextResponse.json(users)
}
