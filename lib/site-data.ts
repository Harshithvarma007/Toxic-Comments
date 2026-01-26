import { 
  Sword, 
  BookOpen, 
  Brain, 
  Trophy, 
  Zap, 
  Target, 
  Code,
  Terminal,
  Cpu,
  Globe
} from "lucide-react";

// --- TYPES ---
export interface Quest {
  id: string;
  title: string;
  description: string;
  status: "In Progress" | "Completed" | "Paused";
  difficulty: "Easy" | "Medium" | "Hard" | "Legendary";
  xpReward: number;
  techStack: string[];
  link?: string;
}

export interface Stat {
  subject: string;
  A: number; // Current value
  fullMark: number; // Max value (usually 100 or 150)
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  completed: boolean;
}

// --- CONTENT ---

export const SITE_DATA = {
  profile: {
    name: "Harshith Varma",
    class: "Full Stack Alchemist",
    level: 7,
    bio: "Building digital fortresses and exploring the dataverse. Focusing on AI, Web3, and scalable systems.",
    avatar: "/placeholder-user.jpg",
    xp: 7500,
    nextLevelXp: 10000,
  },
  
  // This powers the Radar Chart
  stats: [
    { subject: 'Intelligence', A: 120, fullMark: 150 },
    { subject: 'Creativity', A: 98, fullMark: 150 },
    { subject: 'Endurance', A: 86, fullMark: 150 },
    { subject: 'Wisdom', A: 99, fullMark: 150 },
    { subject: 'Charisma', A: 85, fullMark: 150 },
    { subject: 'Agility', A: 65, fullMark: 150 },
  ] as Stat[],

  // This powers the Active Quests component
  quests: [
    {
      id: "1",
      title: "Portfolio Refactor",
      description: "Centralizing content management and upgrading UI components to Shadcn.",
      status: "In Progress",
      difficulty: "Medium",
      xpReward: 500,
      techStack: ["Next.js", "TypeScript", "Tailwind"],
    },
    {
      id: "2",
      title: "Neural Net Optimization",
      description: "Improving accuracy of the image recognition model on Kaggle.",
      status: "Paused",
      difficulty: "Hard",
      xpReward: 1200,
      techStack: ["Python", "PyTorch", "Pandas"],
    },
    {
      id: "3",
      title: "DeFi Dashboard",
      description: "Real-time crypto asset tracking with gas fee optimization.",
      status: "Completed",
      difficulty: "Legendary",
      xpReward: 2500,
      techStack: ["Solidity", "Web3.js", "React"],
    }
  ] as Quest[],

  // This powers the Focus Engine/Habits
  habits: [
    { id: "1", title: "Deep Work (4h)", streak: 12, completed: false },
    { id: "2", title: "LeetCode Daily", streak: 45, completed: true },
    { id: "3", title: "Read Research Paper", streak: 3, completed: false },
  ] as Habit[],

  // Navigation Links
  navItems: [
    { name: "Base", href: "/", icon: "Home" },
    { name: "Quests", href: "/projects", icon: "Sword" },
    { name: "Grimoire", href: "/research", icon: "BookOpen" },
    { name: "Chronicles", href: "/writing", icon: "Feather" },
    { name: "Map", href: "/about", icon: "Map" },
  ]
};