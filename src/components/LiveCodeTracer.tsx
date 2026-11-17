/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 互動式程式碼執行追蹤器：即時顯示執行中的 Python 演算法行號、變數狀態與原理說明
 */

import React from "react";
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Code2 } from "lucide-react";

export interface TraceStep {
  line: number; // 1-indexed line in codeLines
  description: string;
  variables?: Record<string, string | number>;
}

interface LiveCodeTracerProps {
  title: string;
  codeLines: string[];
  activeLine?: number;
  stepDescription?: string;
  variables?: Record<string, string | number>;
  // 選填：支援多步驟動畫播放
  steps?: TraceStep[];
  currentStepIdx?: number;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onStepForward?: () => void;
  onStepBack?: () => void;
  onResetTrace?: () => void;
}

export const LiveCodeTracer: React.FC<LiveCodeTracerProps> = ({
  title,
  codeLines,
  activeLine,
  stepDescription,
  variables,
  steps,
  currentStepIdx = 0,
  isPlaying = false,
  onPlayPause,
  onStepForward,
  onStepBack,
  onResetTrace,
}) => {
  const hasPlayback = Boolean(steps && steps.length > 0);
  const currentStep = hasPlayback ? steps![currentStepIdx] : undefined;
  const resolvedLine = currentStep ? currentStep.line : activeLine;
  const resolvedDesc = currentStep ? currentStep.description : stepDescription;
  const resolvedVars = currentStep ? currentStep.variables : variables;

  return (
    <div className="bg-slate-950 text-slate-200 rounded-lg border border-slate-800 overflow-hidden shadow-xs">
      {/* Header & Playback Controls */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <Code2 className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-slate-100">{title}</span>
        </div>

        {hasPlayback && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 mr-1 tabular-nums">
              步驟 {currentStepIdx + 1}/{steps!.length}
            </span>
            {onStepBack && (
              <button
                type="button"
                onClick={onStepBack}
                disabled={currentStepIdx <= 0}
                title="上一步"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
            )}
            {onPlayPause && (
              <button
                type="button"
                onClick={onPlayPause}
                title={isPlaying ? "暫停動畫" : "自動播放"}
                className="px-2 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-[11px] flex items-center gap-1 transition-colors"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3 h-3 fill-current" />
                    <span>暫停</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>播放</span>
                  </>
                )}
              </button>
            )}
            {onStepForward && (
              <button
                type="button"
                onClick={onStepForward}
                disabled={currentStepIdx >= steps!.length - 1}
                title="下一步"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            )}
            {onResetTrace && (
              <button
                type="button"
                onClick={onResetTrace}
                title="重播 / 回到起點"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Step Explanation Banner */}
      {resolvedDesc && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-200 flex items-center justify-between gap-2 flex-wrap">
          <span>{resolvedDesc}</span>
          {resolvedVars && Object.keys(resolvedVars).length > 0 && (
            <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
              {Object.entries(resolvedVars).map(([k, v]) => (
                <span key={k} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-300">
                  {k}={String(v)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Code Lines */}
      <div className="p-3 font-mono text-xs overflow-x-auto leading-relaxed">
        {codeLines.map((line, idx) => {
          const lineNo = idx + 1;
          const isActive = resolvedLine === lineNo;
          return (
            <div
              key={lineNo}
              className={`flex items-start px-2 py-0.5 rounded transition-colors ${
                isActive
                  ? "bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/40"
                  : "text-slate-300"
              }`}
            >
              <span className="w-6 text-slate-500 select-none shrink-0 text-right pr-3">
                {lineNo}
              </span>
              <pre className="whitespace-pre">{line}</pre>
            </div>
          );
        })}
      </div>
    </div>
  );
};
