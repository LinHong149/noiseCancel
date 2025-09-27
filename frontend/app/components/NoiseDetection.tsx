import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Mic, MicOff, Waves } from "lucide-react";

interface NoiseDetectionProps {
  isActive: boolean;
  currentNoiseLevel: number;
}

const noiseTypes = [
  { type: "Traffic", intensity: "High", icon: "🚗" },
  { type: "Construction", intensity: "Very High", icon: "🔨" },
  { type: "Conversation", intensity: "Medium", icon: "💬" },
  { type: "Music", intensity: "Low", icon: "🎵" },
  { type: "Air Conditioning", intensity: "Low", icon: "❄️" },
  { type: "Rain", intensity: "Medium", icon: "🌧️" },
];

export const NoiseDetection = ({ isActive, currentNoiseLevel }: NoiseDetectionProps) => {
  const [currentNoise, setCurrentNoise] = useState(noiseTypes[0]);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    setIsDetecting(true);
    const interval = setInterval(() => {
      const randomNoise = noiseTypes[Math.floor(Math.random() * noiseTypes.length)];
      setCurrentNoise(randomNoise);
    }, 3000);

    return () => {
      clearInterval(interval);
      setIsDetecting(false);
    };
  }, [isActive]);

  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'low': return 'bg-audio-success/20 text-audio-success';
      case 'medium': return 'bg-audio-warning/20 text-audio-warning';
      case 'high': return 'bg-destructive/20 text-destructive';
      case 'very high': return 'bg-destructive/30 text-destructive';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  return (
    <Card className="p-4 bg-gradient-card border-border/50 shadow-card">
      <div className="space-y-3 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Current Environment</h3>
          <div className="flex items-center space-x-2">
            {isActive ? (
              <Mic className="w-4 h-4 text-audio-primary" />
            ) : (
              <MicOff className="w-4 h-4 text-muted-foreground" />
            )}
            {isDetecting && (
              <Waves className="w-4 h-4 text-audio-primary animate-pulse" />
            )}
          </div>
        </div>

        {isActive ? (
          <div className="space-y-5 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xl">{currentNoise.icon}</span>
                <div>
                  <p className="font-medium text-foreground">{currentNoise.type}</p>
                  <p className="text-xs text-muted-foreground">Detected noise source</p>
                </div>
              </div>
              <Badge className={getIntensityColor(currentNoise.intensity)}>
                {currentNoise.intensity}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xl">{currentNoise.icon}</span>
                <div>
                  <p className="font-medium text-foreground">{currentNoise.type}</p>
                  <p className="text-xs text-muted-foreground">Detected noise source</p>
                </div>
              </div>
              <Badge className={getIntensityColor(currentNoise.intensity)}>
                {currentNoise.intensity}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xl">{currentNoise.icon}</span>
                <div>
                  <p className="font-medium text-foreground">{currentNoise.type}</p>
                  <p className="text-xs text-muted-foreground">Detected noise source</p>
                </div>
              </div>
              <Badge className={getIntensityColor(currentNoise.intensity)}>
                {currentNoise.intensity}
              </Badge>
            </div>
            
            <div className="bg-muted/20 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Current Noise Level</span>
                <span className="text-sm font-medium text-foreground">
                  {Math.round(currentNoiseLevel)} dB
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-active h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, currentNoiseLevel)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground flex-1 flex flex-col justify-center">
            <MicOff className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm">Noise detection inactive</p>
            <p className="text-xs">Enable to monitor environment</p>
          </div>
        )}
      </div>
    </Card>
  );
};