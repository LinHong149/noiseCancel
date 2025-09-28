import { useState } from "react";
import { Power } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface NoiseToggleProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

export const NoiseToggle = ({ isActive, onToggle }: NoiseToggleProps) => {
  return (
    <Card className="p-6 bg-gradient-card border-border/50 shadow-card flex-1">
      <div className="text-center space-y-4 h-full">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">Noise Cancellation</h2>
          <p className="text-sm text-muted-foreground">
            {isActive ? "Active - Blocking ambient noise" : "Inactive - All sounds audible"}
          </p>
        </div>
        
        <div className="flex justify-center pt-10">
          <Button
            onClick={() => onToggle(!isActive)}
            className={`
              relative w-80 h-80 rounded-full p-0 transition-all duration-300
              ${isActive 
                ? 'bg-gradient-active shadow-glow hover:shadow-glow' 
                : 'bg-secondary hover:bg-secondary/80'
              }
            `}
          >
            <Power 
              className={`w-12 h-12 transition-all duration-300 ${
                isActive ? 'text-primary-foreground' : 'text-muted-foreground'
              }`} 
            />
          </Button>
        </div>
        
        <div className={`
          text-xl font-medium transition-colors duration-300
          ${isActive ? 'text-audio-primary' : 'text-muted-foreground'}
        `}>
          {isActive ? 'ON' : 'OFF'}
        </div>
      </div>
    </Card>
  );
};