import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card } from "./ui/card";
import { Clock, TrendingDown } from "lucide-react";
import { useEffect, useState } from 'react';
import { VolumeHistoryData, VolumeStats } from '@/lib/types';

export const VolumeHistory = () => {
  const [data, setData] = useState<VolumeHistoryData | null>(null);
  const [stats, setStats] = useState<VolumeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVolumeHistory = async () => {
      try {
        setLoading(true);
        
        // Get last 24 hours of data (288 data points for 5-minute intervals)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - 24);
        
        const response = await fetch(
          `/api/volume-history?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=288`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch volume history');
        }
        
        const historyData = await response.json();
        setData(historyData);
        setStats(historyData.stats);
      } catch (err) {
        console.error('Error fetching volume history:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchVolumeHistory();
  }, []);


  if (loading) {
    return (
      <div className="space-y-4 h-full flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-3 bg-gradient-card border-border/50">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
        <Card className="p-4 bg-gradient-card border-border/50 shadow-card flex-1">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4 h-full flex flex-col">
        <Card className="p-4 bg-gradient-card border-border/50 shadow-card flex-1">
          <div className="text-center py-8">
            <p className="text-destructive mb-2">
              {error ? 'Error loading volume history' : 'No volume data available'}
            </p>
            <p className="text-sm text-muted-foreground">
              {error || 'Volume data will appear here once the system starts collecting readings every 5 minutes.'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const chartData = data?.readings.map(reading => ({
    time: new Date(reading.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    volume: reading.volume,
    ambient: reading.ambient,
  })).reverse() || [];

  const avgVolume = stats?.avgVolume || 0;
  const maxVolume = stats?.maxVolume || 0;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-3 bg-gradient-card border-border/50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-audio-primary/20 rounded-lg">
              <TrendingDown className="w-3 h-3 text-audio-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Volume (24h, 5min intervals)</p>
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
            <p className="text-xs text-muted-foreground">5-minute interval readings throughout the day</p>
          </div>
          
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
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
                  interval="preserveStartEnd"
                  tickCount={6}
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