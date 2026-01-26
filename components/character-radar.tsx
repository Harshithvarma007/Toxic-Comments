"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts"

const stats = [
  { stat: "Vitality", value: 85 },
  { stat: "Strength", value: 72 },
  { stat: "Intelligence", value: 90 },
  { stat: "Will", value: 78 },
  { stat: "Wisdom", value: 68 },
]

export function CharacterRadar() {
  return (
    <Card className="glass-panel border-white/[0.08] bg-[#0a0a0a]/60 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-white/20">
      <CardHeader>
        <CardTitle className="font-mono text-sm uppercase tracking-wider text-blue-400">Character Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={stats}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="stat" tick={{ fill: "#888", fontSize: 11, fontFamily: "monospace" }} />
            <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} dot={{ fill: "#fff", r: 3 }} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
