import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Mock data generator for the heatmap
const generateHeatmapData = () => {
  const weeks = 52;
  const days = 7;
  const data = [];
  
  for (let i = 0; i < weeks * days; i++) {
    // Generate a random intensity level (0-4)
    // Weighted to look realistic (more low/med, fewer high)
    const rand = Math.random();
    let level = 0;
    if (rand > 0.85) level = 4;
    else if (rand > 0.65) level = 3;
    else if (rand > 0.45) level = 2;
    else if (rand > 0.25) level = 1;
    
    data.push(level);
  }
  return data;
};

const HeatmapCell = ({ level }: { level: number }) => {
  const colors = {
    0: "bg-muted/20", // Empty
    1: "bg-primary/20",
    2: "bg-primary/40",
    3: "bg-primary/70",
    4: "bg-primary",
  };

  return (
    <div 
      className={cn(
        "w-2.5 h-2.5 rounded-[2px] transition-all duration-300 hover:scale-125 hover:ring-2 hover:ring-ring/50",
        // @ts-ignore
        colors[level]
      )}
    />
  );
};

export function ContributionHeatmap({ className }: { className?: string }) {
  const data = generateHeatmapData();

  return (
    <Card className={cn("border-border/40 bg-card/50 backdrop-blur-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Data Stream / Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {/* Heatmap Grid */}
          <div className="flex gap-1 overflow-x-auto pb-2 mask-linear-fade">
            {/* We render columns of 7 days */}
            {Array.from({ length: 52 }).map((_, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, dayIndex) => (
                  <HeatmapCell 
                    key={dayIndex} 
                    level={data[weekIndex * 7 + dayIndex]} 
                  />
                ))}
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mt-2">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-[1px] bg-muted/20" />
              <div className="w-2.5 h-2.5 rounded-[1px] bg-primary/20" />
              <div className="w-2.5 h-2.5 rounded-[1px] bg-primary/40" />
              <div className="w-2.5 h-2.5 rounded-[1px] bg-primary/70" />
              <div className="w-2.5 h-2.5 rounded-[1px] bg-primary" />
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}