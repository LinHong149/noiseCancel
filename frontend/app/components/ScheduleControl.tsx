import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Clock, Calendar } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { cn } from "@/lib/utils";

interface ScheduleControlProps {
  isActive: boolean;
  onScheduleToggle?: (isActive: boolean) => void;
  scheduleEnabled: boolean;
  onScheduleEnabledChange: (enabled: boolean) => void;
}

export const ScheduleControl = ({ isActive, onScheduleToggle, scheduleEnabled, onScheduleEnabledChange }: ScheduleControlProps) => {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);

  // Check schedule every minute
  useEffect(() => {
    if (!scheduleEnabled) return;

    const checkSchedule = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const shouldBeActive = currentTime >= startTime && currentTime <= endTime;
      
      if (shouldBeActive !== isActive && onScheduleToggle) {
        onScheduleToggle(shouldBeActive);
      }
    };

    // Check immediately
    checkSchedule();

    // Check every minute
    const interval = setInterval(checkSchedule, 60000);

    return () => clearInterval(interval);
  }, [scheduleEnabled, startTime, endTime, isActive, onScheduleToggle]);

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const TimeSelector = ({ 
    value, 
    onChange, 
    isOpen, 
    setIsOpen, 
    label 
  }: { 
    value: string; 
    onChange: (time: string) => void; 
    isOpen: boolean; 
    setIsOpen: (open: boolean) => void;
    label: string;
  }) => (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-20 justify-center text-sm font-normal",
            !scheduleEnabled && "opacity-50"
          )}
          disabled={!scheduleEnabled}
        >
          <Clock className="w-3 h-3 mr-1" />
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto">
          {timeOptions.map((time) => (
            <Button
              key={time}
              variant={time === value ? "default" : "ghost"}
              className="h-8 text-xs"
              onClick={() => {
                onChange(time);
                setIsOpen(false);
              }}
            >
              {time}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  const getCurrentStatus = () => {
    if (!scheduleEnabled) return "Manual control";
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (currentTime >= startTime && currentTime <= endTime) {
      return "Active period";
    }
    return "Inactive period";
  };

  const getStatusColor = () => {
    const status = getCurrentStatus();
    if (status === "Active period") return "text-audio-success";
    if (status === "Manual control") return "text-muted-foreground";
    return "text-muted-foreground";
  };

  return (
    <Card className="p-4 bg-gradient-card border-border/50 shadow-card h-40">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Schedule</h3>
          <div className="flex items-center space-x-2">
            <Label htmlFor="schedule-mode" className="text-sm text-muted-foreground">
              Auto
            </Label>
            <Switch
              id="schedule-mode"
              checked={scheduleEnabled}
              onCheckedChange={onScheduleEnabledChange}
            />
          </div>
        </div>

        {scheduleEnabled ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <span>From</span>
                    <TimeSelector
                      value={startTime}
                      onChange={setStartTime}
                      isOpen={startTimeOpen}
                      setIsOpen={setStartTimeOpen}
                      label="Start time"
                    />
                    <span>to</span>
                    <TimeSelector
                      value={endTime}
                      onChange={setEndTime}
                      isOpen={endTimeOpen}
                      setIsOpen={setEndTimeOpen}
                      label="End time"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/20 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Status</span>
                <span className={cn("text-sm font-medium", getStatusColor())}>
                  {getCurrentStatus()}
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Next: {getCurrentStatus() === "Active period" ? 
                  `Deactivate at ${endTime}` : 
                  `Activate at ${startTime}`
                }
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Calendar className="w-5 h-5 mx-auto mb-2" />
            <p className="text-sm">Manual control mode</p>
            <p className="text-xs">Enable auto-schedule for timed activation</p>
          </div>
        )}
      </div>
    </Card>
  );
};