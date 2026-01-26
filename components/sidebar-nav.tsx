"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { 
  LayoutDashboard, 
  Cpu, 
  Code2, 
  Bot,
  Menu,
  X,
  Zap
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ChatPanel } from "./chat-panel"

const navItems = [
  { id: "playground", icon: LayoutDashboard, label: "Playground", color: "text-blue-400" },
  { id: "model-card", icon: Cpu, label: "Model", color: "text-purple-400" },
  { id: "developer", icon: Code2, label: "Developer", color: "text-green-400" },
]

export function SidebarNav() {
  const [activeView, setActiveView] = useState("playground")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Handle initial load and browser back/forward buttons
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const view = params.get("view") || "playground"
      setActiveView(view)
    }

    const handlePopState = () => {
       const params = new URLSearchParams(window.location.search)
       const view = params.get("view") || "playground"
       setActiveView(view)
       window.dispatchEvent(new CustomEvent('nav-change', { detail: view }))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleNavClick = (viewId: string) => {
    setActiveView(viewId)
    setIsMobileMenuOpen(false)
    
    // Update URL without reload
    const newUrl = `?view=${viewId}`
    window.history.pushState({ path: newUrl }, '', newUrl)
    
    // Dispatch custom event for page.tsx to listen to
    window.dispatchEvent(new CustomEvent('nav-change', { detail: viewId }))
  }

  // Reusable Navigation Content
  const NavContent = () => (
    <>
      <div className="border-b border-white/[0.08] p-6">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-red-500/10 rounded-lg">
             <Zap className="h-5 w-5 text-red-500" />
           </div>
           <div>
            <h1 className="font-mono text-lg font-bold tracking-tighter text-white leading-none">
              ToxicSense
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-1">AI Safety Layer</p>
           </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = activeView === item.id
          return (
            <button 
              key={item.id} 
              onClick={() => handleNavClick(item.id)} 
              className="block w-full text-left"
            >
              <div className="relative group">
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ boxShadow: "0 0 15px rgba(59, 130, 246, 0.6)" }}
                  />
                )}
                
                <div
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all ${
                    isActive
                      ? "bg-blue-500/10 text-blue-400"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon className={`size-5 ${isActive ? item.color : "text-muted-foreground group-hover:text-white"}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
              </div>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-white/[0.08] p-4">
        <div 
          onClick={() => setIsChatOpen(true)}
          className="glass-panel p-3 rounded-xl flex items-center gap-3 hover:bg-white/5 transition-colors cursor-pointer group"
        >
          <div className="relative">
            <Avatar className="size-10 ring-1 ring-blue-500/50">
              <AvatarImage src="1739541342275.jpeg" />
              <AvatarFallback className="bg-blue-900/50 text-blue-200 text-xs">AI</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Model Agent</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Bot className="w-3 h-3 text-blue-400" />
              <p className="text-[10px] text-blue-400 truncate">Online</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* 1. Mobile Header (Visible only on mobile) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
              <div className="p-1.5 bg-red-500/10 rounded-md">
                 <Zap className="h-4 w-4 text-red-500" />
              </div>
              <span className="font-mono font-bold text-white text-sm">ToxicSense</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer active:scale-95"
          aria-label="Toggle Menu"
        >
          <Menu className="size-6" />
        </button>
      </div>

      {/* 2. Desktop Sidebar (Hidden on mobile) */}
      <aside className="hidden md:flex fixed left-0 top-0 z-50 h-screen w-64 flex-col border-r border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-xl">
        <NavContent />
      </aside>

      {/* 3. Mobile Slide-out Menu (Drawer) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[101] bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[102] w-3/4 max-w-xs bg-[#0a0a0a] border-r border-white/10 flex flex-col md:hidden shadow-2xl"
            >
              <div className="absolute top-4 right-4 z-50">
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-muted-foreground hover:text-white transition-colors"
                >
                  <X className="size-6" />
                </button>
              </div>
              <NavContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  )
}