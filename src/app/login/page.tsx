"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (isLogin) {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        setError("邮箱或密码错误")
      } else {
        router.push("/")
      }
    } else {
      const adminCodeInput = document.getElementById("adminCode") as HTMLInputElement
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, adminCode: adminCodeInput?.value }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })
        if (!result?.error) {
          router.push("/")
        }
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#00d4aa]">碳循环饮食助手</h1>
          <p className="text-gray-500 mt-2">{isLogin ? "登录" : "注册"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="昵称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white"
              />
              <input
                type="text"
                placeholder="管理员邀请码 (可选)"
                id="adminCode"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white"
              />
            </>
          )}
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white"
            required
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white"
            required
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#00d4aa] text-black font-semibold rounded-lg disabled:opacity-50"
          >
            {loading ? "请稍候..." : isLogin ? "登录" : "注册"}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-500">
          {isLogin ? "没有账号？" : "已有账号？"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#00d4aa] ml-1"
          >
            {isLogin ? "注册" : "登录"}
          </button>
        </p>
      </div>
    </div>
  )
}
