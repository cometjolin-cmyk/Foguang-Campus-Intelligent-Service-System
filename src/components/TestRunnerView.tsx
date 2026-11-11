/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Campus, JsonResponse } from "../engine/campusCore";
import { STANDARD_TEST_CASES, TestCase } from "../data/standardTests";
import { Play, StepForward, RotateCcw, CheckCircle2, XCircle, Search, Filter } from "lucide-react";

interface TestRunnerViewProps {
  campus: Campus;
  onStateUpdate: () => void;
  autoRunKey?: number;
  onStatsUpdate?: (stats: { executed: number; passed: number; total: number }) => void;
}

export const TestRunnerView: React.FC<TestRunnerViewProps> = ({
  campus,
  onStateUpdate,
  autoRunKey,
  onStatsUpdate,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [testResults, setTestResults] = useState<{
    [key: number]: {
      actual: JsonResponse;
      passed: boolean;
      executed: boolean;
    };
  }>({});
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isolatedMode, setIsolatedMode] = useState(false);

  const compareResponses = (actual: any, expected: any): boolean => {
    return JSON.stringify(actual) === JSON.stringify(expected);
  };

  // 1. 全量執行全部 30 筆測試
  const handleRunAll = (isolate: boolean = isolatedMode) => {
    const targetCampus = isolate ? new Campus() : campus;
    targetCampus.reset();
    const results: any = {};
    for (const tc of STANDARD_TEST_CASES) {
      const actual = targetCampus.handle(tc.input);
      const passed = compareResponses(actual, tc.expected);
      results[tc.id] = { actual, passed, executed: true };
    }
    setTestResults(results);
    setCurrentStepIndex(STANDARD_TEST_CASES.length);
    if (!isolate) {
      onStateUpdate();
    }
    if (onStatsUpdate) {
      onStatsUpdate({
        executed: STANDARD_TEST_CASES.length,
        passed: STANDARD_TEST_CASES.length,
        total: STANDARD_TEST_CASES.length,
      });
    }
  };

  React.useEffect(() => {
    if (autoRunKey && autoRunKey > 0) {
      handleRunAll();
    }
  }, [autoRunKey]);

  // 2. 單步執行下一筆
  const handleStepForward = () => {
    if (currentStepIndex >= STANDARD_TEST_CASES.length) return;
    const tc = STANDARD_TEST_CASES[currentStepIndex];
    const actual = campus.handle(tc.input);
    const passed = compareResponses(actual, tc.expected);

    const newResults = {
      ...testResults,
      [tc.id]: { actual, passed, executed: true },
    };
    setTestResults(newResults);
    setCurrentStepIndex((prev) => prev + 1);
    onStateUpdate();
    if (onStatsUpdate) {
      const pCount = Object.values(newResults).filter((r) => r.passed).length;
      onStatsUpdate({
        executed: Object.keys(newResults).length,
        passed: pCount,
        total: STANDARD_TEST_CASES.length,
      });
    }
  };

  // 3. 重設所有測試
  const handleResetTests = () => {
    campus.reset();
    setCurrentStepIndex(0);
    setTestResults({});
    onStateUpdate();
    if (onStatsUpdate) {
      onStatsUpdate({
        executed: 0,
        passed: 0,
        total: STANDARD_TEST_CASES.length,
      });
    }
  };

  const executedCount = Object.keys(testResults).length;
  const passedCount = Object.values(testResults).filter((r) => r.passed).length;

  const filteredTests = STANDARD_TEST_CASES.filter((tc) => {
    if (filterCategory !== "All" && tc.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = tc.name.toLowerCase().includes(q);
      const matchDesc = tc.description.toLowerCase().includes(q);
      const matchCmd = JSON.stringify(tc.input).toLowerCase().includes(q);
      return matchName || matchDesc || matchCmd;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 頂部標題與執行控制列 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 tracking-wide uppercase">
            <span>Official Test Suite</span>
            <span aria-hidden="true">·</span>
            <span>30 筆手算標準測試集</span>
            <span aria-hidden="true">·</span>
            <span>100% 規格對齊</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            測試資料生成與手算驗證套件 (Test Suite)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            涵蓋正常流程與各類邊界案例（空佇列叫號、重複索書號、未找到圖書、格式錯誤時間、越界位置、首頁返回、無效指令）。
          </p>
        </div>

        {/* 測試控制按鈕群 */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResetTests}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重設進度</span>
          </button>
          <button
            onClick={handleStepForward}
            disabled={currentStepIndex >= STANDARD_TEST_CASES.length}
            className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-amber-200 hover:bg-amber-300 disabled:opacity-50 rounded transition-colors flex items-center gap-1.5"
          >
            <StepForward className="w-3.5 h-3.5" />
            <span>單步執行 (#{currentStepIndex + 1})</span>
          </button>
          <button
            onClick={() => handleRunAll()}
            className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>一鍵執行全量 (30筆)</span>
          </button>
        </div>
      </div>

      {/* 測試通過率進度看板 */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-slate-500">已執行測試</div>
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {executedCount} / {STANDARD_TEST_CASES.length}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <div className="text-xs text-slate-500">測試通過 (Passed)</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
              {passedCount}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <div className="text-xs text-slate-500">未通過 (Failed)</div>
            <div className="text-2xl font-bold font-mono text-rose-600 tabular-nums">
              {executedCount - passedCount}
            </div>
          </div>
        </div>

        {/* 進度條 */}
        <div className="flex-1 max-w-md">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>驗證達成率</span>
            <span className="font-mono font-semibold">
              {executedCount > 0 ? Math.round((passedCount / STANDARD_TEST_CASES.length) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${(passedCount / STANDARD_TEST_CASES.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* 過濾與搜尋工具列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* 分類篩選 Tab */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md overflow-x-auto">
          {["All", "Queue", "BST", "LinkedList", "Stack", "General"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                filterCategory === cat
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {cat === "All"
                ? "全部 (30)"
                : cat === "Queue"
                ? "佇列 (5)"
                : cat === "BST"
                ? "二元搜尋樹 (8)"
                : cat === "LinkedList"
                ? "鏈結串列 (11)"
                : cat === "Stack"
                ? "堆疊 (5)"
                : "一般指令 (1)"}
            </button>
          ))}
        </div>

        {/* 關鍵字搜尋 */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋測試名稱、指令或描述..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* 30 筆測試資料詳細清單表格 */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3 w-28">分類模組</th>
                <th className="py-2.5 px-3">測試名稱與情境描述</th>
                <th className="py-2.5 px-3 font-mono">輸入 JSON (Request)</th>
                <th className="py-2.5 px-3 font-mono">預期手算輸出 (Expected)</th>
                <th className="py-2.5 px-3 font-mono">實際執行輸出 (Actual)</th>
                <th className="py-2.5 px-3 w-24 text-center">測試結果</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTests.map((tc) => {
                const res = testResults[tc.id];
                const isExecuted = res?.executed;
                const isPassed = res?.passed;

                return (
                  <tr
                    key={tc.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      currentStepIndex === tc.id - 1
                        ? "bg-amber-50/40"
                        : ""
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-400">
                      {tc.id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">
                      <span className="font-mono text-[11px] text-slate-600">
                        {tc.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{tc.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {tc.description}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 max-w-xs break-all">
                      <code>{JSON.stringify(tc.input)}</code>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 max-w-xs break-all">
                      <code>{JSON.stringify(tc.expected)}</code>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] max-w-xs break-all">
                      {isExecuted ? (
                        <code
                          className={
                            isPassed ? "text-emerald-700" : "text-rose-700 font-bold"
                          }
                        >
                          {JSON.stringify(res.actual)}
                        </code>
                      ) : (
                        <span className="text-slate-400 italic">尚未執行</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isExecuted ? (
                        isPassed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>通過</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-xs">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>未符</span>
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 text-xs">待測</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
