/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Campus, JsonResponse } from "../engine/campusCore";
import { Users, Ticket, Bell, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

interface QueueVisualizerProps {
  campus: Campus;
  onActionTriggered: () => void;
  lastResponse?: JsonResponse | null;
}

export const QueueVisualizer: React.FC<QueueVisualizerProps> = ({
  campus,
  onActionTriggered,
}) => {
  const [studentId, setStudentId] = useState("S1001");
  const [localFeedback, setLocalFeedback] = useState<{
    type: "success" | "error" | "info";
    msg: string;
    detail?: string;
  } | null>(null);
  const [calledRecord, setCalledRecord] = useState<{
    ticket: string;
    student_id: string;
    time: string;
  }[]>([]);

  const handleReserve = () => {
    if (!studentId.trim()) return;
    const res = campus.handle({ cmd: "reserve", student_id: studentId.trim() });
    if (res.status === "ok") {
      setLocalFeedback({
        type: "success",
        msg: `預約成功！號碼牌 ${res.ticket}`,
        detail: `學號 ${studentId} 前方還有 ${res.ahead} 人等候`,
      });
    } else {
      setLocalFeedback({
        type: "error",
        msg: `預約失敗`,
        detail: res.message,
      });
    }
    onActionTriggered();
  };

  const handleCallNext = () => {
    const res = campus.handle({ cmd: "call_next" });
    if (res.status === "ok") {
      const now = new Date().toLocaleTimeString("zh-TW", { hour12: false });
      setLocalFeedback({
        type: "info",
        msg: `叫號通知：請 ${res.ticket}（學號 ${res.student_id}）入座！`,
        detail: `請至圖書館/雲起樓研討室報到`,
      });
      setCalledRecord((prev) => [
        { ticket: res.ticket!, student_id: res.student_id!, time: now },
        ...prev.slice(0, 4),
      ]);
    } else {
      setLocalFeedback({
        type: "error",
        msg: `叫號失敗：${res.message}`,
        detail: "佇列已無等候者 (no one waiting)",
      });
    }
    onActionTriggered();
  };

  return (
    <div className="space-y-6">
      {/* 模組標題與規格導讀 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 tracking-wide uppercase">
            <span>Data Structure 1</span>
            <span aria-hidden="true">·</span>
            <span>FIFO 先進先出</span>
            <span aria-hidden="true">·</span>
            <span>collections.deque</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            圖書館與雲起樓討論室預約叫號系統 (Queue)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            以雙端佇列管理預約先後順序，發放號碼牌 (如 Q-001)，管理員依序叫號，佇列空時拋出明確錯誤。
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-100 px-3 py-1.5 rounded text-xs text-slate-700">
            等候人數：<span className="font-bold text-slate-900 font-mono tabular-nums">{campus.rooms.length}</span> 人
          </div>
          <div className="bg-slate-100 px-3 py-1.5 rounded text-xs text-slate-700">
            累計發號：<span className="font-bold text-slate-900 font-mono tabular-nums">{campus.ticket_no}</span>
          </div>
        </div>
      </div>

      {/* 互動操作區 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左側：操作控制面板 */}
        <div className="lg:col-span-5 space-y-4">
          {/* 取號預約 Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-amber-600" />
              <span>學生預約取號 (reserve)</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  請輸入學生學號
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="例如 S1001"
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  <button
                    onClick={handleReserve}
                    className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors whitespace-nowrap"
                  >
                    領取號碼牌
                  </button>
                </div>
              </div>

              {/* 常用學號快捷鍵 */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>快速填入：</span>
                {["S1001", "S1002", "S1003", "S1004"].map((sid) => (
                  <button
                    key={sid}
                    type="button"
                    onClick={() => setStudentId(sid)}
                    className="text-xs text-slate-700 hover:text-amber-600 underline font-mono"
                  >
                    {sid}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 管理員叫號 Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <span>管理員叫號 (call_next)</span>
              </h3>
              <span className="text-xs text-slate-500">FIFO 隊首出列</span>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              點擊後叫出當前排在最前面的同學（佇列為空時回傳 <code className="text-rose-600 font-mono">no one waiting</code>）。
            </p>

            <button
              onClick={handleCallNext}
              className="w-full py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center justify-center gap-2"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>呼叫下一位同學</span>
            </button>
          </div>

          {/* 即時操作反饋通知 */}
          {localFeedback && (
            <div
              className={`p-3 rounded text-xs border ${
                localFeedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : localFeedback.type === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              <div className="font-semibold flex items-center gap-1.5">
                {localFeedback.type === "error" ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{localFeedback.msg}</span>
              </div>
              {localFeedback.detail && (
                <div className="mt-1 text-slate-600">{localFeedback.detail}</div>
              )}
            </div>
          )}
        </div>

        {/* 右側：佇列視覺化走道與叫號紀錄 */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-900">
                  排隊等候動態視覺道 (FIFO Pipeline)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                [叫號出口 ← ... ← 新預約入口]
              </span>
            </div>

            {/* 佇列視覺化橫向輸送管 */}
            <div className="min-h-[140px] bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4 flex items-center overflow-x-auto gap-3">
              {campus.rooms.length === 0 ? (
                <div className="w-full text-center py-6 text-xs text-slate-400">
                  目前討論室無人等候（佇列為空）。請點擊左側「領取號碼牌」進行預約。
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {campus.rooms.map((item, index) => (
                    <div key={item.ticket} className="flex items-center gap-3 shrink-0">
                      <div
                        className={`p-3 rounded-lg border shadow-xs transition-all ${
                          index === 0
                            ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/50"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-xs mb-1">
                          <span className="font-mono font-bold text-amber-700">
                            {item.ticket}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {index === 0 ? "即將叫號" : `前面等 ${index} 人`}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-800 font-mono">
                          {item.student_id}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          佛光討論室預約
                        </div>
                      </div>

                      {index < campus.rooms.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 叫號歷史紀錄 */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs font-medium text-slate-700 mb-2">最近叫號通知紀錄：</div>
              {calledRecord.length === 0 ? (
                <div className="text-xs text-slate-400 italic">尚無叫號紀錄</div>
              ) : (
                <div className="space-y-1.5">
                  {calledRecord.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-slate-50 rounded border border-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700">{rec.ticket}</span>
                        <span className="text-slate-700 font-mono">學號 {rec.student_id}</span>
                        <span className="text-emerald-700">已前往入座</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">{rec.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 演算法複雜度手冊卡片 */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600">
            <div className="font-semibold text-slate-800 mb-1">演算法與複雜度解析：</div>
            <p>
              • <strong>佇列 (Queue)</strong> 遵循先進先出 (FIFO) 原則，先預約者排在最前端。<br />
              • Python 底層嚴格使用 <code className="font-mono text-slate-800">collections.deque</code> 實作，
              預約執行 <code className="font-mono text-slate-800">append()</code> 複雜度為 <strong className="font-mono text-amber-700">O(1)</strong>，
              叫號執行 <code className="font-mono text-slate-800">popleft()</code> 複雜度亦為 <strong className="font-mono text-amber-700">O(1)</strong>，
              遠優於 Python <code className="font-mono text-slate-800">list.pop(0)</code> 的 O(n) 開銷。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
