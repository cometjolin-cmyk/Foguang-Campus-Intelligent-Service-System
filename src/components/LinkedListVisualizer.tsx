/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Campus, EventNode } from "../engine/campusCore";
import { LiveCodeTracer, TraceStep } from "./LiveCodeTracer";
import { Calendar, MapPin, ArrowRight, CheckCircle2, AlertCircle, Filter } from "lucide-react";

interface LinkedListVisualizerProps {
  campus: Campus;
  onActionTriggered: () => void;
  systemVersion?: number;
}

interface LinkedTraceStep extends TraceStep {
  curIndex: number | null; // which node index `cur` is currently pointing at
  matchedIndices?: number[]; // nodes matched during query_day
}

const LINKED_LIST_INSERT_CODE = [
  "def insert(self, node, position=None):",
  "    if self.head is None:              # 串列為空，設為首節點",
  "        self.head = node; return True",
  "    if position == 0:                  # 插入至頭部 O(1)",
  "        node.next, self.head = self.head, node; return True",
  "    cur = self.head                    # 從 head 開始走訪",
  "    if position is None:               # 加至串列尾端 O(n)",
  "        while cur.next: cur = cur.next",
  "        cur.next = node; return True",
  "    for i in range(position - 1):      # 走訪至前驅節點 (pos - 1)",
  "        cur = cur.next",
  "        if cur is None: return False   # 超出串列長度",
  "    node.next = cur.next               # 先接：新節點指向後繼節點",
  "    cur.next = node                    # 後斷：前驅節點指向新節點",
];

const LINKED_LIST_TRAVERSE_CODE = [
  "def traverse(self, target_day=None):   # 循序走訪 O(n)",
  "    cur, result = self.head, []        # 從 head 節點開始",
  "    while cur is not None:",
  "        if target_day is None or cur.day == target_day:",
  "            result.append(cur)         # 符合條件，收集節點",
  "        cur = cur.next                 # 指標推進至下一個節點",
  "    return result",
];

