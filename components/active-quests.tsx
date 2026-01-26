"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"

const quests = [
  { id: 1, title: "Complete React Project", category: "Projects", progress: 65 },
  { id: 2, title: "Ship Personal Site", category: "Areas", progress: 40 },
  { id: 3, title: "Learn Rust Fundamentals", category: "Resources", progress: 25 },
]

export function ActiveQuests() {
  return (
    <Card className="glass-panel border-white/[0.08] bg-[#0a0a0a]/60 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-white/20">
      <CardHeader>
        <CardTitle className="font-mono text-sm uppercase tracking-wider text-violet-400">Active Quests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {quests.map((quest, i) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-lg border border-white/[0.06] bg-[#0a0a0a]/40 p-4 transition-all hover:border-white/20"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{quest.title}</p>
              <span className="font-mono text-xs text-muted-foreground">{quest.progress}%</span>
            </div>
            <p className="mb-2 font-mono text-xs text-violet-400/70">{quest.category}</p>
            <Progress value={quest.progress} className="h-0.5" />
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}
