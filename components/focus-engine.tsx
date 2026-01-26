"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlayCircle, PauseCircle } from "lucide-react"
import { motion } from "framer-motion"

export function FocusEngine() {
  const [isActive, setIsActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState("00:45:00")

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card
        className={`glass-panel border-white/[0.08] bg-[#0a0a0a]/60 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-white/20 ${
          isActive ? "border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-pulse" : ""
        }`}
      >
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-blue-400">Deep Work Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="font-mono text-6xl font-bold tracking-tighter text-white">{timeRemaining}</div>
            <p className="mt-2 text-sm text-muted-foreground">Focus Time Remaining</p>
          </div>
          <motion.div whileTap={{ scale: 0.96 }}>
            <Button
              onClick={() => setIsActive(!isActive)}
              className="w-full bg-blue-500 font-mono text-sm uppercase tracking-wider hover:bg-blue-600"
              size="lg"
            >
              {isActive ? (
                <>
                  <PauseCircle className="mr-2 size-5" />
                  Pause Focus
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 size-5" />
                  Engage Focus
                </>
              )}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
