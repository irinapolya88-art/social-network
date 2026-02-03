import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

// Get my contacts
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const contacts = await prisma.contact.findMany({
    where: { ownerId: session.user.id },
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(contacts.map((c) => c.contact))
}

// Add contact
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { contactId } = await request.json()

  if (!contactId) {
    return NextResponse.json({ error: "Contact ID required" }, { status: 400 })
  }

  if (contactId === session.user.id) {
    return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 })
  }

  // Check if contact exists
  const userExists = await prisma.user.findUnique({
    where: { id: contactId },
  })

  if (!userExists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Add contact (both ways - mutual)
  await prisma.contact.upsert({
    where: {
      ownerId_contactId: {
        ownerId: session.user.id,
        contactId: contactId,
      },
    },
    update: {},
    create: {
      ownerId: session.user.id,
      contactId: contactId,
    },
  })

  // Add reverse contact (so both users have each other)
  await prisma.contact.upsert({
    where: {
      ownerId_contactId: {
        ownerId: contactId,
        contactId: session.user.id,
      },
    },
    update: {},
    create: {
      ownerId: contactId,
      contactId: session.user.id,
    },
  })

  return NextResponse.json({ success: true })
}

// Remove contact
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { contactId } = await request.json()

  if (!contactId) {
    return NextResponse.json({ error: "Contact ID required" }, { status: 400 })
  }

  // Remove contact (both ways)
  await prisma.contact.deleteMany({
    where: {
      OR: [
        { ownerId: session.user.id, contactId: contactId },
        { ownerId: contactId, contactId: session.user.id },
      ],
    },
  })

  return NextResponse.json({ success: true })
}
