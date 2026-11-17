/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Campus } from "../engine/campusCore";
import { LiveCodeTracer } from "./LiveCodeTracer";
import { ArrowLeft, Layers, Compass, BookOpen, Clock, School, Trophy, Trees, AlertCircle, CheckCircle2 } from "lucide-react";

interface StackVisualizerProps {
  campus: Campus;
  onActionTriggered: () => void;
  systemVersion?: number;
}

const AVAILABLE_PAGES = [
  { name: "首頁", icon: Compass, desc: "佛光校園全區總覽與即時公告" },
  { name: "圖書館專區", icon: BookOpen, desc: "館藏檢索、借閱服務與自習席位" },
  { name: "討論室預約頁", icon: Clock, desc: "雲起樓與圖書館研討室線上排隊" },
  { name: "雲起樓教學區", icon: School, desc: "資應系所、講堂與階梯教室導引" },
  { name: "懷恩館體育區", icon: Trophy, desc: "室內體育館、健身房與球場租借" },
  { name: "林美步道生態區", icon: Trees, desc: "佛光十六泉與林美山林生態導覽" },
];

const STACK_CODE_LINES = [
  "def _visit(self, r):            # 壓棧 Push: O(1)",
  "    self.pages.append(r['page'])  # 將新頁面放到堆疊頂端 TOP",
  "    return {'status': 'ok', 'current': self.pages[-1]}",
  "",
  "def _back(self, r):             # 彈棧 Pop: O(1)",
  "    if len(self.pages) == 1:    # 棧底保護（防止 Underflow）",
  "        return {'status': 'error', 'message': 'already at home'}",
  "    self.pages.pop()            # 移除頂端頁面，露出上一頁",
  "    return {'status': 'ok', 'current': self.pages[-1]}",
];

