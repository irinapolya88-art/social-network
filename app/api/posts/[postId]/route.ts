import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

// Delete a post
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { postId } = await params

  // Find the post
  const post = await prisma.post.findUnique({
    where: { id: postId },
  })

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  // Check ownership
  if (post.authorId !== session.user.id) {
    return NextResponse.json(
      { error: "Cannot delete others' posts" },
      { status: 403 }
    )
  }

  await prisma.post.delete({
    where: { id: postId },
  })

  return NextResponse.json({ success: true })
}
