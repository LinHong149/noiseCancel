import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card } from "./ui/card";
import { Clock, TrendingDown } from "lucide-react";

// Generate sample data for the last 24 hours
const generateHourlyData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    const baseVolume = 45 + Math.sin(i / 4) * 15; // Simulate daily patterns
    const volume = Math.max(20, baseVolume + (Math.random() - 0.5) * 20);
    
    data.push({
      time: hour.getHours().toString().padStart(2, '0') + ':00',
      volume: Math.round(volume),
      ambient: Math.round(volume + Math.random() * 10),
    });
  }
  
  return data;
};

export const VolumeHistory = () => {
  const data = generateHourlyData();
  const avgVolume = Math.round(data.reduce((acc, d) => acc + d.volume, 0) / data.length);
  const maxVolume = Math.max(...data.map(d => d.volume));

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-3 bg-gradient-card border-border/50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-audio-primary/20 rounded-lg">
              <TrendingDown className="w-3 h-3 text-audio-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Volume (24h)</p>
              <p className="text-lg font-bold text-foreground">{avgVolume} dB</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 bg-gradient-card border-border/50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-audio-warning/20 rounded-lg">
              <Clock className="w-3 h-3 text-audio-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Peak Volume</p>
              <p className="text-lg font-bold text-foreground">{maxVolume} dB</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 bg-gradient-card border-border/50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-audio-success/20 rounded-lg">
              <TrendingDown className="w-3 h-3 text-audio-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Noise Reduced</p>
              <p className="text-lg font-bold text-foreground">-15 dB</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 bg-gradient-card border-border/50 shadow-card flex-1">
        <div className="space-y-3 h-full flex flex-col">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Volume History - Last 24 Hours</h3>
            <p className="text-xs text-muted-foreground">Ambient noise levels throughout the day</p>
          </div>
          
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(195 100% 50%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(195 100% 50%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="ambientGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(220 100% 70%)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(220 100% 70%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(220 10% 60%)"
                  fontSize={11}
                />
                <YAxis 
                  stroke="hsl(220 10% 60%)"
                  fontSize={11}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(220 25% 12%)',
                    border: '1px solid hsl(220 20% 18%)',
                    borderRadius: '8px',
                    color: 'hsl(220 15% 95%)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="ambient"
                  stroke="hsl(220 100% 70%)"
                  strokeWidth={2}
                  fill="url(#ambientGradient)"
                  name="Ambient Level"
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="hsl(195 100% 50%)"
                  strokeWidth={3}
                  fill="url(#volumeGradient)"
                  name="Processed Level"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  );
};