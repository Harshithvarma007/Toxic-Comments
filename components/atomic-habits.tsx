"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { motion, AnimatePresence } from "framer-motion"

const initialHabits = [
  { id: 1, title: "Morning Jog (5km)", xp: 50, completed: false },
  { id: 2, title: "Read 20 Pages", xp: 30, completed: false },
  { id: 3, title: "No Sugar", xp: 40, completed: false },
  { id: 4, title: "Meditation (15min)", xp: 35, completed: false },
]

export function AtomicHabits() {
  const [habits, setHabits] = useState(initialHabits)
  const [flashingId, setFlashingId] = useState<number | null>(null)

  const toggleHabit = (id: number) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h)))
    setFlashingId(id)
    setTimeout(() => setFlashingId(null), 600)
  }

  return (
    <Card className="glass-panel border-white/[0.08] bg-[#0a0a0a]/60 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-white/20">
      <CardHeader>
        <CardTitle className="font-mono text-sm uppercase tracking-wider text-green-400">Daily Habits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {habits.map((habit) => (
          <motion.div
            key={habit.id}
            className={`relative flex items-center gap-3 rounded-lg border border-white/[0.06] bg-[#0a0a0a]/40 p-3 transition-all ${
              flashingId === habit.id ? "bg-green-500/20" : ""
            }`}
            whileHover={{ y: -2 }}
          >
            <Checkbox checked={habit.completed} onCheckedChange={() => toggleHabit(habit.id)} />
            <div className="flex-1">
              <p className={`text-sm ${habit.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {habit.title}
              </p>
            </div>
            <AnimatePresence>
              {flashingId === habit.id && !habit.completed && (
                <motion.span
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: -20 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-3 top-0 font-mono text-xs font-bold text-green-400"
                >
                  +{habit.xp} XP
                </motion.span>
              )}
            </AnimatePresence>
            <span className="font-mono text-xs text-muted-foreground">{habit.xp} XP</span>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}
