import { NextResponse } from "next/server"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getServerSession } from "next-auth"
import { dataStore, defaultData } from "@/lib/dataStore"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await dataStore.get(session.user.id)
  return NextResponse.json(data || defaultData)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await request.json()
  await dataStore.set(session.user.id, data)
  
  return NextResponse.json({ success: true })
}
