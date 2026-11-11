/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Campus, JsonResponse } from "../engine/campusCore";
import { Terminal, Send, Trash2, Copy, Check, Sparkles } from "lucide-react";

interface JsonConsoleProps {
  campus: Campus;
  onStateUpdate: () => void;
}

interface LogEntry {
  id: string;
  timestamp: string;
  input: string;
  output: JsonResponse;
}

const TEMPLATES: { label: string; json: string }[] = [
  { label: "reserve (預約討論室)", json: '{"cmd":"reserve","student_id":"S1001"}' },
  { label: "call_next (依序叫號)", json: '{"cmd":"call_next"}' },
  { label: "add_book (新增館藏)", json: '{"cmd":"add_book","call_no":305,"title":"資料結構"}' },
  { label: "search_book (查索書號)", json: '{"cmd":"search_book","call_no":210}' },
  { label: "list_books (中序走訪)", json: '{"cmd":"list_books"}' },
  {
    label: "add_event (新增行程)",
    json: '{"cmd":"add_event","student_id":"S1001","day":"週一","time":"09:00","location":"雲起樓","event":"資料結構課"}',
  },
  {
    label: "add_event (指定位置)",
    json: '{"cmd":"add_event","student_id":"S1001","day":"週二","time":"18:00","location":"雲起樓","event":"社團開會","position":2}',
  },
  { label: "show_schedule (完整時間軸)", json: '{"cmd":"show_schedule","student_id":"S1001"}' },
  { label: "query_day (查詢某日)", json: '{"cmd":"query_day","student_id":"S1001","day":"週三"}' },
  { label: "visit (進入頁面)", json: '{"cmd":"visit","page":"圖書館專區"}' },
  { label: "back (返回上一頁)", json: '{"cmd":"back"}' },
  { label: "無效指令 foo (測試防護)", json: '{"cmd":"foo"}' },
];

export const JsonConsole: React.FC<JsonConsoleProps> = ({
  campus,
  onStateUpdate,
}) => {
  const [inputJson, setInputJson] = useState('{"cmd":"reserve","student_id":"S1001"}');
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "init-1",
      timestamp: "00:00:00",
      input: '{"cmd":"reserve","student_id":"S1001"}',
      output: { status: "ok", ticket: "Q-001", ahead: 0 },
    },
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSend = () => {
    let parsed: any;
    try {
      parsed = JSON.parse(inputJson);
    } catch (e: any) {
      const errOut: JsonResponse = {
        status: "error",
        message: "invalid json format: " + e.message,
      };
      setLogs((prev) => [
        {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString("zh-TW", { hour12: false }),
          input: inputJson,
          output: errOut,
        },
        ...prev,
      ]);
      return;
    }

    const res = campus.handle(parsed);
    setLogs((prev) => [
      {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString("zh-TW", { hour12: false }),
        input: JSON.stringify(parsed),
        output: res,
      },
      ...prev,
    ]);
    onStateUpdate();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* 標題與簡介 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 tracking-wide uppercase">
            <span>JSON Protocol Engine</span>
            <span aria-hidden="true">·</span>
            <span>Campus.handle(req)</span>
            <span aria-hidden="true">·</span>
            <span>零崩潰防護</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            JSON 請求與回應即時終端機 (Interactive Console)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            直接向後端引擎發送自訂 JSON 指令，嚴格檢驗狀態碼 status、欄位型別與錯誤處理規範。
          </p>
        </div>

        <button
          onClick={() => setLogs([])}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1.5 self-start md:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>清除終端日誌</span>
        </button>
      </div>

      {/* 輸入區與樣板快捷按鈕 */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        {/* 快速載入指令樣板 */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>規格標準 JSON 指令樣板快速載入：</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.label}
                onClick={() => setInputJson(tmpl.json)}
                className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 border border-transparent rounded transition-colors font-mono"
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* 編輯器與送出按鈕 */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-700">
            請輸入 JSON 請求物件 (Request Payload)：
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <textarea
              rows={2}
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              className="flex-1 px-3 py-2 text-xs font-mono bg-slate-900 text-emerald-400 rounded-lg border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none leading-relaxed"
            />
            <button
              onClick={handleSend}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center justify-center gap-2 shrink-0 self-stretch sm:self-auto shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>發送指令</span>
            </button>
          </div>
        </div>
      </div>

      {/* 終端機執行日誌列表 */}
      <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 font-mono text-xs text-slate-300 space-y-3 min-h-[300px]">
        <div className="flex items-center justify-between text-[11px] text-slate-500 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Campus Interactive Engine Terminal Stream</span>
          </div>
          <span>Total Logs: {logs.length}</span>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-600 text-xs">
            終端機日誌為空。請由上方輸入或選擇樣板發送 JSON 指令。
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const isError = log.output.status === "error";
              return (
                <div
                  key={log.id}
                  className="p-3 bg-slate-900/80 rounded border border-slate-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="text-slate-400">[{log.timestamp}]</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `REQ: ${log.input}\nRES: ${JSON.stringify(log.output)}`,
                          log.id
                        )
                      }
                      className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-[10px]"
                    >
                      {copiedId === log.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">已複製</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>複製</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-slate-300">
                    <span className="text-amber-400 select-none">REQUEST &gt; </span>
                    <span className="text-slate-200">{log.input}</span>
                  </div>

                  <div className="text-slate-300">
                    <span className="text-sky-400 select-none">RESPONSE &lt; </span>
                    <span
                      className={
                        isError
                          ? "text-rose-400 font-semibold"
                          : "text-emerald-400"
                      }
                    >
                      {JSON.stringify(log.output)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
