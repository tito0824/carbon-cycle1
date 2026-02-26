"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

interface User {
  id: string
  email: string
  name: string
  role: string
}

export default function AdminPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.role === "admin") {
      loadUsers()
    }
  }, [session])

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/admin/users")
      const data = await res.json()
      if (data.users) {
        setUsers(data.users)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  if (!session || session.user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="text-red-500">无权访问</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="text-[#00d4aa]">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111] text-white pb-24">
      <div className="max-w-md mx-auto p-4">
        <div className="flex justify-between items-center py-4">
          <div className="text-xl font-bold text-[#00d4aa]">管理员后台</div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4">
          <div className="text-sm text-[#666] mb-2">用户总数</div>
          <div className="text-3xl font-bold text-[#00d4aa]">{users.length}</div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-4">
          <div className="text-sm text-[#666] mb-3">用户列表</div>
          {users.length === 0 ? (
            <div className="text-center py-8 text-[#444]">暂无用户</div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="flex justify-between items-center py-3 border-b border-[#222] last:border-0">
                <div>
                  <div className="text-sm">{user.name}</div>
                  <div className="text-xs text-[#666]">{user.email}</div>
                </div>
                <div className={`text-xs px-2 py-1 rounded ${user.role === "admin" ? "bg-[#ff6b6b]" : "bg-[#00d4aa] text-black"}`}>
                  {user.role}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] flex justify-around py-3 border-t border-[#222]">
        <button onClick={() => window.location.href = "/"} className="text-[#666] text-xs">返回</button>
      </div>
    </div>
  )
}
