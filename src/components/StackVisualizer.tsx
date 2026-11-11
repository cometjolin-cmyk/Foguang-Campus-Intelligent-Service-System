/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Campus } from "../engine/campusCore";
import { ArrowLeft, Layers, Compass, BookOpen, Clock, School, Trophy, Trees, AlertCircle, CheckCircle2 } from "lucide-react";

interface StackVisualizerProps {
  campus: Campus;
  onActionTriggered: () => void;
}

const AVAILABLE_PAGES = [
  { name: "首頁", icon: Compass, desc: "佛光校園全區總覽與即時公告" },
  { name: "圖書館專區", icon: BookOpen, desc: "館藏檢索、借閱服務與自習席位" },
  { name: "討論室預約頁", icon: Clock, desc: "雲起樓與圖書館研討室線上排隊" },
  { name: "雲起樓教學區", icon: School, desc: "資應系所、講堂與階梯教室導引" },
  { name: "懷恩館體育區", icon: Trophy, desc: "室內體育館、健身房與球場租借" },
  { name: "林美步道生態區", icon: Trees, desc: "佛光十六泉與林美山林生態導覽" },
];

export const StackVisualizer: React.FC<StackVisualizerProps> = ({
  campus,
  onActionTriggered,
}) => {
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const currentPage = campus.pages[campus.pages.length - 1];

  // 1. Visit 頁面 (Push)
  const handleVisit = (pageName: string) => {
    const res = campus.handle({ cmd: "visit", page: pageName });
    if (res.status === "ok") {
      setFeedback({
        type: "success",
        msg: `進入新頁面 (Push)：【${res.current}】，堆疊高度 ${campus.pages.length}`,
      });
    }
    onActionTriggered();
  };

  // 2. Back 返回上一頁 (Pop)
  const handleBack = () => {
    const res = campus.handle({ cmd: "back" });
    if (res.status === "ok") {
      setFeedback({
        type: "success",
        msg: `返回上一頁 (Pop)：回到【${res.current}】，堆疊高度 ${campus.pages.length}`,
      });
    } else {
      setFeedback({
        type: "error",
        msg: `無法返回：${res.message} (目前已在最底層首頁)`,
      });
    }
    onActionTriggered();
  };

  const getPageInfo = (name: string) => {
    return AVAILABLE_PAGES.find((p) => p.name === name) || {
      name,
      icon: Compass,
      desc: "校園專區導覽頁",
    };
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
            進入新頁面 push 入棧，按返回 pop 出棧回到上一頁；退至最底層「首頁」時防禦回傳 already at home。
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
            <span>執行返回 (back)</span>
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
                    className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors flex items-center gap-3 group"
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
                  3. back (至圖書館)
                </button>
                <button
                  onClick={handleBack}
                  className="px-2 py-1 text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded font-mono font-medium"
                >
                  4. back (至首頁)
                </button>
                <button
                  onClick={handleBack}
                  className="px-2 py-1 text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-mono font-medium"
                >
                  5. [測試已在首頁] back
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
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{feedback.msg}</span>
              </div>
            </div>
          )}
        </div>

        {/* 中間：手機 APP 仿真畫面 */}
        <div className="lg:col-span-4 flex justify-center">
          <div className="w-full max-w-[320px] bg-slate-900 p-3 rounded-2xl shadow-md border border-slate-700">
            {/* 手機螢幕頂部感測器 */}
            <div className="flex items-center justify-between px-3 py-1 text-[10px] text-slate-400 font-mono mb-2">
              <span>09:41</span>
              <div className="w-16 h-3 bg-slate-800 rounded-full"></div>
              <span>FG-WiFi</span>
            </div>

            {/* 手機螢幕內容 */}
            <div className="bg-white rounded-xl overflow-hidden min-h-[380px] flex flex-col">
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
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 mx-auto">
                    <ActiveIcon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-slate-900">{currentPage}</div>
                    <div className="text-xs text-slate-500 mt-1">{activePageInfo.desc}</div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1.5">
                    <div className="text-slate-500 text-[11px]">佛光校園智慧服務現況：</div>
                    <div className="font-semibold text-slate-800">
                      當前路徑：{campus.pages.join(" / ")}
                    </div>
                  </div>
                </div>

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

        {/* 右側：堆疊視覺化直立槽 (Stack Column) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-700" />
                <h3 className="text-sm font-semibold text-slate-900">
                  堆疊內部狀態 (LIFO Stack)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">[頂部出入 Top]</span>
            </div>

            {/* 垂直堆疊槽 */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-3 min-h-[260px] flex flex-col-reverse justify-start gap-2">
              {campus.pages.map((page, idx) => {
                const isTop = idx === campus.pages.length - 1;
                return (
                  <div
                    key={`${page}-${idx}`}
                    className={`p-2.5 rounded-md border text-xs transition-all flex items-center justify-between ${
                      isTop
                        ? "bg-indigo-50 border-indigo-400 text-indigo-900 font-bold shadow-xs ring-2 ring-indigo-200"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">
                        [{idx}]
                      </span>
                      <span>{page}</span>
                    </div>
                    {isTop && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-600 text-white rounded">
                        TOP (Current)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-2 text-center text-[11px] text-slate-400 font-mono">
              ↑ 頂端 Push / Pop 介面 | 底層 Base (首頁) ↓
            </div>
          </div>

          {/* 演算法複雜度手冊卡片 */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600">
            <div className="font-semibold text-slate-800 mb-1">演算法與複雜度解析：</div>
            <p>
              • <strong>堆疊 (Stack)</strong> 遵循後進先出 (LIFO) 原則，最後瀏覽的頁面最先被彈出。<br />
              • Python 程式碼直接使用標準清單的 <code className="font-mono text-slate-800">pages.append()</code> (Push) 與 <code className="font-mono text-slate-800">pages.pop()</code> (Pop)。<br />
              • 兩者在尾端操作均具備均攤 <strong className="font-mono text-indigo-700">O(1)</strong> 時間複雜度。<br />
              • 邊界防禦：當堆疊大小為 1（僅剩首頁）時，拒絕 pop 並回傳錯誤訊息，防止頁面棧空崩潰。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
