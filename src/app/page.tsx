"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

const QUICK_FOODS = [
  { n: "米饭", c: 28, p: 2.6, f: 0.3 },
  { n: "鸡胸", c: 0, p: 31, f: 3.6 },
  { n: "鸡蛋", c: 0.6, p: 13, f: 11 },
  { n: "香蕉", c: 23, p: 1.1, f: 0.2 },
  { n: "红薯", c: 20, p: 1.6, f: 0.1 },
  { n: "燕麦", c: 12, p: 2.4, f: 1.4 },
  { n: "牛奶", c: 5, p: 3.4, f: 1.9 },
  { n: "牛肉", c: 0, p: 26, f: 15 },
]

const MUSCLES = ["胸", "背", "腿", "肩", "手臂", "核心", "有氧"]
const CYCLE = ["high", "mid", "low", "mid", "high", "low", "rest"]
const TYPE_NAME: Record<string, string> = { high: "高碳日", mid: "中碳日", low: "低碳日", rest: "休息日" }

interface Food {
  n: string
  c: number
  p: number
  f: number
  t: string
}

interface Exercise {
  n: string
  s: number
  r: number
  d: boolean
}

interface DayRecord {
  t: string
  f: Food[]
}

interface WorkoutRecord {
  e: Exercise[]
}

