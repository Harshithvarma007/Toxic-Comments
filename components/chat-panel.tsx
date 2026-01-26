"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Bot, User, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI assistant. How can I help you navigate Harshith's portfolio today?",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm currently in demo mode, but I can tell you about the Projects, Research, or Writing sections!",
      }
      setMessages((prev) => [...prev, response])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm md:hidden"
          />
          
          {/* Chat Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-[100] flex h-screen w-full flex-col border-l border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur-xl md:w-[400px]"
            style={{ boxShadow: "-20px 0 50px rgba(0,0,0,0.5)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/50">
                  <Bot className="size-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">AI Assistant</h2>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex size-2 rounded-full bg-green-500"></span>
                    </span>
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-white"
              >
                <X className="size-5" />
              </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={message.id}
                    className={cn(
                      "flex w-full gap-3",
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <Avatar className="size-8 ring-1 ring-white/10">
                      <AvatarImage src={message.role === "user" ? "/placeholder-user.jpg" : ""} />
                      <AvatarFallback className={message.role === "assistant" ? "bg-blue-600" : "bg-zinc-800"}>
                        {message.role === "assistant" ? <Bot className="size-4 text-white" /> : <User className="size-4 text-white" />}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-800/50 text-zinc-100 ring-1 ring-white/10"
                      )}
                    >
                      {message.content}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex w-full gap-3"
                  >
                    <Avatar className="size-8 ring-1 ring-white/10">
                      <AvatarFallback className="bg-blue-600">
                        <Bot className="size-4 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1 rounded-2xl bg-zinc-800/50 px-4 py-3 ring-1 ring-white/10">
                      <div className="size-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.3s]" />
                      <div className="size-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.15s]" />
                      <div className="size-1.5 animate-bounce rounded-full bg-blue-400" />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-white/[0.08] p-4">
              <div className="relative flex items-center gap-2 rounded-xl bg-zinc-900/50 p-2 ring-1 ring-white/10 focus-within:ring-blue-500/50 transition-all">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent px-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className={cn(
                    "h-8 w-8 transition-all",
                    inputValue.trim() ? "bg-blue-600 hover:bg-blue-500" : "bg-zinc-800 text-muted-foreground hover:bg-zinc-700"
                  )}
                >
                  <Send className="size-4" />
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                <Sparkles className="size-3" />
                <span>Powered by RAG Model</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}