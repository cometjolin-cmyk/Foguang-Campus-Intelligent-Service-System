/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Campus, EventNode } from "../engine/campusCore";
import { Calendar, Plus, Clock, MapPin, ArrowRight, CheckCircle2, AlertCircle, Filter } from "lucide-react";

interface LinkedListVisualizerProps {
  campus: Campus;
  onActionTriggered: () => void;
}

export const LinkedListVisualizer: React.FC<LinkedListVisualizerProps> = ({
  campus,
  onActionTriggered,
}) => {
  const [selectedStudent, setSelectedStudent] = useState("S1001");
  const [day, setDay] = useState("週一");
  const [time, setTime] = useState("09:00");
  const [location, setLocation] = useState("雲起樓");
  const [event, setEvent] = useState("資料結構課");
  const [position, setPosition] = useState("");
  const [queryDay, setQueryDay] = useState("週三");
  const [timelineStr, setTimelineStr] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<{
    day: string;
    events: { time: string; location: string; event: string }[];
  } | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const schedule = campus.calendars.get(selectedStudent);
  const currentEvents: EventNode[] = schedule ? schedule.allEvents() : [];

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
    if (res.status === "ok") {
      setFeedback({
        type: "success",
        msg: `成功新增節點！${d} ${t} ${loc}（${ev}）${
          pos !== undefined ? ` 插入於位置 [${pos}]` : " 加入串列尾端"
        }，目前該生行程共 ${res.total} 筆`,
      });
      // 自動更新時間軸快照
      const showRes = campus.handle({ cmd: "show_schedule", student_id: selectedStudent });
      if (showRes.status === "ok") {
        setTimelineStr(showRes.timeline || null);
      }
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
      setTimelineStr(res.timeline || "");
      setFeedback({
        type: "success",
        msg: `成功走訪鏈結串列生成完整時間軸`,
      });
    } else {
      setTimelineStr(null);
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
            每一筆行程是一個節點 (EventNode)，以 next 指標串接成整串時間軸；支援插入尾端或指定索引位置。
          </p>
        </div>

        {/* 學生學號切換 */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-600 font-medium">當前檢視學生：</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
            {["S1001", "S1002", "S9999"].map((sid) => (
              <button
                key={sid}
                onClick={() => {
                  setSelectedStudent(sid);
                  const showRes = campus.handle({ cmd: "show_schedule", student_id: sid });
                  setTimelineStr(showRes.status === "ok" ? showRes.timeline || null : null);
                  setQueryResult(null);
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
                  placeholder="留空 = 尾端 (None)"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <button
                onClick={() => handleAddEvent()}
                className="w-full py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded transition-colors"
              >
                串接新行程節點
              </button>

              {/* 規格範例快速批次演練 */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 block mb-1">快速演練題目 5 大經典步驟：</span>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() =>
                      handleAddEvent({
                        day: "週一",
                        time: "09:00",
                        location: "雲起樓",
                        event: "資料結構課",
                      })
                    }
                    className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                  >
                    1. 週一 09:00 課
                  </button>
                  <button
                    onClick={() =>
                      handleAddEvent({
                        day: "週二",
                        time: "14:00",
                        location: "圖書館",
                        event: "借書",
                      })
                    }
                    className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                  >
                    2. 週二 14:00 借書
                  </button>
                  <button
                    onClick={() =>
                      handleAddEvent({
                        day: "週三",
                        time: "10:00",
                        location: "討論室",
                        event: "小組討論",
                      })
                    }
                    className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                  >
                    3. 週三 10:00 討論
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
                    4. [pos=2 中間插入] 開會
                  </button>
                  <button
                    onClick={() =>
                      handleAddEvent({
                        day: "週三",
                        time: "15:30",
                        location: "雲起樓",
                        event: "期中考",
                      })
                    }
                    className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                  >
                    5. 週三 15:30 期中考
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
                        position: 9,
                      })
                    }
                    title="測試 position=9 超出串列"
                    className="px-2 py-1 text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-mono"
                  >
                    [測試 pos=9 越界]
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 查詢某天行程 Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-700" />
              <span>依星期查詢行程 (query_day)</span>
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
                查詢當日
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
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{feedback.msg}</span>
              </div>
            </div>
          )}
        </div>

        {/* 右側：鏈結串列視覺化動態鏈 */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                學號 {selectedStudent} 個人行程鏈結串列 (Linked List Chain)
              </h3>
              <div className="text-xs text-slate-500 font-mono">
                節點總數: {currentEvents.length}
              </div>
            </div>

            {/* 節點橫向鏈結管 */}
            <div className="min-h-[160px] bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4 flex items-center overflow-x-auto gap-3">
              {currentEvents.length === 0 ? (
                <div className="w-full text-center py-8 text-xs text-slate-400">
                  學號 {selectedStudent} 尚未建立行事曆（Head 為空）。可由左側按鈕「快速演練」載入資料。
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Head 指標起點 */}
                  <div className="text-[11px] font-mono font-bold text-sky-700 bg-sky-100 px-2 py-1 rounded shrink-0">
                    head
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-sky-600 shrink-0" />

                  {currentEvents.map((node, index) => {
                    const isMatchedQuery =
                      queryResult && queryResult.day === node.day;
                    return (
                      <React.Fragment key={index}>
                        <div
                          className={`p-3 rounded-lg border shadow-xs shrink-0 transition-all min-w-[150px] ${
                            isMatchedQuery
                              ? "bg-sky-50 border-sky-400 ring-2 ring-sky-300"
                              : "bg-white border-slate-200"
                          }`}
                        >
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
                          <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400 font-mono flex justify-between">
                            <span>next →</span>
                            <span>{node.next ? "EventNode" : "None"}</span>
                          </div>
                        </div>

                        {/* 指標箭頭 */}
                        <div className="flex flex-col items-center shrink-0">
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </React.Fragment>
                    );
                  })}

                  {/* 結尾 None */}
                  <div className="text-[11px] font-mono text-slate-400 bg-slate-200 px-2 py-1 rounded shrink-0">
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
                  重新整理時間軸
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

          {/* 演算法複雜度手冊卡片 */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600">
            <div className="font-semibold text-slate-800 mb-1">演算法與複雜度解析：</div>
            <p>
              • <strong>單向鏈結串列 (Singly Linked List)</strong> 由分散節點組成，每個節點包含資料欄位與 <code className="font-mono text-slate-800">next</code> 指標。<br />
              • <strong>插入尾端與走訪：</strong>時間複雜度為 <strong className="font-mono text-sky-700">O(n)</strong>，因需從 head 逐一走訪至最後節點。<br />
              • <strong>任意位置插入：</strong>若插入於位置 0 (Head) 僅需 <strong className="font-mono text-sky-700">O(1)</strong>；若插入於索引 position 需走訪 position - 1 步，複雜度為 <strong className="font-mono text-sky-700">O(position) ≤ O(n)</strong>。<br />
              • 鏈結串列能隨時按需配置記憶體，插入中間只需重置 pointer，無需像陣列搬移後續所有元素。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
