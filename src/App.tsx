/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Campus } from "./engine/campusCore";
import { Header } from "./components/Header";
import { QueueVisualizer } from "./components/QueueVisualizer";
import { BSTVisualizer } from "./components/BSTVisualizer";
import { LinkedListVisualizer } from "./components/LinkedListVisualizer";
import { StackVisualizer } from "./components/StackVisualizer";
import { TestRunnerView } from "./components/TestRunnerView";
import { JsonConsole } from "./components/JsonConsole";
import { PromptEngineeringGuide } from "./components/PromptEngineeringGuide";
import { PythonCodeViewer } from "./components/PythonCodeViewer";
import { STANDARD_TEST_CASES } from "./data/standardTests";
import {
  Users,
  Binary,
  GitCommit,
  Layers,
  Sparkles,
  BookOpen,
  Calendar,
  Compass,
} from "lucide-react";

export default function App() {
  // 核心單例校園系統實例（初始載入經典規格示範資料）
  const campus = useMemo(() => {
    const c = new Campus();
    c.loadDemoData();
    return c;
  }, []);
  const [, setRenderTrigger] = useState(0);

  // 導航分頁狀態
  const [activeTab, setActiveTab] = useState<string>("sandbox");
  // 沙盒內的子資料結構切換
  const [activeDsModule, setActiveDsModule] = useState<
    "queue" | "bst" | "linkedlist" | "stack"
  >("queue");

  // 測試執行統計狀態與觸發鍵
  const [autoRunKey, setAutoRunKey] = useState(0);
  const [testStats, setTestStats] = useState({
    executed: 0,
    passed: 0,
    total: STANDARD_TEST_CASES.length,
  });

  const triggerUpdate = () => {
    setRenderTrigger((prev) => prev + 1);
  };

  // 快速重設
  const handleResetSystem = () => {
    campus.reset();
    triggerUpdate();
  };

  // 重新載入示範資料
  const handleLoadDemo = () => {
    campus.loadDemoData();
    triggerUpdate();
  };

  // 頂部「全量執行測試」跳轉並自動執行
  const handleRunAllTestsFromHeader = () => {
    setActiveTab("tests");
    setAutoRunKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans selection:bg-amber-200">
      {/* 依據 Top Bar Contract 設計的頂部導航列 */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRunAllTests={handleRunAllTestsFromHeader}
        onReset={handleResetSystem}
        passedTestsCount={testStats.passed}
        totalTestsCount={testStats.total}
      />

      {/* Hero 區域：介紹系統情境與四大資料結構對照 */}
      <section className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
                <span>佛光大學情境專案</span>
                <span aria-hidden="true">·</span>
                <span>資料結構演算法實作</span>
                <span aria-hidden="true">·</span>
                <span>工程化提示詞體系</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                佛光校園智慧服務系統
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                以佛光大學日常學生情境為核心，分別將{" "}
                <strong className="text-white">佇列 (Queue)</strong> 應用於圖書館討論室預約、
                <strong className="text-white">二元搜尋樹 (BST)</strong> 應用於索書號檢索與自動排序、
                <strong className="text-white">鏈結串列 (Linked List)</strong> 串接個人化行事曆、
                <strong className="text-white">堆疊 (Stack)</strong> 實作校園導覽頁面返回。
              </p>

              {/* 快速載入示範狀態與重設控制 */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleLoadDemo}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>載入題目經典示範資料</span>
                </button>
                <button
                  onClick={handleResetSystem}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
                >
                  清空重設系統
                </button>
              </div>
            </div>

            {/* 即時系統運行數據 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/80 shrink-0">
              <div>
                <div className="text-slate-400 text-[11px]">佇列等候</div>
                <div className="text-base font-bold font-mono text-amber-400 tabular-nums">
                  {campus.rooms.length} 人
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">館藏索書號</div>
                <div className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                  {campus.books.inorder().length} 本
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">學生行事曆</div>
                <div className="text-base font-bold font-mono text-sky-400 tabular-nums">
                  {campus.calendars.size} 位
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">導覽頁棧深</div>
                <div className="text-base font-bold font-mono text-indigo-400 tabular-nums">
                  {campus.pages.length} 層
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 主內容區 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 1. 四大資料結構互動沙盒 */}
        {activeTab === "sandbox" && (
          <div className="space-y-6">
            {/* 4 大資料結構切換 Segmented Tabs */}
            <div className="flex items-center justify-start gap-1 p-1 bg-white border border-slate-200 rounded-lg shadow-xs overflow-x-auto">
              <button
                onClick={() => setActiveDsModule("queue")}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeDsModule === "queue"
                    ? "bg-amber-400 text-slate-950 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>1. 佇列 (Queue) 預約叫號</span>
              </button>

              <button
                onClick={() => setActiveDsModule("bst")}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeDsModule === "bst"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Binary className="w-3.5 h-3.5" />
                <span>2. 二元搜尋樹 (BST) 索書號</span>
              </button>

              <button
                onClick={() => setActiveDsModule("linkedlist")}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeDsModule === "linkedlist"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>3. 鏈結串列 (Linked List) 行事曆</span>
              </button>

              <button
                onClick={() => setActiveDsModule("stack")}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeDsModule === "stack"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>4. 堆疊 (Stack) 導覽返回</span>
              </button>
            </div>

            {/* 對應的視覺化模組畫布 */}
            <div className="transition-opacity duration-200">
              {activeDsModule === "queue" && (
                <QueueVisualizer
                  campus={campus}
                  onActionTriggered={triggerUpdate}
                />
              )}
              {activeDsModule === "bst" && (
                <BSTVisualizer
                  campus={campus}
                  onActionTriggered={triggerUpdate}
                />
              )}
              {activeDsModule === "linkedlist" && (
                <LinkedListVisualizer
                  campus={campus}
                  onActionTriggered={triggerUpdate}
                />
              )}
              {activeDsModule === "stack" && (
                <StackVisualizer
                  campus={campus}
                  onActionTriggered={triggerUpdate}
                />
              )}
            </div>
          </div>
        )}

        {/* 2. 30 筆測試驗證套件 */}
        {activeTab === "tests" && (
          <TestRunnerView
            campus={campus}
            onStateUpdate={triggerUpdate}
            autoRunKey={autoRunKey}
            onStatsUpdate={setTestStats}
          />
        )}

        {/* 3. JSON 終端機 */}
        {activeTab === "console" && (
          <JsonConsole campus={campus} onStateUpdate={triggerUpdate} />
        )}

        {/* 4. 工程化提示詞手冊 */}
        {activeTab === "prompt" && <PromptEngineeringGuide />}

        {/* 5. Python 原始碼 */}
        {activeTab === "code" && <PythonCodeViewer />}
      </main>

      {/* 簡潔合規頁尾 */}
      <footer className="mt-auto border-t border-slate-200 bg-white text-xs text-slate-500 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            佛光校園智慧服務系統 · Queue · BST · Linked List · Stack
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Python 3.10+ 原生實作</span>
            <span aria-hidden="true">·</span>
            <span>JSON 協定相容</span>
            <span aria-hidden="true">·</span>
            <span>無例外拋出安全架構</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
