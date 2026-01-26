"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface TypewriterTextProps {
  text: string
  delay?: number
  className?: string
  cursor?: boolean
}

export function TypewriterText({ 
  text, 
  delay = 0, 
  className = "",
  cursor = true 
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [startTyping, setStartTyping] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // Handle the start delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setStartTyping(true)
    }, delay * 1000)
    return () => clearTimeout(timer)
  }, [delay])

  // Handle the typing effect
  useEffect(() => {
    if (!startTyping) return

    // If text changes, reset (optional safety)
    if (currentIndex === 0 && displayedText !== "" && displayedText !== text[0]) {
         setDisplayedText("")
         setIsComplete(false)
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, 50 + Math.random() * 30) // Natural typing variation
      return () => clearTimeout(timeout)
    } else {
      setIsComplete(true)
    }
  }, [currentIndex, text, startTyping, displayedText])

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {displayedText}
      {cursor && !isComplete && (
        <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block w-[2px] h-[1em] bg-blue-400 ml-1 align-middle"
        />
      )}
    </motion.span>
  )
}