export const StackVisualizer: React.FC<StackVisualizerProps> = ({
  campus,
  onActionTriggered,
  systemVersion = 0,
}) => {
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [traceState, setTraceState] = useState<{
    line: number;
    desc: string;
    vars: Record<string, string | number>;
  }>({
    line: 2,
    desc: "堆疊就緒：進入頁面執行 Push (append)，按返回執行 Pop (pop)",
    vars: {
      top: campus.pages[campus.pages.length - 1],
      depth: campus.pages.length,
    },
  });

  useEffect(() => {
    setFeedback(null);
    setTraceState({
      line: 2,
      desc: "堆疊已更新：進入頁面執行 Push (append)，按返回執行 Pop (pop)",
      vars: {
        top: campus.pages[campus.pages.length - 1],
        depth: campus.pages.length,
      },
    });
  }, [systemVersion]);

  const currentPage = campus.pages[campus.pages.length - 1];

  // 1. Visit 頁面 (Push)
  const handleVisit = (pageName: string) => {
    const res = campus.handle({ cmd: "visit", page: pageName });
    if (res.status === "ok") {
      setFeedback({
        type: "success",
        msg: `進入新頁面 (Push)：【${res.current}】，堆疊高度 ${campus.pages.length}`,
      });
      setTraceState({
        line: 2,
        desc: `Push 壓棧：將「${pageName}」放入堆疊最頂端，TOP 指標上移`,
        vars: {
          pushed: pageName,
          top: res.current!,
          depth: campus.pages.length,
        },
      });
    }
    onActionTriggered();
  };

  // 2. Back 返回上一頁 (Pop)
  const handleBack = () => {
    const poppedCandidate = campus.pages[campus.pages.length - 1];
    const res = campus.handle({ cmd: "back" });
    if (res.status === "ok") {
      setFeedback({
        type: "success",
        msg: `返回上一頁 (Pop)：彈出【${poppedCandidate}】，回到【${res.current}】`,
      });
      setTraceState({
        line: 8,
        desc: `Pop 彈棧：移出頂端頁面「${poppedCandidate}」，TOP 指標退回「${res.current}」`,
        vars: {
          popped: poppedCandidate,
          new_top: res.current!,
          depth: campus.pages.length,
        },
      });
    } else {
      setFeedback({
        type: "error",
        msg: `無法返回：${res.message} (目前已在最底層首頁)`,
      });
      setTraceState({
        line: 7,
        desc: "棧底保護觸發 (len == 1)：堆疊只剩 Base「首頁」，不可再 Pop 以防止 Underflow",
        vars: {
          depth: 1,
          guard: "already at home",
        },
      });
    }
    onActionTriggered();
  };

  const getPageInfo = (name: string) => {
    return (
      AVAILABLE_PAGES.find((p) => p.name === name) || {
        name,
        icon: Compass,
        desc: "校園專區導覽頁",
      }
    );
  };

  const activePageInfo = getPageInfo(currentPage);
  const ActiveIcon = activePageInfo.icon;

  return (
    <div className="space-y-6">
      {/* 模組標題與規格導讀 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 tracking-wide uppercase">
            <span>Data Structure 4</span>
            <span aria-hidden="true">·</span>
            <span>堆疊 (Stack, LIFO 後進先出)</span>
            <span aria-hidden="true">·</span>
            <span>list append / pop 均 O(1)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            校園導覽 APP 頁面歷史返回 (Navigation Stack)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            所有操作僅發生在頂端 (Top)：進入新頁面 push 入棧，按返回 pop 出棧回到上一頁。
          </p>
        </div>

        {/* 堆疊計數 */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-100 px-3 py-1.5 rounded text-xs text-slate-700">
            當前堆疊深度：<span className="font-bold text-slate-900 font-mono tabular-nums">{campus.pages.length}</span> 層
          </div>
          <button
            onClick={handleBack}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>執行返回 (pop)</span>
          </button>
        </div>
      </div>

      {/* 互動區 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左側：可進入的頁面清單 (Push) 與標準測試步驟 */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-700" />
              <span>點選進入校園專區 (visit / push)</span>
            </h3>

            <div className="space-y-2">
              {AVAILABLE_PAGES.filter((p) => p.name !== "首頁").map((page) => {
                const Icon = page.icon;
                return (
                  <button
                    key={page.name}
                    onClick={() => handleVisit(page.name)}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-md bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-4 h-4 text-slate-700 group-hover:text-indigo-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 group-hover:text-indigo-900">
                        {page.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{page.desc}</div>
                    </div>
                    <div className="text-[11px] text-indigo-700 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      push →
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 快速演練規格標準流程 */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 block mb-1.5">規格測試連續操作演練：</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleVisit("圖書館專區")}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                >
                  1. visit 圖書館專區
                </button>
                <button
                  onClick={() => handleVisit("討論室預約頁")}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                >
                  2. visit 討論室預約頁
                </button>
                <button
                  onClick={handleBack}
                  className="px-2 py-1 text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded font-mono font-medium"
                >
                  3. back (Pop)
                </button>
                <button
                  onClick={handleBack}
                  className="px-2 py-1 text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-mono font-medium"
                >
                  4. 測試首頁保護
                </button>
              </div>
            </div>
          </div>

          {/* 反饋提示 */}
          {feedback && (
            <div
              className={`p-3 rounded text-xs border ${
                feedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <div className="font-semibold flex items-center gap-1.5">
                {feedback.type === "error" ? (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{feedback.msg}</span>
              </div>
            </div>
          )}
        </div>

        {/* 中間：手機 APP 仿真畫面 + 程式碼追蹤 */}
        <div className="lg:col-span-4 space-y-4 flex flex-col items-center">
          <div className="w-full max-w-[320px] bg-slate-900 p-3 rounded-2xl shadow-md border border-slate-700">
            {/* 手機螢幕頂部感測器 */}
            <div className="flex items-center justify-between px-3 py-1 text-[10px] text-slate-400 font-mono mb-2">
              <span>09:41</span>
              <div className="w-16 h-3 bg-slate-800 rounded-full"></div>
              <span>FG-WiFi</span>
            </div>

            {/* 手機螢幕內容 */}
            <div className="bg-white rounded-xl overflow-hidden min-h-[340px] flex flex-col">
              {/* App 頂部導航列 */}
              <div className="bg-slate-900 text-white px-3 py-2.5 flex items-center justify-between">
                <button
                  onClick={handleBack}
                  className={`p-1 rounded hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs ${
                    campus.pages.length <= 1 ? "opacity-30 cursor-not-allowed" : "text-amber-400"
                  }`}
                  disabled={campus.pages.length <= 1}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>返回</span>
                </button>
                <div className="text-xs font-bold truncate max-w-[140px]">
                  {currentPage}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  lvl:{campus.pages.length}
                </div>
              </div>

              {/* App 頁面主體 */}
              <div className="p-4 flex-1 flex flex-col justify-between bg-slate-50">
                <motion.div
                  key={`${currentPage}-${campus.pages.length}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 mx-auto">
                    <ActiveIcon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-slate-900">{currentPage}</div>
                    <div className="text-xs text-slate-500 mt-1">{activePageInfo.desc}</div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1.5">
                    <div className="text-slate-500 text-[11px]">導覽麵包屑 (Stack 路徑)：</div>
                    <div className="font-semibold text-slate-800 break-words">
                      {campus.pages.join(" / ")}
                    </div>
                  </div>
                </motion.div>

                <div className="pt-3 border-t border-slate-200">
                  <button
                    onClick={handleBack}
                    className="w-full py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors"
                  >
                    按此觸發 pop() 返回上一頁
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右側：堆疊視覺化直立槽 (Stack Column) + 追蹤器 */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-700" />
                <h3 className="text-sm font-semibold text-slate-900">
                  堆疊容器狀態 (LIFO 垂直棧槽)
                </h3>
              </div>
              <span className="text-[11px] text-indigo-700 font-mono font-semibold">↕ 單口進出</span>
            </div>

            {/* 垂直堆疊槽（U 型容器視覺） */}
            <div className="bg-slate-50 border-x-2 border-b-2 border-slate-400 rounded-b-xl p-3 min-h-[250px] flex flex-col-reverse justify-start gap-2 relative">
              <AnimatePresence mode="popLayout">
                {campus.pages.map((page, idx) => {
                  const isTop = idx === campus.pages.length - 1;
                  const isBase = idx === 0;
                  return (
                    <motion.div
                      key={`${page}-${idx}`}
                      layout
                      initial={{ opacity: 0, y: -32, scale: 0.94 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -32, scale: 0.94 }}
                      transition={{ duration: 0.22 }}
                      className={`p-2.5 rounded-md border text-xs transition-all flex items-center justify-between ${
                        isTop
                          ? "bg-indigo-50 border-indigo-400 text-indigo-900 font-bold shadow-xs ring-2 ring-indigo-200"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[10px] text-slate-400 shrink-0">
                          [{idx}]
                        </span>
                        <span className="truncate">{page}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isBase && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">
                            BASE
                          </span>
                        )}
                        {isTop && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-600 text-white rounded">
                            TOP
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="mt-2 text-center text-[11px] text-slate-500 font-mono">
              ↑ 頂端 TOP (Push 落入 / Pop 彈出) | 底端 BASE (受保護) ↓
            </div>
          </div>

          <LiveCodeTracer
            title="Python Stack (list) 即時執行追蹤"
            codeLines={STACK_CODE_LINES}
            activeLine={traceState.line}
            stepDescription={traceState.desc}
            variables={traceState.vars}
          />
        </div>
      </div>
    </div>
  );
};
