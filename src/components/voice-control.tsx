"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Check, X, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { VoiceCommand, CommandExecutionResult } from "@/lib/aiInsights";
import { parseVoiceCommand } from "@/lib/aiInsights";
import type { Participant } from "@/types";

interface VoiceLog {
  id: string;
  timestamp: Date;
  command: VoiceCommand;
  result: CommandExecutionResult;
}

interface VoiceControlProps {
  participants: Participant[];
  onCommandExecuted?: (result: CommandExecutionResult) => void;
  onError?: (error: string) => void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionAPI {
  new (): SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
  start: () => void;
  abort: () => void;
}

interface SpeechRecognitionResultList {
  length: number;
  item: (index: number) => SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item: (index: number) => SpeechRecognitionAlternative;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export default function VoiceControl({
  participants,
  onCommandExecuted,
  onError,
}: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedCommand, setParsedCommand] = useState<VoiceCommand | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandLog, setCommandLog] = useState<VoiceLog[]>([]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition =
      (typeof window !== "undefined" &&
        ((window as unknown) as Record<string, unknown>).SpeechRecognition as SpeechRecognitionAPI) ||
      (typeof window !== "undefined" &&
        ((window as unknown) as Record<string, unknown>).webkitSpeechRecognition as SpeechRecognitionAPI);

    if (!SpeechRecognition) {
      onError?.("Speech Recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setParsedCommand(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setTranscript(transcript);
          // Parse immediately
          const parsed = parseVoiceCommand(transcript, participants);
          setParsedCommand(parsed);
          // Auto-execute if confident
          if (parsed.confidence > 0) {
            setTimeout(() => executeCommand(parsed), 100);
          }
        } else {
          interimTranscript += transcript;
        }
      }
      if (interimTranscript) {
        setTranscript(interimTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      onError?.(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [participants, onError]);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      setIsListening(false);
    }
  };

  const executeCommand = async (command: VoiceCommand) => {
    if (command.confidence === 0) {
      onError?.(command.interpretation);
      return;
    }

    setIsExecuting(true);

    try {
      let endpoint = "";
      let method = "PATCH";
      let body: Record<string, unknown> = {};

      switch (command.type) {
        case "driver_status":
          endpoint = `/api/participants/${command.participantId}`;
          body = {
            driver: command.newDriverStatus,
            selfDriver: command.newSelfDriverStatus,
          };
          break;

        case "seat_capacity":
          endpoint = `/api/participants/${command.participantId}`;
          body = {
            seats: command.newSeats,
          };
          break;

        case "move_rider":
          endpoint = `/api/carpool/move`;
          method = "POST";
          body = {
            riderId: command.participantId,
            targetCarId: command.targetCarId,
          };
          break;

        case "set_status":
          endpoint = `/api/participants/${command.participantId}`;
          body = {
            status: command.newEventStatus,
          };
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result: CommandExecutionResult = {
        success: true,
        message: command.interpretation,
        participantId: command.participantId,
      };

      // Add to log
      const logEntry: VoiceLog = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        command,
        result,
      };
      setCommandLog((prev) => [logEntry, ...prev]);

      onCommandExecuted?.(result);

      // Clear transcript after brief delay
      setTimeout(() => {
        setTranscript("");
        setParsedCommand(null);
      }, 1500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      const result: CommandExecutionResult = {
        success: false,
        message: `Failed to execute: ${command.interpretation}`,
        error: errorMsg,
      };

      // Add to log
      const logEntry: VoiceLog = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        command,
        result,
      };
      setCommandLog((prev) => [logEntry, ...prev]);

      onError?.(errorMsg);
    } finally {
      setIsExecuting(false);
    }
  };

  const clearLog = () => {
    setCommandLog([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          {/* Mic Button */}
          <div className="flex gap-2">
            {!isListening ? (
              <Button
                onClick={startListening}
                className="flex-1 gap-2"
                variant="default"
              >
                <Mic className="w-4 h-4" />
                Start Voice Command
              </Button>
            ) : (
              <Button
                onClick={stopListening}
                className="flex-1 gap-2"
                variant="secondary"
              >
                <MicOff className="w-4 h-4" />
                Stop Listening
              </Button>
            )}
          </div>

          {/* Listening indicator */}
          {isListening && (
            <div className="text-sm text-amber-600 font-medium animate-pulse">
              Listening...
            </div>
          )}

          {/* Transcript display */}
          {transcript && (
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Heard:</div>
              <div className="text-sm font-medium">{transcript}</div>
            </div>
          )}

          {/* Parsed command display */}
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

          {/* Executing indicator */}
          {isExecuting && (
            <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm text-blue-600 font-medium animate-pulse">
              Executing command...
            </div>
          )}
        </div>
      </Card>

      {/* Command Log */}
      {commandLog.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">AI Action Log</h3>
            <Button
              onClick={clearLog}
              size="sm"
              variant="ghost"
              className="gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {commandLog.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded border text-sm ${
                  log.result.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  {log.result.success ? (
                    <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-medium ${
                        log.result.success
                          ? "text-green-900"
                          : "text-red-900"
                      }`}
                    >
                      {log.result.message}
                    </div>
                    <div className="text-xs mt-1 opacity-75">
                      {formatTime(log.timestamp)} • {log.command.rawInput}
                    </div>
                    {log.result.error && (
                      <div className="text-xs text-red-700 mt-1">
                        Error: {log.result.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
