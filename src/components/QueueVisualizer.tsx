/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Campus, JsonResponse } from "../engine/campusCore";
import { LiveCodeTracer } from "./LiveCodeTracer";
import { Users, Ticket, Bell, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

interface QueueVisualizerProps {
  campus: Campus;
  onActionTriggered: () => void;
  systemVersion?: number;
  lastResponse?: JsonResponse | null;
}

const QUEUE_CODE_LINES = [
  "def _reserve(self, r):          # 入隊 Enqueue: O(1)",
  "    self.ticket_no += 1",
  "    ticket = f'Q-{self.ticket_no:03d}'",
  "    self.rooms.append((ticket, r['student_id']))  # 從隊尾 REAR 加入",
  "    return {'status': 'ok', 'ticket': ticket, 'ahead': len(self.rooms) - 1}",
  "",
  "def _call_next(self, r):        # 出隊 Dequeue: O(1)",
  "    if not self.rooms:          # 空佇列防禦",
  "        return {'status': 'error', 'message': 'no one waiting'}",
  "    ticket, sid = self.rooms.popleft()  # 從隊首 FRONT 取出",
  "    return {'status': 'ok', 'ticket': ticket, 'student_id': sid}",
];

export const QueueVisualizer: React.FC<QueueVisualizerProps> = ({
  campus,
  onActionTriggered,
  systemVersion = 0,
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
  const [traceState, setTraceState] = useState<{
    line: number;
    desc: string;
    vars: Record<string, string | number>;
  }>({
    line: 4,
    desc: "佇列就緒：新預約由隊尾 (Rear) 加入，叫號由隊首 (Front) 移出",
    vars: { len: campus.rooms.length, front: campus.rooms[0]?.ticket || "None" },
  });

  useEffect(() => {
    setLocalFeedback(null);
    setCalledRecord([]);
    setTraceState({
      line: 4,
      desc: "佇列已更新：新預約由隊尾 (Rear) 加入，叫號由隊首 (Front) 移出",
      vars: { len: campus.rooms.length, front: campus.rooms[0]?.ticket || "None" },
    });
  }, [systemVersion]);

  const handleReserve = () => {
    const trimmed = studentId.trim();
    if (!trimmed) {
      setLocalFeedback({
        type: "error",
        msg: "預約失敗",
        detail: "請先輸入學生學號（例如 S1001）",
      });
      return;
    }
    const res = campus.handle({ cmd: "reserve", student_id: trimmed });
    if (res.status === "ok") {
      setLocalFeedback({
        type: "success",
        msg: `預約成功！號碼牌 ${res.ticket}`,
        detail: `學號 ${trimmed} 前方還有 ${res.ahead} 人等候`,
      });
      setTraceState({
        line: 4,
        desc: `執行 deque.append()：將 (${res.ticket}, ${trimmed}) 推入隊尾 Rear`,
        vars: {
          ticket: res.ticket!,
          ahead: res.ahead!,
          front: campus.rooms[0]?.ticket || "None",
          rear: res.ticket!,
        },
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
      setTraceState({
        line: 10,
        desc: `執行 deque.popleft()：從隊首 Front 彈出最先預約的 ${res.ticket} (${res.student_id})，其餘元素無需搬移`,
        vars: {
          popped: res.ticket!,
          next_front: campus.rooms[0]?.ticket || "Empty",
          remaining: campus.rooms.length,
        },
      });
    } else {
      setLocalFeedback({
        type: "error",
        msg: `叫號失敗：${res.message}`,
        detail: "佇列已無等候者 (no one waiting)",
      });
      setTraceState({
        line: 9,
        desc: "偵測到佇列為空 (not self.rooms)，觸發保護回傳 no one waiting",
        vars: { len: 0, status: "empty" },
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
            以雙端佇列管理預約先後順序，新元素由隊尾 (Rear) 加入，叫號時從隊首 (Front) 移出。
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
              <span>學生預約取號 — 入隊 Enqueue (reserve)</span>
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
                    onKeyDown={(e) => e.key === "Enter" && handleReserve()}
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
                <span>管理員叫號 — 出隊 Dequeue (call_next)</span>
              </h3>
              <span className="text-xs text-slate-500">FIFO 隊首出列</span>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              從 <strong className="text-blue-700">Front 指標</strong> 取出最先排隊者（佇列為空時回傳 <code className="text-rose-600 font-mono">no one waiting</code>）。
            </p>

            <button
              onClick={handleCallNext}
              className="w-full py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center justify-center gap-2"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>呼叫下一位同學 (popleft)</span>
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

          {/* 即時執行碼追蹤器 */}
          <LiveCodeTracer
            title="Python collections.deque 即時執行追蹤"
            codeLines={QUEUE_CODE_LINES}
            activeLine={traceState.line}
            stepDescription={traceState.desc}
            variables={traceState.vars}
          />
        </div>

        {/* 右側：佇列視覺化走道與原理剖析 */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-900">
                  排隊等候動態視覺道 (FIFO Pipeline)
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-blue-700 font-semibold">← popleft() 出口</span>
                <span className="text-slate-300">|</span>
                <span className="text-amber-700 font-semibold">append() 入口 ←</span>
              </div>
            </div>

            {/* 佇列視覺化橫向輸送管 */}
            <div className="min-h-[175px] bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4 flex items-center overflow-x-auto gap-3">
              {campus.rooms.length === 0 ? (
                <div className="w-full text-center py-6 text-xs text-slate-400">
                  目前討論室無人等候（FRONT = REAR = None）。請點擊左側「領取號碼牌」觀察元素如何進入隊尾。
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <AnimatePresence mode="popLayout">
                    {campus.rooms.map((item, index) => {
                      const isFront = index === 0;
                      const isRear = index === campus.rooms.length - 1;
                      return (
                        <motion.div
                          key={item.ticket}
                          layout
                          initial={{ opacity: 0, x: 40, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -40, scale: 0.9 }}
                          transition={{ duration: 0.25 }}
                          className="flex items-center gap-3 shrink-0"
                        >
                          <div className="flex flex-col items-center gap-1">
                            {/* 指標標籤 */}
                            <div className="h-4 flex items-center gap-1 text-[10px] font-mono font-bold">
                              {isFront && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white">
                                  FRONT
                                </span>
                              )}
                              {isRear && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                                  REAR
                                </span>
                              )}
                            </div>

                            <div
                              className={`p-3 rounded-lg border shadow-xs transition-all min-w-[125px] ${
                                isFront
                                  ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/50"
                                  : "bg-white border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 text-xs mb-1">
                                <span className="font-mono font-bold text-amber-700">
                                  {item.ticket}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {isFront ? "即將叫號" : `前面等 ${index} 人`}
                                </span>
                              </div>
                              <div className="text-xs font-semibold text-slate-800 font-mono">
                                {item.student_id}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1">
                                索引 [{index}]
                              </div>
                            </div>
                          </div>

                          {index < campus.rooms.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-4" />
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* 叫號歷史紀錄 */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs font-medium text-slate-700 mb-2">最近叫號通知紀錄（已出隊元素）：</div>
              {calledRecord.length === 0 ? (
                <div className="text-xs text-slate-400 italic">尚無叫號紀錄，可點擊「呼叫下一位同學」觀察 FIFO 出隊動畫</div>
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
                        <span className="text-emerald-700">已從 FRONT 出隊</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">{rec.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 原理對照卡片：為什麼用 deque 而不是普通陣列 list？ */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-slate-800">知識原理剖析：為什麼要用雙端佇列 (deque) 而非一般陣列？</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-2.5 bg-white rounded border border-slate-200">
                <div className="font-semibold text-rose-700 mb-1">一般陣列 list.pop(0) → O(n)</div>
                <p className="text-[11px] leading-relaxed">
                  移除第 0 個元素後，後方第 1～n-1 個元素必須全部向左搬移一格，若排隊一萬人就需搬移一萬次。
                </p>
              </div>
              <div className="p-2.5 bg-white rounded border border-emerald-200">
                <div className="font-semibold text-emerald-700 mb-1">collections.deque.popleft() → O(1)</div>
                <p className="text-[11px] leading-relaxed">
                  底層採雙向分塊鏈結結構，只需將 <code className="font-mono">FRONT</code> 指標往後移動一格並釋放首節點，時間永遠是常數級！
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
