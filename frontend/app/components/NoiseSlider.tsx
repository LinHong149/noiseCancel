import { Slider } from "./ui/slider";
import { Card } from "./ui/card";
import { Volume, VolumeX, Volume2 } from "lucide-react";

interface NoiseSliderProps {
  value: number;
  onChange: (value: number) => void;
  isActive: boolean;
}

export const NoiseSlider = ({ value, onChange, isActive }: NoiseSliderProps) => {
  const getVolumeIcon = () => {
    if (value === 0) return VolumeX;
    if (value < 50) return Volume;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  return (
    <Card className="p-4 bg-gradient-card border-border/50 shadow-card">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Cancellation Level</h3>
          <span className="text-sm text-muted-foreground">{value}%</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <VolumeX className="w-4 h-4 text-muted-foreground" />
          
          <div className="flex-1">
            <Slider
              value={[value]}
              onValueChange={(values: number[]) => onChange(values[0])}
              max={100}
              step={1}
              disabled={!isActive}
              className={`transition-opacity duration-300 ${
                isActive ? 'opacity-100' : 'opacity-50'
              }`}
            />
          </div>
          
          <Volume2 className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Light</span>
          <span>Medium</span>
          <span>Maximum</span>
        </div>
      </div>
    </Card>
  );
};