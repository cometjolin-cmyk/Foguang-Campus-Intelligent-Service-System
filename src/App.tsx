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
import { ConceptOverview } from "./components/ConceptOverview";
import {
  AiTeacherDrawer,
  AiTeacherPromptBar,
  AiModuleId,
  MODULE_TEACHER_META,
} from "./components/AiTeacherDrawer";
import { STANDARD_TEST_CASES } from "./data/standardTests";
import {
  Users,
  Binary,
  Sparkles,
  Calendar,
  Compass,
  BookOpen,
  GraduationCap,
} from "lucide-react";

export default function App() {
  // 核心單例校園系統實例（初始載入經典規格示範資料）
  const campus = useMemo(() => {
    const c = new Campus();
    c.loadDemoData();
    return c;
  }, []);
  const [, setRenderTrigger] = useState(0);
  const [systemVersion, setSystemVersion] = useState(0);

  // 導航分頁狀態
  const [activeTab, setActiveTab] = useState<string>("sandbox");
  // 沙盒內的子資料結構切換
  const [activeDsModule, setActiveDsModule] = useState<
    "overview" | "queue" | "bst" | "linkedlist" | "stack"
  >("overview");

  // 測試執行統計狀態與觸發鍵
  const [autoRunKey, setAutoRunKey] = useState(0);
  const [testStats, setTestStats] = useState({
    executed: 0,
    passed: 0,
    total: STANDARD_TEST_CASES.length,
  });

  // AI 老師講堂狀態
  const [aiOpen, setAiOpen] = useState(false);
  const [pendingAiQuestion, setPendingAiQuestion] = useState<string | null>(null);

  const triggerUpdate = () => {
    setRenderTrigger((prev) => prev + 1);
  };

  const currentAiModuleId: AiModuleId =
    activeTab === "sandbox"
      ? activeDsModule
      : activeTab === "tests"
      ? "tests"
      : activeTab === "console"
      ? "console"
      : activeTab === "prompt"
      ? "prompt"
      : "code";

  const openAiTeacher = (question?: string) => {
    if (question) {
      setPendingAiQuestion(question);
    }
    setAiOpen(true);
  };

  // 建立當前模組即時資料快照供 AI 老師精準作答
  const buildContextSnapshot = (): string => {
    switch (currentAiModuleId) {
      case "queue": {
        const list = campus.rooms.map((r) => `${r.ticket}(${r.student_id})`).join(" → ");
        return `佇列等候 ${campus.rooms.length} 人，累計發號 ${campus.ticket_no}；目前隊列：[${list || "空"}]`;
      }
      case "bst": {
        const books = campus.books.inorder();
        const rootNo = campus.books.root?.call_no ?? "None";
        const items = books.map((b) => `${b.call_no}《${b.title}》`).join(", ");
        return `BST 節點數 ${books.length}，樹高 ${campus.books.height()}，Root=${rootNo}，中序由小到大：[${items || "空"}]`;
      }
      case "linkedlist": {
        const summaries: string[] = [];
        campus.calendars.forEach((sched, sid) => {
          const evs = sched.allEvents().map((e, i) => `[${i}]${e.day} ${e.time} ${e.event}`);
          summaries.push(`${sid}: ${evs.join(" → ") || "空"}`);
        });
        return `目前共有 ${campus.calendars.size} 位學生行事曆；${summaries.join(" | ") || "尚無紀錄"}`;
      }
      case "stack":
        return `堆疊深度 ${campus.pages.length} 層，由底(Base)到頂(Top)：[${campus.pages.join(" → ")}]，目前頁面：「${campus.pages[campus.pages.length - 1]}」`;
      case "tests":
        return `30 筆測試套件：已通過 ${testStats.passed}/${testStats.total} 筆`;
      case "console":
        return `JSON 終端機就緒；佇列 ${campus.rooms.length} 人 / BST ${campus.books.inorder().length} 本 / 行事曆 ${campus.calendars.size} 位 / 導覽棧 ${campus.pages.length} 層`;
      case "prompt":
        return "工程化提示詞手冊（System Prompt、Few-shot、長上下文標籤與 RAG）";
      case "code":
        return "Python 3 campus.py 原生實作檢視中";
      case "overview":
      default:
        return `系統總覽：佇列 ${campus.rooms.length} 人、BST ${campus.books.inorder().length} 本、行事曆 ${campus.calendars.size} 位、導覽棧 ${campus.pages.length} 層`;
    }
  };

  // 快速重設
  const handleResetSystem = () => {
    campus.reset();
    setSystemVersion((prev) => prev + 1);
    triggerUpdate();
  };

  // 重新載入示範資料
  const handleLoadDemo = () => {
    campus.loadDemoData();
    setSystemVersion((prev) => prev + 1);
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

            {/* 即時系統運行數據（點擊可直接跳轉對應模組） */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/80 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("sandbox");
                  setActiveDsModule("queue");
                }}
                className="text-left hover:bg-slate-700/60 p-1.5 -m-1.5 rounded transition-colors"
              >
                <div className="text-slate-400 text-[11px]">佇列等候</div>
                <div className="text-base font-bold font-mono text-amber-400 tabular-nums">
                  {campus.rooms.length} 人
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("sandbox");
                  setActiveDsModule("bst");
                }}
                className="text-left hover:bg-slate-700/60 p-1.5 -m-1.5 rounded transition-colors"
              >
                <div className="text-slate-400 text-[11px]">館藏索書號</div>
                <div className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                  {campus.books.inorder().length} 本
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("sandbox");
                  setActiveDsModule("linkedlist");
                }}
                className="text-left hover:bg-slate-700/60 p-1.5 -m-1.5 rounded transition-colors"
              >
                <div className="text-slate-400 text-[11px]">學生行事曆</div>
                <div className="text-base font-bold font-mono text-sky-400 tabular-nums">
                  {campus.calendars.size} 位
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("sandbox");
                  setActiveDsModule("stack");
                }}
                className="text-left hover:bg-slate-700/60 p-1.5 -m-1.5 rounded transition-colors"
              >
                <div className="text-slate-400 text-[11px]">導覽頁棧深</div>
                <div className="text-base font-bold font-mono text-indigo-400 tabular-nums">
                  {campus.pages.length} 層
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 主內容區 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 1. 四大資料結構互動沙盒 */}
        {activeTab === "sandbox" && (
          <div className="space-y-6">
            {/* 資料結構切換 Segmented Tabs */}
            <div className="flex items-center justify-start gap-1 p-1 bg-white border border-slate-200 rounded-lg shadow-xs overflow-x-auto">
              <button
                onClick={() => setActiveDsModule("overview")}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeDsModule === "overview"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>0. 知識原理總覽</span>
              </button>

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
            <div className="transition-opacity duration-200 space-y-6">
              {activeDsModule === "overview" && (
                <ConceptOverview
                  onSelectModule={(mod) => setActiveDsModule(mod)}
                />
              )}
              {activeDsModule === "queue" && (
                <QueueVisualizer
                  campus={campus}
                  onActionTriggered={triggerUpdate}
                  systemVersion={systemVersion}
                />
              )}
              {activeDsModule === "bst" && (
                <BSTVisualizer
                  campus={campus}
                  onActionTriggered={triggerUpdate}
                  systemVersion={systemVersion}
                />
              )}
              {activeDsModule === "linkedlist" && (
                <LinkedListVisualizer
                  campus={campus}
                  onActionTriggered={triggerUpdate}
                  systemVersion={systemVersion}
                />
              )}
              {activeDsModule === "stack" && (
                <StackVisualizer
                  campus={campus}
                  onActionTriggered={triggerUpdate}
                  systemVersion={systemVersion}
                />
              )}

              <AiTeacherPromptBar
                moduleId={currentAiModuleId}
                onOpenWithQuestion={openAiTeacher}
              />
            </div>
          </div>
        )}

        {/* 2. 30 筆測試驗證套件 */}
        {activeTab === "tests" && (
          <div className="space-y-6">
            <AiTeacherPromptBar
              moduleId="tests"
              onOpenWithQuestion={openAiTeacher}
            />
            <TestRunnerView
              campus={campus}
              onStateUpdate={triggerUpdate}
              autoRunKey={autoRunKey}
              onStatsUpdate={setTestStats}
            />
          </div>
        )}

        {/* 3. JSON 終端機 */}
        {activeTab === "console" && (
          <div className="space-y-6">
            <AiTeacherPromptBar
              moduleId="console"
              onOpenWithQuestion={openAiTeacher}
            />
            <JsonConsole campus={campus} onStateUpdate={triggerUpdate} />
          </div>
        )}

        {/* 4. 工程化提示詞手冊 */}
        {activeTab === "prompt" && (
          <div className="space-y-6">
            <AiTeacherPromptBar
              moduleId="prompt"
              onOpenWithQuestion={openAiTeacher}
            />
            <PromptEngineeringGuide />
          </div>
        )}

        {/* 5. Python 原始碼 */}
        {activeTab === "code" && (
          <div className="space-y-6">
            <AiTeacherPromptBar
              moduleId="code"
              onOpenWithQuestion={openAiTeacher}
            />
            <PythonCodeViewer />
          </div>
        )}
      </main>

      {/* 右下角常駐快速呼叫 AI 老師按鈕 */}
      {!aiOpen && (
        <button
          type="button"
          onClick={() => openAiTeacher()}
          className="fixed bottom-5 right-5 z-40 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 shadow-lg flex items-center gap-2 text-xs font-semibold transition-transform hover:-translate-y-0.5"
        >
          <GraduationCap className="w-4 h-4 text-amber-400" />
          <span>問 AI 老師</span>
          <span className="text-[11px] font-normal text-amber-300 hidden sm:inline">
            · {MODULE_TEACHER_META[currentAiModuleId].shortName}
          </span>
        </button>
      )}

      {/* AI 老師右側講堂抽屜 */}
      <AiTeacherDrawer
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        moduleId={currentAiModuleId}
        contextSnapshot={buildContextSnapshot()}
        pendingQuestion={pendingAiQuestion}
        onClearPendingQuestion={() => setPendingAiQuestion(null)}
      />

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
