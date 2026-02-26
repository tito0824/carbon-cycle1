import { NextResponse } from "next/server"
import { userStore } from "@/lib/userStore"

const ADMIN_SECRET = process.env.ADMIN_SECRET || "admin123"

export async function POST(request: Request) {
  const { email, password, name, adminCode } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  if (await userStore.has(email)) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 })
  }

  const isAdmin = adminCode === ADMIN_SECRET
  const id = `user_${Date.now()}`
  
  await userStore.set(email, { 
    id, 
    email, 
    password, 
    name: name || email.split("@")[0],
    role: isAdmin ? "admin" : "user"
  })

  return NextResponse.json({ success: true, isAdmin })
}
