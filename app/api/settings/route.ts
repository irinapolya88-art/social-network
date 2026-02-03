import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { language: true }
  })

  return NextResponse.json({ language: user?.language || "ru" })
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { language } = await request.json()

  if (!language || typeof language !== "string") {
    return NextResponse.json({ error: "Language is required" }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { language },
    select: { language: true }
  })

  return NextResponse.json({ language: user.language })
}