export const LinkedListVisualizer: React.FC<LinkedListVisualizerProps> = ({
  campus,
  onActionTriggered,
  systemVersion = 0,
}) => {
  const [selectedStudent, setSelectedStudent] = useState("S1001");
  const [day, setDay] = useState("週一");
  const [time, setTime] = useState("09:00");
  const [location, setLocation] = useState("雲起樓");
  const [event, setEvent] = useState("資料結構課");
  const [position, setPosition] = useState("");
  const [queryDay, setQueryDay] = useState("週三");
  const [queryResult, setQueryResult] = useState<{
    day: string;
    events: { time: string; location: string; event: string }[];
  } | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // 逐步指標動畫狀態
  const [traceMode, setTraceMode] = useState<"insert" | "traverse">("insert");
  const [traceSteps, setTraceSteps] = useState<LinkedTraceStep[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setQueryResult(null);
    setFeedback(null);
    setTraceSteps([]);
    setStepIdx(0);
    setIsPlaying(false);
  }, [systemVersion]);

  // 自動播放計時器
  useEffect(() => {
    if (!isPlaying || traceSteps.length === 0) return;
    if (stepIdx >= traceSteps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setStepIdx((prev) => prev + 1);
    }, 850);
    return () => clearTimeout(timer);
  }, [isPlaying, stepIdx, traceSteps]);

  const schedule = campus.calendars.get(selectedStudent);
  const currentEvents: EventNode[] = schedule ? schedule.allEvents() : [];
  const timelineStr =
    currentEvents.length > 0
      ? currentEvents.map((n) => n.text()).join(" → ")
      : null;

  const studentTabs = Array.from(
    new Set(["S1001", "S1002", "S9999", ...Array.from(campus.calendars.keys())])
  );

  // 產生插入動畫追蹤步驟
  const buildInsertSteps = (
    preCount: number,
    pos: number | undefined,
    insertedOk: boolean,
    label: string,
    errMsg?: string
  ): LinkedTraceStep[] => {
    const steps: LinkedTraceStep[] = [];
    if (!insertedOk) {
      if (errMsg === "invalid day or time") {
        return [
          {
            line: 1,
            curIndex: null,
            description: `驗證失敗：星期或時間格式不合法 (${errMsg})，拒絕建立節點`,
            variables: { error: errMsg },
          },
        ];
      }
      if (pos !== undefined && pos < 0) {
        return [
          {
            line: 12,
            curIndex: null,
            description: `位置檢查失敗：position=${pos} 不可為負數，回傳 position out of range`,
            variables: { position: pos, error: "position out of range" },
          },
        ];
      }
      // position out of range
      steps.push({
        line: 6,
        curIndex: preCount > 0 ? 0 : null,
        description: `設定指標 cur = head，準備往後走訪尋找位置 ${pos}`,
        variables: { position: pos ?? "None", cur: preCount > 0 ? "[0]" : "None" },
      });
      for (let i = 0; i < (pos ?? 0) - 1; i++) {
        if (i + 1 >= preCount) {
          steps.push({
            line: 12,
            curIndex: null,
            description: `指標 cur 移動至 None（位置 ${pos} 超出串列長度 ${preCount}），回傳 position out of range`,
            variables: { i, len: preCount, status: "out of range" },
          });
          break;
        }
        steps.push({
          line: 11,
          curIndex: i + 1,
          description: `指標步進：cur = cur.next，目前到達索引 [${i + 1}]`,
          variables: { i, cur: `[${i + 1}]` },
        });
      }
      return steps;
    }

    if (preCount === 0) {
      return [
        {
          line: 3,
          curIndex: 0,
          description: `串列原本為空 (head is None)，將新節點「${label}」設為 head 節點`,
          variables: { head: label, total: 1 },
        },
      ];
    }

    if (pos === 0) {
      return [
        {
          line: 5,
          curIndex: 0,
          description: `頭部插入 (pos=0)：新節點「${label}」的 next 指向原 head，並更新 head 指向新節點`,
          variables: { position: 0, new_head: label },
        },
      ];
    }

    if (pos === undefined) {
      steps.push({
        line: 6,
        curIndex: 0,
        description: `未指定 position：從 head 出發尋找串列尾端 (cur.next is None)`,
        variables: { cur: "[0]" },
      });
      for (let i = 1; i < preCount; i++) {
        steps.push({
          line: 8,
          curIndex: i,
          description: `cur.next 不為空，指標推進至節點 [${i}]`,
          variables: { cur: `[${i}]` },
        });
      }
      steps.push({
        line: 9,
        curIndex: preCount,
        description: `到達原尾端，執行 cur.next = node，將「${label}」接在索引 [${preCount}]`,
        variables: { inserted_at: `[${preCount}]`, total: preCount + 1 },
      });
      return steps;
    }

    // 中間指定位置插入 (e.g. position = 2)
    steps.push({
      line: 6,
      curIndex: 0,
      description: `指定位置 pos=${pos} 插入：指標 cur 從 head [0] 出發，需走到前驅節點 [${pos - 1}]`,
      variables: { target_pos: pos, cur: "[0]" },
    });
    for (let i = 0; i < pos - 1; i++) {
      steps.push({
        line: 11,
        curIndex: i + 1,
        description: `迴圈步進 (i=${i})：cur = cur.next，抵達前驅節點 [${i + 1}]`,
        variables: { i, cur: `[${i + 1}]` },
      });
    }
    steps.push({
      line: 13,
      curIndex: pos,
      description: `「先接」：執行 node.next = cur.next，讓新節點「${label}」先連住原本的後續節點`,
      variables: { step: "1/2 先接", new_node: label },
    });
    steps.push({
      line: 14,
      curIndex: pos,
      description: `「後斷」：執行 cur.next = node，將前驅節點 [${pos - 1}] 改指向新節點，完成 O(1) 指標重接！`,
      variables: { step: "2/2 後斷", inserted_at: `[${pos}]`, total: preCount + 1 },
    });
    return steps;
  };

  // 1. 新增行程
  const handleAddEvent = (customParams?: {
    day: string;
    time: string;
    location: string;
    event: string;
    position?: number;
  }) => {
    const d = customParams ? customParams.day : day;
    const t = customParams ? customParams.time : time;
    const loc = customParams ? customParams.location : location;
    const ev = customParams ? customParams.event : event;
    const pos = customParams
      ? customParams.position
      : position.trim() !== ""
      ? parseInt(position, 10)
      : undefined;

    const preCount = currentEvents.length;
    const req: any = {
      cmd: "add_event",
      student_id: selectedStudent,
      day: d,
      time: t,
      location: loc,
      event: ev,
    };
    if (pos !== undefined) {
      req.position = pos;
    }

    const res = campus.handle(req);
    const steps = buildInsertSteps(
      preCount,
      pos,
      res.status === "ok",
      `${d} ${t} ${ev}`,
      res.message
    );
    setTraceMode("insert");
    setTraceSteps(steps);
    setStepIdx(0);
    setIsPlaying(steps.length > 1);

    if (res.status === "ok") {
      setFeedback({
        type: "success",
        msg: `成功新增節點！${d} ${t} ${loc}（${ev}）${
          pos !== undefined ? ` 插入於位置 [${pos}]` : " 加入串列尾端"
        }，目前該生行程共 ${res.total} 筆`,
      });
    } else {
      setFeedback({
        type: "error",
        msg: `新增失敗：${res.message}`,
      });
    }
    onActionTriggered();
  };

  // 2. 顯示完整時間軸
  const handleShowSchedule = (sid: string = selectedStudent) => {
    const res = campus.handle({ cmd: "show_schedule", student_id: sid });
    if (res.status === "ok") {
      const steps: LinkedTraceStep[] = currentEvents.map((n, idx) => ({
        line: 5,
        curIndex: idx,
        description: `走訪串列節點 [${idx}]：收集「${n.text()}」並沿 cur.next 前進`,
        variables: { cur: `[${idx}]`, visited: `${idx + 1}/${currentEvents.length}` },
      }));
      setTraceMode("traverse");
      setTraceSteps(steps);
      setStepIdx(0);
      setIsPlaying(steps.length > 1);
      setFeedback({
        type: "success",
        msg: `成功走訪鏈結串列生成完整時間軸`,
      });
    } else {
      setFeedback({
        type: "error",
        msg: `查詢失敗：${res.message} (該學號尚未建立任何行程)`,
      });
    }
    onActionTriggered();
  };

  // 3. 查詢指定日行程
  const handleQueryDay = (targetDay: string = queryDay) => {
    const res = campus.handle({
      cmd: "query_day",
      student_id: selectedStudent,
      day: targetDay,
    });
    if (res.status === "ok") {
      setQueryResult({
        day: res.day!,
        events: res.events || [],
      });
      // 生成走訪篩選動畫步驟
      const matched: number[] = [];
      const steps: LinkedTraceStep[] = currentEvents.map((n, idx) => {
        const isHit = n.day === targetDay;
        if (isHit) matched.push(idx);
        return {
          line: isHit ? 5 : 6,
          curIndex: idx,
          matchedIndices: [...matched],
          description: isHit
            ? `走訪節點 [${idx}] (${n.day})：符合【${targetDay}】，加入結果陣列！`
            : `走訪節點 [${idx}] (${n.day})：不符合【${targetDay}】，沿 cur.next 跳過`,
          variables: { cur: `[${idx}]`, target: targetDay, matched: matched.length },
        };
      });
      if (steps.length > 0) {
        setTraceMode("traverse");
        setTraceSteps(steps);
        setStepIdx(0);
        setIsPlaying(steps.length > 1);
      }

      setFeedback({
        type: "success",
        msg: `走訪並過濾【${targetDay}】行程，共找到 ${res.events?.length || 0} 筆`,
      });
    } else {
      setQueryResult(null);
      setFeedback({
        type: "error",
        msg: `查詢失敗：${res.message}`,
      });
    }
    onActionTriggered();
  };

  const activeStep = traceSteps[stepIdx];
  const activeCurIndex = activeStep ? activeStep.curIndex : null;

  return (
    <div className="space-y-6">
      {/* 模組標題與規格導讀 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 tracking-wide uppercase">
            <span>Data Structure 3</span>
            <span aria-hidden="true">·</span>
            <span>單向鏈結串列 (Singly Linked List)</span>
            <span aria-hidden="true">·</span>
            <span>動態節點插入與指標串接</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            校園個人化行事曆與動態行程查詢 (Linked List)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            每一筆行程是一個分散節點 (EventNode)，透過 <code className="font-mono text-slate-800">next</code> 指標串聯。觀察指標 <code className="font-mono text-slate-800">cur</code> 如何從 <code className="font-mono text-slate-800">head</code> 逐節點走訪並「先接後斷」重接指標。
          </p>
        </div>

        {/* 學生學號切換 */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <span className="text-xs text-slate-600 font-medium">當前檢視學生：</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
            {studentTabs.map((sid) => (
              <button
                key={sid}
                onClick={() => {
                  setSelectedStudent(sid);
                  setQueryResult(null);
                  setFeedback(null);
                  setTraceSteps([]);
                  setIsPlaying(false);
                }}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors ${
                  selectedStudent === sid
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {sid}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 互動區 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左側：控制操作區 */}
        <div className="lg:col-span-5 space-y-4">
          {/* 新增行程表單 Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-700" />
              <span>新增行程節點 (add_event)</span>
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    星期 (day)
                  </label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    {Campus.DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    時間 (time: HH:MM)
                  </label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="09:00"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    地點 (location)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="雲起樓"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    事件名稱 (event)
                  </label>
                  <input
                    type="text"
                    value={event}
                    onChange={(e) => setEvent(e.target.value)}
                    placeholder="資料結構課"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  插入位置 position (選填，0 起算；留空加至尾端)
                </label>
                <input
                  type="number"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddEvent()}
                  placeholder="留空 = 尾端 (None)"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <button
                onClick={() => handleAddEvent()}
                className="w-full py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded transition-colors"
              >
                串接新行程節點（並演示指標走訪）
              </button>

              {/* 規格範例快速批次演練 */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 block mb-1">點擊觀察插入與邊界動畫：</span>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() =>
                      handleAddEvent({
                        day: "週一",
                        time: "08:00",
                        location: "香雲居",
                        event: "早自習",
                        position: 0,
                      })
                    }
                    className="px-2 py-1 text-[11px] bg-sky-50 hover:bg-sky-100 text-sky-800 rounded font-mono font-semibold"
                  >
                    [pos=0 頭部插入] 早自習
                  </button>
                  <button
                    onClick={() =>
                      handleAddEvent({
                        day: "週二",
                        time: "18:00",
                        location: "雲起樓",
                        event: "社團開會",
                        position: 2,
                      })
                    }
                    title="在位置 2 中間插入"
                    className="px-2 py-1 text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-mono font-bold"
                  >
                    [pos=2 中間插入] 開會
                  </button>
                  <button
                    onClick={() =>
                      handleAddEvent({
                        day: "週四",
                        time: "16:00",
                        location: "圖書館",
                        event: "還書",
                      })
                    }
                    className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                  >
                    [尾端加入] 還書
                  </button>
                  <button
                    onClick={() =>
                      handleAddEvent({
                        day: "週三",
                        time: "25:00",
                        location: "雲起樓",
                        event: "錯誤時間",
                      })
                    }
                    title="測試 25:00 格式錯誤"
                    className="px-2 py-1 text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-mono"
                  >
                    [測試 25:00 錯誤]
                  </button>
                  <button
                    onClick={() =>
                      handleAddEvent({
                        day: "週五",
                        time: "08:00",
                        location: "操場",
                        event: "晨跑",
                        position: 99,
                      })
                    }
                    title="測試 position=99 超出串列"
                    className="px-2 py-1 text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-mono"
                  >
                    [測試 pos=99 越界]
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 查詢某天行程 Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-700" />
              <span>依星期循序走訪過濾 (query_day · O(n))</span>
            </h3>

            <div className="flex gap-2">
              <select
                value={queryDay}
                onChange={(e) => setQueryDay(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden"
              >
                {Campus.DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleQueryDay()}
                className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
              >
                逐節點搜尋
              </button>
            </div>

            {queryResult && (
              <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                <div className="font-semibold text-slate-800 mb-1">
                  【{queryResult.day}】篩選結果：共 {queryResult.events.length} 筆
                </div>
                {queryResult.events.length === 0 ? (
                  <div className="text-slate-400 italic">當天沒有任何行程 (events: [])</div>
                ) : (
                  <div className="space-y-1 mt-1">
                    {queryResult.events.map((ev, i) => (
                      <div
                        key={i}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 flex items-center justify-between"
                      >
                        <span className="font-mono font-bold text-sky-800">{ev.time}</span>
                        <span>{ev.location}</span>
                        <span className="text-slate-900 font-medium">《{ev.event}》</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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

        {/* 右側：鏈結串列視覺化動態鏈 + 步驟追蹤器 */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                學號 {selectedStudent} 單向鏈結串列節點鏈 (Linked List Chain)
              </h3>
              <div className="text-xs text-slate-500 font-mono">
                節點總數: {currentEvents.length}
              </div>
            </div>

            {/* 節點橫向鏈結管 */}
            <div className="min-h-[195px] bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4 flex items-center overflow-x-auto gap-2">
              {currentEvents.length === 0 ? (
                <div className="w-full text-center py-8 text-xs text-slate-400">
                  學號 {selectedStudent} 尚未建立行事曆（head = None）。請從左側新增節點觀察串接過程。
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Head 指標起點 */}
                  <div className="text-[11px] font-mono font-bold text-sky-700 bg-sky-100 px-2 py-1 rounded shrink-0 mt-5">
                    head
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-5" />

                  <AnimatePresence mode="popLayout">
                    {currentEvents.map((node, index) => {
                      const isCur = activeCurIndex === index;
                      const isMatchedQuery =
                        (queryResult && queryResult.day === node.day) ||
                        (activeStep?.matchedIndices?.includes(index) ?? false);
                      return (
                        <motion.div
                          key={`${node.day}-${node.time}-${node.event}-${index}`}
                          layout
                          initial={{ opacity: 0, y: -16, scale: 0.92 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.25 }}
                          className="flex items-center gap-2 shrink-0"
                        >
                          <div className="flex flex-col items-center gap-1">
                            {/* 動態游標 cur */}
                            <div className="h-5 flex items-center justify-center">
                              {isCur && (
                                <motion.span
                                  layoutId="linkedlist-cur-pointer"
                                  className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono font-bold text-[10px] shadow-xs"
                                >
                                  ↓ cur
                                </motion.span>
                              )}
                            </div>

                            {/* 節點本體：資料區 + next 指標區 */}
                            <div
                              className={`rounded-lg border shadow-xs shrink-0 transition-all min-w-[158px] overflow-hidden ${
                                isCur
                                  ? "bg-amber-50 border-amber-400 ring-2 ring-amber-300"
                                  : isMatchedQuery
                                  ? "bg-sky-50 border-sky-400 ring-2 ring-sky-200"
                                  : "bg-white border-slate-200"
                              }`}
                            >
                              <div className="p-2.5">
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                  <span className="font-mono font-bold text-slate-500">
                                    [pos: {index}]
                                  </span>
                                  <span className="font-semibold text-sky-800">{node.day}</span>
                                </div>
                                <div className="text-xs font-bold text-slate-900 font-mono">
                                  {node.time}
                                </div>
                                <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{node.location}</span>
                                </div>
                                <div className="text-xs font-medium text-slate-800 mt-1 truncate">
                                  {node.event}
                                </div>
                              </div>
                              <div className="px-2.5 py-1 bg-slate-100/80 border-t border-slate-200 text-[10px] text-slate-600 font-mono flex justify-between">
                                <span>next:</span>
                                <span className="font-semibold text-sky-700">
                                  {node.next ? `→ [${index + 1}]` : "None"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 指標箭頭 */}
                          <div className="flex flex-col items-center shrink-0 mt-5">
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* 結尾 None */}
                  <div className="text-[11px] font-mono text-slate-500 bg-slate-200 px-2 py-1 rounded shrink-0 mt-5">
                    None (End)
                  </div>
                </div>
              )}
            </div>

            {/* 完整時間軸文字輸出 */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-700">
                  完整時間軸輸出 (show_schedule)：
                </span>
                <button
                  onClick={() => handleShowSchedule()}
                  className="text-xs text-sky-700 hover:text-sky-900 underline"
                >
                  逐節點動畫走訪時間軸
                </button>
              </div>

              {timelineStr ? (
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed break-all">
                  {timelineStr}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">無紀錄 (no record)</div>
              )}
            </div>
          </div>

          {/* 動態步驟播放與程式碼追蹤器 */}
          {traceSteps.length > 0 ? (
            <LiveCodeTracer
              title={
                traceMode === "insert"
                  ? "Linked List 指標走訪與插入動畫追蹤"
                  : "Linked List 循序走訪與篩選動畫追蹤"
              }
              codeLines={
                traceMode === "insert"
                  ? LINKED_LIST_INSERT_CODE
                  : LINKED_LIST_TRAVERSE_CODE
              }
              steps={traceSteps}
              currentStepIdx={stepIdx}
              isPlaying={isPlaying}
              onPlayPause={() => {
                if (stepIdx >= traceSteps.length - 1) setStepIdx(0);
                setIsPlaying(!isPlaying);
              }}
              onStepForward={() => {
                setIsPlaying(false);
                setStepIdx((p) => Math.min(traceSteps.length - 1, p + 1));
              }}
              onStepBack={() => {
                setIsPlaying(false);
                setStepIdx((p) => Math.max(0, p - 1));
              }}
              onResetTrace={() => {
                setIsPlaying(false);
                setStepIdx(0);
              }}
            />
          ) : (
            <LiveCodeTracer
              title="Linked List 指標插入核心原理 (先接後斷)"
              codeLines={LINKED_LIST_INSERT_CODE}
              activeLine={13}
              stepDescription="提示：點擊左側任一「新增行程」或「逐節點搜尋」，即可在此觀看 cur 指標逐格跳躍的動畫與程式碼追蹤！"
            />
          )}
        </div>
      </div>
    </div>
  );
};
