"use client";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { NoiseToggle } from "./NoiseToggle";
import { NoiseSlider } from "./NoiseSlider";
import { NoiseDetection } from "./NoiseDetection";
import { ScheduleControl } from "./ScheduleControl";
import { VolumeHistory } from "./VolumeHistory";
import { Activity, Settings } from "lucide-react";
import { VolumeLogger } from "@/lib/volume-logger";
import { AudioMonitor } from "@/lib/audio-monitor";

export const Dashboard = () => {
  const [isNoiseActive, setIsNoiseActive] = useState(false);
  const [cancellationLevel, setCancellationLevel] = useState(75);
  const [currentNoiseLevel, setCurrentNoiseLevel] = useState(0);

  useEffect(() => {
    // Initialize volume logger
    const volumeLogger = VolumeLogger.getInstance();
    volumeLogger.startLogging();

    // Initialize audio monitor
    const audioMonitor = AudioMonitor.getInstance();

    // Update volume data with current values
    volumeLogger.updateVolume(currentNoiseLevel, currentNoiseLevel + 10, isNoiseActive);

    // Cleanup on unmount
    return () => {
      volumeLogger.stopLogging();
      audioMonitor.stopMonitoring();
    };
  }, []);

  // Update volume logger when values change
  useEffect(() => {
    const volumeLogger = VolumeLogger.getInstance();
    volumeLogger.updateVolume(currentNoiseLevel, currentNoiseLevel + 10, isNoiseActive);
  }, [currentNoiseLevel, isNoiseActive]);

  // Control Python noise cancellation script and audio monitoring
  useEffect(() => {
    const controlNoiseCancellation = async () => {
      try {
        const audioMonitor = AudioMonitor.getInstance();
        
        if (isNoiseActive) {
          // Start Python script
          const response = await fetch('/api/noise-cancel', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'start'
            }),
          });

          const result = await response.json();
          console.log('Noise cancellation control:', result);

          // Start audio monitoring
          const monitoringStarted = await audioMonitor.startMonitoring((volume) => {
            setCurrentNoiseLevel(Math.round(volume));
          });

          if (!monitoringStarted) {
            console.error('Failed to start audio monitoring');
          }
        } else {
          // Stop Python script
          await fetch('/api/noise-cancel', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'stop'
            }),
          });

          // Stop audio monitoring
          audioMonitor.stopMonitoring();
        }
      } catch (error) {
        console.error('Error controlling noise cancellation:', error);
      }
    };

    controlNoiseCancellation();
  }, [isNoiseActive]);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="container mx-auto px-4 py-4 max-w-6xl flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-1">
            Noise Cancel
          </h1>
        </div>

        {/* Main Dashboard */}
        <Tabs defaultValue="dashboard" className="w-full flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-secondary/50">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Control Panel</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              {/* Main Controls */}
              <div className="space-y-4 flex flex-col">
                <NoiseToggle 
                  isActive={isNoiseActive} 
                  onToggle={setIsNoiseActive} 
                />
                <NoiseSlider 
                  value={cancellationLevel}
                  onChange={setCancellationLevel}
                  isActive={isNoiseActive}
                />
              </div>

              {/* Detection Display */}
              <div className="flex flex-col space-y-4">
                <NoiseDetection isActive={isNoiseActive} currentNoiseLevel={currentNoiseLevel} />
                <ScheduleControl isActive={isNoiseActive} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1">
            <VolumeHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};