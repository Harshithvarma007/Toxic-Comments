"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Zap, 
  Brain, 
  Activity, 
  Lock, 
  Github, 
  ChevronRight, 
  BarChart3, 
  Layers, 
  Scale, 
  CheckCircle2,
  Linkedin,
  FileText,
  User,
  Database,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Components ---

const FadeIn = ({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-1000 ease-out transform",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
    >
      {children}
    </div>
  );
};

const MetricCard = ({ label, value, sub, color = "bg-zinc-800" }: { label: string, value: string, sub?: string, color?: string }) => (
  <div className="group relative overflow-hidden rounded-2xl bg-zinc-900/50 p-8 border border-white/5 hover:border-white/10 transition-colors">
    <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity", color)} />
    <h3 className="text-zinc-400 text-sm font-medium tracking-wide uppercase mb-2">{label}</h3>
    <div className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">{value}</div>
    {sub && <div className="text-zinc-500 text-sm">{sub}</div>}
  </div>
);

// --- Charts & Visualizations ---

const AccuracyChart = () => {
  // Data from Epoch 1 to 15 (Validation Accuracy)
  const valAccData = [
    0.9325, 0.9454, 0.9565, 0.9621, 0.9675, 0.9707, 0.9722, 0.9745, 
    0.9754, 0.9773, 0.9777, 0.9789, 0.9793, 0.9805, 0.9801
  ];
  
  // Data from Epoch 1 to 15 (Training Accuracy)
  const trainAccData = [
    0.8833, 0.9409, 0.9558, 0.9659, 0.9724, 0.9771, 0.9797, 0.9814, 
    0.9834, 0.9846, 0.9857, 0.9866, 0.9872, 0.9881, 0.9885
  ];

  // Helper to normalize data to SVG coordinates (ViewBox 0 0 100 40)
  // Y-axis Scale: 0.85 to 0.99
  const normalize = (val: number, i: number) => {
    const x = (i / (valAccData.length - 1)) * 100;
    const y = 40 - ((val - 0.88) / (0.99 - 0.88)) * 40; 
    return `${x},${y}`;
  };

  const valPath = valAccData.map(normalize).join(" L ");
  const trainPath = trainAccData.map(normalize).join(" L ");
  const valArea = `M 0,40 L ${valPath} L 100,40 Z`;

  return (
    <div className="w-full h-56 relative group">
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-50" />
      
      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
        <defs>
          <linearGradient id="valGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        <line x1="0" y1="10" x2="100" y2="10" stroke="#333" strokeWidth="0.1" strokeDasharray="2" />
        <line x1="0" y1="25" x2="100" y2="25" stroke="#333" strokeWidth="0.1" strokeDasharray="2" />

        {/* Training Accuracy Line (Subtle) */}
        <path 
          d={`M ${trainPath}`} 
          fill="none" 
          stroke="#3b82f6" 
          strokeWidth="0.5" 
          strokeDasharray="2"
          opacity="0.4"
        />

        {/* Validation Accuracy Area Fill */}
        <path d={valArea} fill="url(#valGradient)" />

        {/* Validation Accuracy Line (Hero) */}
        <path 
          d={`M ${valPath}`} 
          fill="none" 
          stroke="#10b981" 
          strokeWidth="1" 
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]"
        />

        {/* Highlight points on hover (Interactive-ish) */}
        {valAccData.map((val, i) => (
          <circle 
            key={i} 
            cx={(i / (valAccData.length - 1)) * 100} 
            cy={40 - ((val - 0.88) / (0.99 - 0.88)) * 40} 
            r="1" 
            className="fill-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        ))}
      </svg>
      
      {/* Labels */}
      <div className="absolute top-2 right-0 flex flex-col items-end">
         <span className="text-2xl font-bold text-emerald-400">98.01%</span>
         <span className="text-[10px] text-emerald-500/70 font-mono">VAL ACCURACY</span>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-zinc-600 font-mono mt-2">
         <span>EPOCH 01</span>
         <span>EPOCH 07</span>
         <span>EPOCH 15</span>
      </div>
    </div>
  );
};

const HeatmapGrid = () => {
  // Updated with new data: 0.98 for all weighted avg metrics
  const metrics = [
    { label: "Precision", val: 0.98, color: "bg-blue-500" },
    { label: "Recall", val: 0.98, color: "bg-indigo-500" },
    { label: "F1-Score", val: 0.98, color: "bg-violet-500" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {metrics.map((m, i) => (
        <div key={i} className="flex flex-col gap-2 group">
           <div className="h-28 w-full rounded-xl bg-zinc-900 border border-white/5 relative overflow-hidden flex items-end p-1 transition-colors hover:border-white/10">
              <div 
                className={cn("w-full rounded-lg opacity-80 transition-all duration-1000", m.color)} 
                style={{ height: `${m.val * 100}%` }}
              >
                 {/* Shimmer effect */}
                 <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent translate-y-full group-hover:-translate-y-full transition-transform duration-1000" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center flex-col z-10">
                <span className="font-mono text-2xl font-bold text-white drop-shadow-md">{m.val.toFixed(2)}</span>
              </div>
           </div>
           <span className="text-center text-xs text-zinc-500 uppercase tracking-wider font-semibold group-hover:text-zinc-300 transition-colors">{m.label}</span>
        </div>
      ))}
    </div>
  );
};

const NeuralNode = ({ active = false, color = "bg-blue-500" }) => (
  <div className={cn("w-3 h-3 rounded-full transition-all duration-500", active ? `scale-125 ${color} shadow-[0_0_10px_currentColor]` : "bg-zinc-800")} />
);

export default function ProjectShowcase() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      
      {/* --- Global Nav --- */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold tracking-tight text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Toxic Comment Detection <span className="text-zinc-500">v1.0</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
            <span className="hidden sm:block">TensorFlow / Keras</span>
            <a href="https://github.com/harshithvarma007" target="_blank" className="hover:text-white transition-colors">
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-40 lg:pt-48 lg:pb-60 overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <FadeIn>
            <Badge variant="outline" className="mb-8 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
              End-to-End Machine Learning Project
            </Badge>
          </FadeIn>
          
          <FadeIn delay={100}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-500">
              Restoring Civility <br />
              <span className="text-white">To Digital Discourse.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              A high-precision deep learning model designed to filter toxicity from online conversations with <span className="text-white font-semibold">98.01% accuracy</span>.
            </p>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-full px-6 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white hover:border-zinc-700 h-12 gap-2"
                  onClick={() => window.open('#', '_blank')}
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  Read Blog
                </Button>

                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-full px-6 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white hover:border-zinc-700 h-12 gap-2"
                  onClick={() => window.open('#', '_blank')}
                >
                  <Database className="w-4 h-4 text-yellow-400" />
                  Notebook
                </Button>

                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-full px-6 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white hover:border-zinc-700 h-12 gap-2"
                  onClick={() => window.open('#', '_blank')}
                >
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  LinkedIn
                </Button>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <span className="text-sm text-zinc-500">More by Harshith Varma</span>
                <Button 
                  size="sm" 
                  className="rounded-full bg-white text-black hover:bg-zinc-200 gap-2 font-medium"
                  onClick={() => window.open('#', '_blank')}
                >
                  <User className="w-4 h-4" />
                  View Portfolio
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* --- CHAPTER 1: THE DATA --- */}
      <section className="py-24 border-t border-white/5 bg-zinc-950/50">
        <div className="container mx-auto px-6">
          <div className="mb-16 md:flex justify-between items-end">
            <div className="max-w-xl">
              <div className="text-blue-500 text-xs font-bold uppercase tracking-widest mb-4">Chapter I</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">The Signal in the Noise</h2>
              <p className="text-zinc-400 leading-relaxed">
                Raw social media data is messy and heavily imbalanced. In the real world, toxic comments are rare outliers. To build a robust model, we first had to balance the scales using SMOTE (Synthetic Minority Over-sampling Technique).
              </p>
            </div>
            <div className="hidden md:block text-right">
              <div className="text-4xl font-mono font-bold text-white">20,000+</div>
              <div className="text-zinc-500 text-sm">Vocabulary Size</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Visual: Imbalanced vs Balanced */}
            <FadeIn className="bg-zinc-900 rounded-3xl p-8 border border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 text-zinc-600">
                 <Scale className="w-6 h-6" />
               </div>
               <h3 className="text-lg font-semibold mb-8">Data Distribution</h3>
               
               <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-xs mb-2 text-zinc-400">
                      <span>Before SMOTE</span>
                      <span className="text-red-400">High Imbalance</span>
                    </div>
                    <div className="flex h-4 w-full rounded-full overflow-hidden">
                      <div className="w-[90%] bg-zinc-700" title="Non-Toxic" />
                      <div className="w-[10%] bg-red-500" title="Toxic" />
                    </div>
                 </div>
                 
                 <div>
                    <div className="flex justify-between text-xs mb-2 text-zinc-400">
                      <span>After SMOTE</span>
                      <span className="text-emerald-400">Perfectly Balanced</span>
                    </div>
                    <div className="flex h-4 w-full rounded-full overflow-hidden">
                      <div className="w-[50%] bg-zinc-600" title="Non-Toxic" />
                      <div className="w-[50%] bg-emerald-500" title="Toxic (Synthetic)" />
                    </div>
                 </div>
               </div>
               <p className="mt-8 text-xs text-zinc-500 leading-relaxed">
                 We synthesized minority class examples to ensure the model doesn't just memorize "safe" patterns but actively learns to identify toxicity.
               </p>
            </FadeIn>

            {/* Visual: Word Cloud Concept */}
            <FadeIn delay={100} className="bg-zinc-900 rounded-3xl p-8 border border-white/5 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-4">Feature Extraction</h3>
                <p className="text-zinc-400 text-sm mb-6">
                  Using <span className="text-white">TF-IDF Vectorization</span>, we transformed raw text into numerical vectors, capturing the weight of words like "stupid", "idiot", and "hate" versus neutral terms.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 opacity-60">
                 {["hate", "stupid", "kill", "idiot", "worst", "trash", "ignorant", "bad"].map((word, i) => (
                   <span key={i} className="px-3 py-1 rounded-md bg-zinc-800 text-zinc-300 text-xs font-mono border border-white/5">
                     {word}
                   </span>
                 ))}
                 <span className="px-3 py-1 rounded-md bg-blue-900/30 text-blue-300 text-xs font-mono border border-blue-500/20">
                   + 4,992 more
                 </span>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* --- CHAPTER 2: THE BRAIN --- */}
      <section className="py-24 bg-black relative overflow-hidden">
        {/* Tech Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="text-purple-500 text-xs font-bold uppercase tracking-widest mb-4">Chapter II</div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">The Architecture</h2>
            <p className="text-zinc-400">
               A visual journey through the neural pathways. Data flows from high-dimensional vectors to a single probability score.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-0 max-w-6xl mx-auto relative">
             
             {/* Visual Connector Line (Desktop) */}
             <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/0 via-purple-500/50 to-emerald-500/0 -translate-y-1/2 z-0"></div>

             {/* Layer 1: Input */}
             <FadeIn className="relative z-10 w-full lg:w-1/3">
                <div className="bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 mx-2 hover:border-blue-500/50 transition-colors group">
                   <div className="flex justify-between items-start mb-6">
                      <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 group-hover:text-blue-300">
                         <Layers className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono text-zinc-500">LAYER 01</span>
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">Dense Layer</h3>
                   <div className="flex gap-2 mb-4">
                      {[1,2,3,4,5].map(i => <NeuralNode key={i} active color="bg-blue-500" />)}
                   </div>
                   <p className="text-sm text-zinc-400">
                      Receives 5000 TF-IDF features. 64 Neurons activated by ReLU function.
                   </p>
                </div>
             </FadeIn>

             {/* Connector Arrow (Desktop) */}
             <div className="hidden lg:flex items-center justify-center text-zinc-700 z-10 -mx-4">
                <ArrowRight className="w-6 h-6" />
             </div>

             {/* Layer 2: Dropout */}
             <FadeIn delay={100} className="relative z-10 w-full lg:w-1/3">
                <div className="bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 mx-2 hover:border-purple-500/50 transition-colors group">
                   <div className="flex justify-between items-start mb-6">
                      <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 group-hover:text-purple-300">
                         <Shield className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono text-zinc-500">LAYER 02</span>
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">Dropout Layer</h3>
                   <div className="flex gap-2 mb-4">
                      <NeuralNode active color="bg-purple-500" />
                      <NeuralNode active={false} />
                      <NeuralNode active color="bg-purple-500" />
                      <NeuralNode active={false} />
                      <NeuralNode active color="bg-purple-500" />
                   </div>
                   <p className="text-sm text-zinc-400">
                      Randomly disables 50% of neurons to force redundant feature learning and prevent overfitting.
                   </p>
                </div>
             </FadeIn>

             {/* Connector Arrow (Desktop) */}
             <div className="hidden lg:flex items-center justify-center text-zinc-700 z-10 -mx-4">
                <ArrowRight className="w-6 h-6" />
             </div>

             {/* Layer 3: Output */}
             <FadeIn delay={200} className="relative z-10 w-full lg:w-1/3">
                <div className="bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 mx-2 hover:border-emerald-500/50 transition-colors group">
                   <div className="flex justify-between items-start mb-6">
                      <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:text-emerald-300">
                         <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono text-zinc-500">LAYER 03</span>
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">Sigmoid Output</h3>
                   <div className="flex gap-2 mb-4">
                      <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden relative">
                         <div className="absolute top-0 left-0 bottom-0 w-[96%] bg-emerald-500 shadow-[0_0_15px_#10b981]" />
                      </div>
                   </div>
                   <p className="text-sm text-zinc-400">
                      Compresses the result into a single probability score between 0 (Safe) and 1 (Toxic).
                   </p>
                </div>
             </FadeIn>
          </div>
        </div>
      </section>

      {/* --- CHAPTER 3: THE VERDICT --- */}
      <section className="py-24 border-t border-white/5 bg-zinc-950">
        <div className="container mx-auto px-6">
           <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-center">
              <div>
                <div className="text-emerald-500 text-xs font-bold uppercase tracking-widest mb-4">Chapter III</div>
                <h2 className="text-4xl md:text-5xl font-bold mb-8">Uncompromising Accuracy.</h2>
                
                <div className="grid sm:grid-cols-2 gap-4 mb-12">
                   <MetricCard label="Test Accuracy" value="98.01%" sub="On unseen test data" color="bg-emerald-500/30" />
                   <MetricCard label="Loss" value="0.076" sub="Binary Crossentropy" color="bg-red-500/30" />
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white">Learning Curve</h3>
                  <AccuracyChart />
                  <p className="text-sm text-zinc-500">
                    The model converges rapidly, reaching optimal performance within 15 epochs. The narrow gap between training and validation accuracy confirms minimal overfitting.
                  </p>
                </div>
              </div>

              {/* Heatmap Card */}
              <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 h-full flex flex-col justify-center">
                 <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
                   <Activity className="w-4 h-4 text-zinc-400" />
                   Performance Metrics
                 </h3>
                 <HeatmapGrid />
                 <div className="mt-8 pt-8 border-t border-white/5">
                   <div className="text-xs text-zinc-500 mb-2 font-mono">Sample Prediction:</div>
                   <div className="bg-black rounded p-3 text-sm font-mono text-zinc-300 border border-zinc-800">
                      &gt; input: "This is the worst product ever"<br/>
                      <span className="text-red-400">&gt; output: TOXIC [0.92]</span>
                   </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* --- LIVE DEMO (Locked) --- */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-black pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Live Inference Environment</h2>
            <p className="text-zinc-400">Interact with the model in real-time. (Currently undergoing server maintenance).</p>
          </div>

          <div className="relative max-w-3xl mx-auto">
            {/* The "Locked" Overlay */}
            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl border border-white/10">
               <div className="bg-zinc-900 p-4 rounded-full mb-4 ring-1 ring-white/10">
                 <Lock className="w-6 h-6 text-zinc-400" />
               </div>
               <h3 className="text-xl font-semibold text-white mb-2">Demo Temporarily Locked</h3>
               <p className="text-zinc-400 text-sm max-w-md text-center mb-6">
                 We are upgrading the inference API to handle higher throughput. Check back soon for the interactive playground.
               </p>
               <Button variant="secondary" disabled className="opacity-50 cursor-not-allowed">
                 Request Access
               </Button>
            </div>

            {/* The "Underneath" UI */}
            <div className="bg-zinc-950 rounded-xl border border-white/10 overflow-hidden opacity-50 pointer-events-none">
               <div className="bg-zinc-900/50 px-4 py-3 border-b border-white/5 flex items-center gap-2">
                 <div className="flex gap-1.5">
                   <div className="w-3 h-3 rounded-full bg-red-500/20" />
                   <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                   <div className="w-3 h-3 rounded-full bg-green-500/20" />
                 </div>
                 <div className="ml-4 text-xs font-mono text-zinc-600">toxic_detection_v1.py</div>
               </div>
               <div className="h-[400px] p-6 font-mono text-sm space-y-4">
                 <div className="text-zinc-500"># Initializing session...</div>
                 <div className="text-zinc-500"># Model loaded successfully. Weights: 420kb</div>
                 <div>
                   <span className="text-green-500">user@demo:~$</span> analyze_text --input "You are amazing!"
                 </div>
                 <div className="text-zinc-300 pl-4">
                   Analysis Result:<br/>
                   Probability: 0.0021<br/>
                   Verdict: <span className="text-emerald-500">NON-TOXIC</span>
                 </div>
                 <div>
                   <span className="text-green-500">user@demo:~$</span> <span className="animate-pulse">_</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-white/5 bg-black text-center">
         <div className="container mx-auto px-6">
            <p className="text-zinc-600 text-sm mb-4">
              © 2024 Toxic Comment Classification
            </p>
         </div>
      </footer>
    </main>
  );
}