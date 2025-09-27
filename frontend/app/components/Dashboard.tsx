"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { NoiseToggle } from "./NoiseToggle";
import { NoiseSlider } from "./NoiseSlider";
import { NoiseDetection } from "./NoiseDetection";
import { ScheduleControl } from "./ScheduleControl";
import { VolumeHistory } from "./VolumeHistory";
import { Activity, Settings } from "lucide-react";

export const Dashboard = () => {
  const [isNoiseActive, setIsNoiseActive] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(75);

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
                  value={noiseLevel}
                  onChange={setNoiseLevel}
                  isActive={isNoiseActive}
                />
              </div>

              {/* Detection Display */}
              <div className="flex flex-col space-y-4">
                <NoiseDetection isActive={isNoiseActive} />
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