interface AppData {
  user: { w: number; tw: number }
  t: { hc: number; mc: number; lc: number; p: number }
  r: Record<string, DayRecord>
  w: Record<string, WorkoutRecord>
}

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [date, setDate] = useState(new Date())
  const [data, setData] = useState<AppData>({
    user: { w: 70, tw: 65 },
    t: { hc: 200, mc: 120, lc: 60, p: 180 },
    r: {},
    w: {},
  })
  const [activeTab, setActiveTab] = useState("record")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      loadData()
    }
  }, [session])

  const loadData = async () => {
    try {
      const res = await fetch("/api/data")
      if (res.ok) {
        const loaded = await res.json()
        setData(loaded)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const saveData = async (newData: AppData) => {
    setData(newData)
    try {
      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      })
    } catch (e) {
      console.error(e)
    }
  }

  const key = (d?: Date) => (d || date).toISOString().split("T")[0]
  const cycle = (d?: Date) => CYCLE[(d || date).getDay()]

  const ensureTodayData = () => {
    const k = key()
    const newData = { ...data }
    if (!newData.r[k]) newData.r[k] = { t: cycle(), f: [] }
    if (!newData.w[k]) newData.w[k] = { e: [] }
    return newData
  }

  const changeDate = (d: number) => {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + d)
    setDate(newDate)
    const newData = ensureTodayData()
    setData(newData)
  }

  const changeDayType = (type: string) => {
    const newData = { ...data }
    const k = key()
    if (!newData.r[k]) newData.r[k] = { t: type, f: [] }
    newData.r[k].t = type
    saveData(newData)
  }

  const getCurrentRecord = () => {
    const k = key()
    return data.r[k] || { t: cycle(), f: [] }
  }

  const getCurrentWorkout = () => {
    const k = key()
    return data.w[k] || { e: [] }
  }

  const getTodayType = () => {
    const k = key()
    return data.r[k]?.t || cycle()
  }

  const getTargetCarb = () => {
    const t = getTodayType()
    if (t === "high") return data.t.hc
    if (t === "mid") return data.t.mc
    return data.t.lc
  }

  const getTotals = () => {
    const foods = getCurrentRecord().f
    return foods.reduce(
      (acc, f) => ({ c: acc.c + f.c, p: acc.p + f.p, f: acc.f + f.f }),
      { c: 0, p: 0, f: 0 }
    )
  }

  const addQuickFood = (food: { n: string; c: number; p: number; f: number }) => {
    const newData = ensureTodayData()
    const k = key()
    newData.r[k].f.push({
      ...food,
      t: new Date().toTimeString().slice(0, 5),
    })
    saveData(newData)
  }

  const addFood = () => {
    const nameInput = document.getElementById("foodName") as HTMLInputElement
    const carbInput = document.getElementById("foodCarb") as HTMLInputElement
    const proteinInput = document.getElementById("foodProtein") as HTMLInputElement
    const fatInput = document.getElementById("foodFat") as HTMLInputElement
    
    const name = nameInput?.value.trim() || ""
    const c = +(carbInput?.value || 0)
    const p = +(proteinInput?.value || 0)
    const f = +(fatInput?.value || 0)
    if (!name) return

    const newData = ensureTodayData()
    const k = key()
    newData.r[k].f.push({ n: name, c, p, f, t: new Date().toTimeString().slice(0, 5) })
    nameInput.value = ""
    carbInput.value = ""
    proteinInput.value = ""
    fatInput.value = ""
    saveData(newData)
  }

  const deleteFood = (index: number) => {
    const newData = { ...data }
    const k = key()
    newData.r[k].f.splice(index, 1)
    saveData(newData)
  }

  const addMuscle = (muscle: string) => {
    const exercises: Record<string, string[]> = {
      胸: ["卧推", "飞鸟", "夹胸"],
      背: ["引体", "划船", "下拉"],
      腿: ["深蹲", "硬拉", "腿举"],
      肩: ["推举", "侧平举", "面拉"],
      手臂: ["弯举", "下压"],
      核心: ["卷腹", "平板"],
      有氧: ["跑步", "骑行"],
    }
    const ex = exercises[muscle] || []
    const newData = ensureTodayData()
    const k = key()
    ex.forEach((n) => newData.w[k].e.push({ n, s: 4, r: 12, d: false }))
    saveData(newData)
  }

  const addExercise = () => {
    const nameInput = document.getElementById("exerciseName") as HTMLInputElement
    const setsInput = document.getElementById("exerciseSets") as HTMLInputElement
    const repsInput = document.getElementById("exerciseReps") as HTMLInputElement
    
    const name = nameInput?.value.trim() || ""
    const s = +(setsInput?.value || 4)
    const r = +(repsInput?.value || 12)
    if (!name) return

    const newData = ensureTodayData()
    const k = key()
    newData.w[k].e.push({ n: name, s, r, d: false })
    nameInput.value = ""
    saveData(newData)
  }

  const toggleExercise = (index: number) => {
    const newData = { ...data }
    const k = key()
    newData.w[k].e[index].d = !newData.w[k].e[index].d
    saveData(newData)
  }

  const deleteExercise = (index: number) => {
    const newData = { ...data }
    const k = key()
    newData.w[k].e.splice(index, 1)
    saveData(newData)
  }

  const saveSettings = () => {
    const weightInput = document.getElementById("weight") as HTMLInputElement
    const targetWeightInput = document.getElementById("targetWeight") as HTMLInputElement
    const highCarbInput = document.getElementById("highCarb") as HTMLInputElement
    const midCarbInput = document.getElementById("midCarb") as HTMLInputElement
    const lowCarbInput = document.getElementById("lowCarb") as HTMLInputElement
    const targetProteinInput = document.getElementById("targetProtein") as HTMLInputElement

    const newData = {
      ...data,
      user: {
        w: +(weightInput?.value || 70),
        tw: +(targetWeightInput?.value || 65),
      },
      t: {
        hc: +(highCarbInput?.value || 200),
        mc: +(midCarbInput?.value || 120),
        lc: +(lowCarbInput?.value || 60),
        p: +(targetProteinInput?.value || 180),
      },
    }
    saveData(newData)
  }

  const getHistoryList = () => {
    return Object.keys(data.r)
      .sort()
      .reverse()
      .filter((k) => data.r[k]?.f?.length)
      .slice(0, 14)
  }

  const goToDate = (k: string) => {
    const [y, m, d] = k.split("-")
    setDate(new Date(Number(y), Number(m) - 1, Number(d)))
    setActiveTab("record")
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="text-[#00d4aa]">加载中...</div>
      </div>
    )
  }

  const totals = getTotals()
  const todayType = getTodayType()
  const targetCarb = getTargetCarb()
  const calories = totals.c * 4 + totals.p * 4 + totals.f * 9

  const getDateDisplay = () => {
    const today = new Date()
    return date.toDateString() === today.toDateString() ? "今天" : `${date.getMonth() + 1}月${date.getDate()}日`
  }

  return (
    <div className="min-h-screen bg-[#111] text-white pb-8">
      <div className="max-w-md mx-auto p-4">
        <div className="flex justify-between items-center py-4">
          <div className="text-xl font-bold text-[#00d4aa]">健身助手</div>
          <div className="flex gap-3">
            {(session as any)?.user?.role === "admin" && (
              <button onClick={() => router.push("/admin")} className="text-sm text-[#ff6b6b]">
                管理
              </button>
            )}
            <button onClick={() => signOut()} className="text-sm text-gray-500">
              退出
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mb-2">
          <button className="w-8 h-8 bg-[#222] rounded-lg flex items-center justify-center" onClick={() => changeDate(-1)}>
            ‹
          </button>
          <span className="text-[#888]">{getDateDisplay()}</span>
          <button className="w-8 h-8 bg-[#222] rounded-lg flex items-center justify-center" onClick={() => changeDate(1)}>
            ›
          </button>
        </div>

        <div className="flex justify-around mb-4">
          <button
            onClick={() => setActiveTab("record")}
            className={`py-2 px-4 rounded-lg text-sm ${activeTab === "record" ? "bg-[#00d4aa] text-black" : "text-[#666]"}`}
          >
            📝 记录
          </button>
          <button
            onClick={() => setActiveTab("train")}
            className={`py-2 px-4 rounded-lg text-sm ${activeTab === "train" ? "bg-[#00d4aa] text-black" : "text-[#666]"}`}
          >
            💪 训练
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-2 px-4 rounded-lg text-sm ${activeTab === "history" ? "bg-[#00d4aa] text-black" : "text-[#666]"}`}
          >
            📅 历史
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`py-2 px-4 rounded-lg text-sm ${activeTab === "settings" ? "bg-[#00d4aa] text-black" : "text-[#666]"}`}
          >
            ⚙️ 设置
          </button>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-2 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => changeDayType("high")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${todayType === "high" ? "bg-[#ff6b6b] text-black" : "bg-[#252525] text-[#666]"}`}
            >
              高碳日 {data.t.hc}g
            </button>
            <button
              onClick={() => changeDayType("mid")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${todayType === "mid" ? "bg-[#ffd93d] text-black" : "bg-[#252525] text-[#666]"}`}
            >
              中碳日 {data.t.mc}g
            </button>
            <button
              onClick={() => changeDayType("low")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${todayType === "low" ? "bg-[#6bcb77] text-black" : "bg-[#252525] text-[#666]"}`}
            >
              低碳日 {data.t.lc}g
            </button>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-4 mb-3">
          <div className="text-sm text-[#666] mb-3">今日摄入</div>
          
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#ff6b6b]">碳水</span>
              <span className="text-[#666]">{totals.c.toFixed(0)}g / {targetCarb}g</span>
            </div>
            <div className="h-2 bg-[#333] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${totals.c > targetCarb ? "bg-[#ff4757]" : "bg-[#ff6b6b]"}`}
                style={{ width: `${Math.min(100, (totals.c / targetCarb) * 100)}%` }}
              />
            </div>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#00d4aa]">蛋白质</span>
              <span className="text-[#666]">{totals.p.toFixed(0)}g / {data.t.p}g</span>
            </div>
            <div className="h-2 bg-[#333] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${totals.p > data.t.p ? "bg-[#00d4aa]" : "bg-[#00d4aa]"}`}
                style={{ width: `${Math.min(100, (totals.p / data.t.p) * 100)}%` }}
              />
            </div>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#ffd93d]">脂肪</span>
              <span className="text-[#666]">{totals.f.toFixed(0)}g</span>
            </div>
            <div className="h-2 bg-[#333] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#ffd93d] transition-all"
                style={{ width: `${Math.min(100, (totals.f / 60) * 100)}%` }}
              />
            </div>
          </div>

          <div className="text-center text-sm text-[#666] pt-2 border-t border-[#222]">
            总热量: <span className="text-white font-semibold">{Math.round(calories)}</span> kcal
          </div>
        </div>



        {activeTab === "record" && (
          <>
            <div className="bg-[#1a1a1a] rounded-xl p-4 mb-3">
              <div className="text-xs text-[#666] mb-3">快速添加</div>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_FOODS.map((f) => (
                  <button
                    key={f.n}
                    onClick={() => addQuickFood(f)}
                    className="py-2 bg-[#252525] rounded-lg text-xs"
                  >
                    {f.n}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <div className="flex flex-wrap gap-2 mb-3">
                <input
                  id="foodName"
                  placeholder="食物"
                  className="flex-1 min-w-[120px] px-3 py-2 bg-[#252525] border border-[#333] rounded-lg text-white text-sm"
                />
                <input
                  id="foodCarb"
                  placeholder="C"
                  className="w-14 px-2 py-2 bg-[#252525] border border-[#333] rounded-lg text-white text-sm"
                />
                <input
                  id="foodProtein"
                  placeholder="P"
                  className="w-14 px-2 py-2 bg-[#252525] border border-[#333] rounded-lg text-white text-sm"
                />
                <input
                  id="foodFat"
                  placeholder="F"
                  className="w-14 px-2 py-2 bg-[#252525] border border-[#333] rounded-lg text-white text-sm"
                />
                <button
                  onClick={addFood}
                  className="px-4 py-2 bg-[#00d4aa] text-black font-semibold rounded-lg"
                >
                  +
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {getCurrentRecord().f.length === 0 ? (
                  <div className="text-center py-8 text-[#444] text-sm">暂无记录</div>
                ) : (
                  getCurrentRecord().f.map((food, i) => (
                    <div key={i} className="flex justify-between items-center py-2 bg-[#252525] rounded-lg mb-2 px-3">
                      <div>
                        <div className="text-sm">{food.n}</div>
                        <div className="text-xs text-[#666]">
                          <span className="text-[#ff6b6b]">C:{food.c}g</span>
                          <span className="ml-2 text-[#00d4aa]">P:{food.p}g</span>
                          <span className="ml-2 text-[#ffd93d]">F:{food.f}g</span>
                        </div>
                      </div>
                      <button onClick={() => deleteFood(i)} className="text-[#ff4757] text-lg px-2">
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "train" && (
          <>
            <div className="bg-[#1a1a1a] rounded-xl p-4 mb-3">
              <div className="text-xs text-[#666] mb-3">今日训练</div>
              <div className="grid grid-cols-4 gap-2">
                {MUSCLES.map((m) => (
                  <button
                    key={m}
                    onClick={() => addMuscle(m)}
                    className="py-2 bg-[#252525] rounded-lg text-xs"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-4 mb-3">
              <div className="flex flex-wrap gap-2 mb-3">
                <input
                  id="exerciseName"
                  placeholder="动作名称"
                  className="flex-1 min-w-[120px] px-3 py-2 bg-[#252525] border border-[#333] rounded-lg text-white text-sm"
                />
                <input
                  id="exerciseSets"
                  placeholder="组"
                  className="w-14 px-2 py-2 bg-[#252525] border border-[#333] rounded-lg text-white text-sm"
                />
                <input
                  id="exerciseReps"
                  placeholder="次"
                  className="w-14 px-2 py-2 bg-[#252525] border border-[#333] rounded-lg text-white text-sm"
                />
                <button onClick={addExercise} className="px-4 py-2 bg-[#00d4aa] text-black font-semibold rounded-lg">
                  +
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {getCurrentWorkout().e.length === 0 ? (
                  <div className="text-center py-8 text-[#444] text-sm">暂无训练</div>
                ) : (
                  getCurrentWorkout().e.map((ex, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-2 bg-[#252525] rounded-lg mb-2 px-3"
                      style={{ opacity: ex.d ? 0.5 : 1 }}
                    >
                      <div onClick={() => toggleExercise(i)}>
                        <div className="text-sm" style={{ textDecoration: ex.d ? "line-through" : "none" }}>
                          {ex.n}
                        </div>
                        <div className="text-xs text-[#666]">{ex.s}组 × {ex.r}次</div>
                      </div>
                      <button onClick={() => deleteExercise(i)} className="text-[#ff4757] text-lg px-2">
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <div className="text-xs text-[#666] mb-3">本周计划</div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {["日", "一", "二", "三", "四", "五", "六"].map((d, i) => (
                  <div key={d} className="py-2 bg-[#252525] rounded-lg text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${CYCLE[i] === "high" ? "bg-[#ff6b6b]" : CYCLE[i] === "mid" ? "bg-[#ffd93d]" : "bg-[#6bcb77]"}`} />
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "history" && (
          <div className="bg-[#1a1a1a] rounded-xl p-4">
            {getHistoryList().length === 0 ? (
              <div className="text-center py-8 text-[#444] text-sm">暂无历史</div>
            ) : (
              getHistoryList().map((k) => {
                const dayData = data.r[k]
                const t = dayData?.f?.reduce((a, f) => ({ c: a.c + f.c, p: a.p + f.p, f: a.f + f.f }), { c: 0, p: 0, f: 0 }) || { c: 0, p: 0, f: 0 }
                const d = new Date(k)
                return (
                  <div
                    key={k}
                    onClick={() => goToDate(k)}
                    className="flex justify-between py-3 bg-[#252525] rounded-lg mb-2 px-3 cursor-pointer"
                  >
                    <span className="text-sm">{d.getMonth() + 1}月{d.getDate()}日</span>
                    <span className="text-xs text-[#666]">
                      C:{t.c.toFixed(0)} P:{t.p.toFixed(0)} F:{t.f.toFixed(0)}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-[#1a1a1a] rounded-xl p-4">
            <div className="flex justify-between py-3 border-b border-[#222]">
              <span className="text-sm">体重 (kg)</span>
              <input
                id="weight"
                defaultValue={data.user.w}
                onChange={saveSettings}
                className="w-20 px-2 py-1 bg-[#252525] border border-[#333] rounded text-right text-white"
              />
            </div>
            <div className="flex justify-between py-3 border-b border-[#222]">
              <span className="text-sm">目标体重 (kg)</span>
              <input
                id="targetWeight"
                defaultValue={data.user.tw}
                onChange={saveSettings}
                className="w-20 px-2 py-1 bg-[#252525] border border-[#333] rounded text-right text-white"
              />
            </div>
            <div className="flex justify-between py-3 border-b border-[#222]">
              <span className="text-sm">高碳日碳水 (g)</span>
              <input
                id="highCarb"
                defaultValue={data.t.hc}
                onChange={saveSettings}
                className="w-20 px-2 py-1 bg-[#252525] border border-[#333] rounded text-right text-white"
              />
            </div>
            <div className="flex justify-between py-3 border-b border-[#222]">
              <span className="text-sm">中碳日碳水 (g)</span>
              <input
                id="midCarb"
                defaultValue={data.t.mc}
                onChange={saveSettings}
                className="w-20 px-2 py-1 bg-[#252525] border border-[#333] rounded text-right text-white"
              />
            </div>
            <div className="flex justify-between py-3 border-b border-[#222]">
              <span className="text-sm">低碳日碳水 (g)</span>
              <input
                id="lowCarb"
                defaultValue={data.t.lc}
                onChange={saveSettings}
                className="w-20 px-2 py-1 bg-[#252525] border border-[#333] rounded text-right text-white"
              />
            </div>
            <div className="flex justify-between py-3">
              <span className="text-sm">蛋白质 (g)</span>
              <input
                id="targetProtein"
                defaultValue={data.t.p}
                onChange={saveSettings}
                className="w-20 px-2 py-1 bg-[#252525] border border-[#333] rounded text-right text-white"
              />
            </div>
          </div>
        )}
      </div>


    </div>
  )
}
