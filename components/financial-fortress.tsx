"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, ResponsiveContainer, XAxis } from "recharts"
import { Lock } from "lucide-react"

const weeklyData = [
  { day: "Mon", income: 450, spend: 200 },
  { day: "Tue", income: 300, spend: 180 },
  { day: "Wed", income: 520, spend: 250 },
  { day: "Thu", income: 400, spend: 150 },
  { day: "Fri", income: 600, spend: 300 },
  { day: "Sat", income: 200, spend: 400 },
  { day: "Sun", income: 350, spend: 180 },
]

const wishlistItems = [
  { name: "MacBook Pro M4", price: "$3,499", requiredLevel: 15, stat: "Wisdom" },
  { name: "Standing Desk", price: "$899", requiredLevel: 10, stat: "Vitality" },
]

export function FinancialFortress() {
  return (
    <Card className="glass-panel border-white/[0.08] bg-[#0a0a0a]/60 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-white/20">
      <CardHeader>
        <CardTitle className="font-mono text-sm uppercase tracking-wider text-emerald-400">Financial Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-xs text-muted-foreground">Net Worth</p>
          <p className="font-mono text-4xl font-bold tracking-tighter text-white">$24,750</p>
        </div>

        <div>
          <p className="mb-2 text-xs text-muted-foreground">Last 7 Days Activity</p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fill: "#666", fontSize: 10 }} axisLine={false} />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Locked Wishlist</p>
          {wishlistItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-[#0a0a0a]/40 p-3 opacity-50"
            >
              <Lock className="size-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-foreground">{item.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  Requires Lvl {item.requiredLevel} {item.stat}
                </p>
              </div>
              <span className="font-mono text-xs text-foreground">{item.price}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
