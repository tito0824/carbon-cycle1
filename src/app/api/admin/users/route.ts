import { NextResponse } from "next/server"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getServerSession } from "next-auth"
import { userStore } from "@/lib/userStore"

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentUser = await userStore.get(session.user.email)
  
  if (currentUser?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 })
  }

  const allUsers = await userStore.getAll()

  return NextResponse.json({ users: allUsers })
}
