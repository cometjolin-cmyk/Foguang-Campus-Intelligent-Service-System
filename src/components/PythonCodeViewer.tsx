/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PYTHON_SOURCE_CODE } from "../data/promptEngineeringData";
import { STANDARD_TEST_CASES } from "../data/standardTests";
import { Code, Copy, Check, Download, Layers } from "lucide-react";

export const PythonCodeViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"source" | "output">("source");

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PYTHON_SOURCE_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPy = () => {
    const blob = new Blob([PYTHON_SOURCE_CODE], { type: "text/x-python;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "campus.py";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTestJson = () => {
    const jsonList = STANDARD_TEST_CASES.map((t) => t.input);
    const blob = new Blob([JSON.stringify(jsonList, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "test_input.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const COMPLEXITY_TABLE = [
    {
      cls: "BookBST",
      method: "insert(call_no, title)",
      time: "平均 O(log n) / 最差 O(n)",
      desc: "插入索書號，重複索書號回傳 False",
    },
    {
      cls: "BookBST",
      method: "search(call_no)",
      time: "平均 O(log n) / 最差 O(n)",
      desc: "走訪比對索書號，回傳 (節點, 比較次數 steps)",
    },
    {
      cls: "BookBST",
      method: "inorder(node)",
      time: "O(n)",
      desc: "中序走訪：左子樹 → 根 → 右子樹，由小到大自動排序",
    },
    {
      cls: "Schedule",
      method: "insert(node, position)",
      time: "頭部 O(1) / 尾部及指定位置 O(n)",
      desc: "單向鏈結串列插入，position 超出串列長度回傳 False",
    },
    {
      cls: "Schedule",
      method: "all_events()",
      time: "O(n)",
      desc: "從 head 依序走訪所有行程節點",
    },
    {
      cls: "Schedule",
      method: "by_day(day)",
      time: "O(n)",
      desc: "走訪並過濾出特定星期的行程",
    },
    {
      cls: "Campus",
      method: "_reserve(r)",
      time: "O(1)",
      desc: "collections.deque.append() 佇列尾端加入預約",
    },
    {
      cls: "Campus",
      method: "_call_next(r)",
      time: "O(1)",
      desc: "collections.deque.popleft() 佇列首端叫號",
    },
    {
      cls: "Campus",
      method: "_visit(r)",
      time: "O(1)",
      desc: "list.append() 堆疊入棧，更新當前頁面",
    },
    {
      cls: "Campus",
      method: "_back(r)",
      time: "O(1)",
      desc: "list.pop() 堆疊出棧，首頁時防禦拒絕",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 標題與簡介 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 tracking-wide uppercase">
            <span>Source Code & Invariants</span>
            <span aria-hidden="true">·</span>
            <span>campus.py 完整代碼</span>
            <span aria-hidden="true">·</span>
            <span>零外部相依 (標準庫)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Python 原始碼與時間複雜度對照表
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            符合硬性規則：Queue 用 collections.deque，BST 與 Linked List 手刻節點類別，Stack 用 list append/pop，附精確型別與時間複雜度。
          </p>
        </div>

        {/* 下載與複製控制列 */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadTestJson}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下載 test_input.json</span>
          </button>
          <button
            onClick={handleDownloadPy}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下載 campus.py</span>
          </button>
          <button
            onClick={handleCopyCode}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>已複製至剪貼簿</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>複製完整代碼</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 函式時間複雜度對照速查表 */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900">
              各類別成員方法時間複雜度 (Time Complexity Reference)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            嚴格遵守提示詞規範標註
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-2 px-4 w-32">類別 (Class)</th>
                <th className="py-2 px-4 font-mono">方法簽名 (Method)</th>
                <th className="py-2 px-4 font-mono text-amber-700">時間複雜度</th>
                <th className="py-2 px-4">設計目的與行為描述</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMPLEXITY_TABLE.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2 px-4 font-mono font-semibold text-slate-800">
                    {item.cls}
                  </td>
                  <td className="py-2 px-4 font-mono text-slate-700">
                    {item.method}
                  </td>
                  <td className="py-2 px-4 font-mono font-bold text-amber-700">
                    {item.time}
                  </td>
                  <td className="py-2 px-4 text-slate-600">
                    {item.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 原始碼與執行輸出檢視器 */}
      <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCodeTab("source")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                activeCodeTab === "source"
                  ? "bg-slate-800 text-amber-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              campus.py 原始碼 ({PYTHON_SOURCE_CODE.split("\n").length} 行)
            </button>
            <button
              onClick={() => setActiveCodeTab("output")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                activeCodeTab === "output"
                  ? "bg-slate-800 text-emerald-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              $ python3 campus.py 終端輸出 (30行 JSON)
            </button>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {activeCodeTab === "source" ? "Python 3.10+" : "標準輸出 stdout"}
          </span>
        </div>

        {activeCodeTab === "source" ? (
          <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[600px] overflow-y-auto">
            <code>{PYTHON_SOURCE_CODE}</code>
          </pre>
        ) : (
          <div className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-[600px] overflow-y-auto space-y-1">
            <div className="text-slate-500 pb-2 border-b border-slate-800 select-none">
              $ python3 campus.py (以 test_input.json 30 筆指令執行)
            </div>
            {STANDARD_TEST_CASES.map((tc, idx) => (
              <div key={idx} className="hover:bg-slate-900/60 py-0.5 px-1 rounded flex items-start gap-2">
                <span className="text-slate-600 select-none w-6 text-right shrink-0">{idx + 1}</span>
                <span className="break-all">{JSON.stringify(tc.expected)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
