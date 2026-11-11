/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Play, RotateCcw, CheckCircle2 } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRunAllTests: () => void;
  onReset: () => void;
  passedTestsCount: number;
  totalTestsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRunAllTests,
  onReset,
  passedTestsCount,
  totalTestsCount,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element wordmark in display face) */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#sandbox"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("sandbox");
            }}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap hover:text-amber-400 transition-colors"
          >
            佛光校園智慧服務系統
          </a>
        </div>

        {/* Zone 2: 4-5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab("sandbox")}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === "sandbox"
                ? "text-amber-400 font-semibold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            四模組沙盒
          </button>
          <button
            onClick={() => setActiveTab("tests")}
            className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
              activeTab === "tests"
                ? "text-amber-400 font-semibold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <span>30筆測試驗證</span>
            {passedTestsCount === totalTestsCount && (
              <span className="text-xs text-emerald-400 font-mono">
                ({passedTestsCount}/{totalTestsCount})
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("console")}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === "console"
                ? "text-amber-400 font-semibold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            JSON終端機
          </button>
          <button
            onClick={() => setActiveTab("prompt")}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === "prompt"
                ? "text-amber-400 font-semibold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            提示詞工程手冊
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === "code"
                ? "text-amber-400 font-semibold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Python源碼
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onReset}
            title="重設資料結構至初始狀態"
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重設系統</span>
          </button>
          <button
            onClick={onRunAllTests}
            className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>全量執行測試</span>
          </button>
        </div>
      </div>
    </header>
  );
};
