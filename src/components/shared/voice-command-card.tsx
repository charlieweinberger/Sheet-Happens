import { Mic, MicOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { VoiceCommand } from "@/lib/aiInsights";

export function VoiceCommandCard({
  isListening,
  transcript,
  parsedCommand,
  isExecuting,
  onStartListening,
  onStopListening,
}: {
  isListening: boolean;
  transcript: string;
  parsedCommand: VoiceCommand | null;
  isExecuting: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex gap-2">
          {!isListening ? (
            <Button
              onClick={onStartListening}
              className="flex-1 gap-2"
              variant="default"
            >
              <Mic className="w-4 h-4" />
              Start Voice Command
            </Button>
          ) : (
            <Button
              onClick={onStopListening}
              className="flex-1 gap-2"
              variant="secondary"
            >
              <MicOff className="w-4 h-4" />
              Stop Listening
            </Button>
          )}
        </div>

        {isListening && (
          <div className="text-sm text-amber-600 font-medium animate-pulse">
            Listening...
          </div>
        )}

        {transcript && (
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Heard:</div>
            <div className="text-sm font-medium">{transcript}</div>
          </div>
        )}

        {parsedCommand && parsedCommand.confidence === 0 && (
          <div className="bg-red-50 p-3 rounded border border-red-200 flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-600">
              <div className="font-medium">{parsedCommand.interpretation}</div>
              {parsedCommand.ambiguities?.length ? (
                <div className="text-xs mt-1">
                  {parsedCommand.ambiguities.join("; ")}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {isExecuting && (
          <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm text-blue-600 font-medium animate-pulse">
            Executing command...
          </div>
        )}
      </div>
    </Card>
  );
}
