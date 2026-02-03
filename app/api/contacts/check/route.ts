import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const contactId = searchParams.get("userId")

  if (!contactId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 })
  }

  const contact = await prisma.contact.findUnique({
    where: {
      ownerId_contactId: {
        ownerId: session.user.id,
        contactId: contactId,
      },
    },
  })

  return NextResponse.json({ isContact: !!contact })
}
