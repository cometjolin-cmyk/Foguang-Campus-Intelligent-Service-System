/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 資料結構核心知識原理與記憶體模型視覺總覽
 */

import React, { useState } from "react";
import { ArrowRight, ArrowDown, ArrowUp, Layers, Users, Binary, Calendar, PlayCircle } from "lucide-react";
import { MermaidLearningPath } from "./MermaidLearningPath";

interface ConceptOverviewProps {
  onSelectModule: (mod: "queue" | "bst" | "linkedlist" | "stack") => void;
}

export const ConceptOverview: React.FC<ConceptOverviewProps> = ({ onSelectModule }) => {
  // 互動小實驗：切換比較 Array vs Linked List 記憶體模型
  const [memoryFocus, setMemoryFocus] = useState<"array" | "linked">("linked");

  return (
    <div className="space-y-8">
      {/* 導讀標頭 */}
      <div className="pb-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 tracking-wide uppercase">
            <span>Visual Concept Guide</span>
            <span aria-hidden="true">·</span>
            <span>四大基礎資料結構知識圖解</span>
            <span aria-hidden="true">·</span>
            <span>記憶體模型與複雜度</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            資料結構運作原理與比較全景圖
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            透過直觀的記憶體配置圖示與操作原則，一次掌握佇列、二元搜尋樹、鏈結串列與堆疊的本質差異，再進入各互動沙盒進行實機演練。
          </p>
        </div>
      </div>

      {/* Mermaid 資料結構學習路徑流程圖 */}
      <MermaidLearningPath onSelectModule={onSelectModule} />

      {/* 四大資料結構視覺卡片 (2x2 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Queue (佇列) */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">1. 佇列 (Queue)</h3>
                  <div className="text-xs text-slate-500">先進先出 (FIFO) · 討論室預約叫號</div>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-amber-700">
                O(1) 進出
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              資料從<strong>隊尾 (Rear)</strong>進入，從<strong>隊首 (Front)</strong>離開，像排隊結帳一樣維持先來後到的公平順序。Python 中使用雙端佇列 <code className="font-mono text-slate-800">collections.deque</code>，避免普通陣列 <code className="font-mono text-slate-800">pop(0)</code> 時造成後方全部元素搬移的 O(n) 成本。
            </p>

            {/* 視覺示意圖 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2">
                <span className="text-blue-700 font-bold">← 出隊 Dequeue (Front)</span>
                <span className="text-amber-700 font-bold">入隊 Enqueue (Rear) ←</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-[11px] font-mono text-blue-600">popleft()</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-500 rotate-180" />
                <div className="flex items-center border-y-2 border-slate-300 bg-white px-2 py-1.5 gap-1.5 rounded">
                  <div className="px-2.5 py-1 bg-amber-100 border border-amber-300 rounded font-mono text-xs font-bold text-amber-900">
                    Q-001
                  </div>
                  <div className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded font-mono text-xs text-slate-700">
                    Q-002
                  </div>
                  <div className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded font-mono text-xs text-slate-700">
                    Q-003
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-600 rotate-180" />
                <span className="text-[11px] font-mono text-amber-700">append()</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">核心指標：Front / Rear</span>
            <button
              onClick={() => onSelectModule("queue")}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded flex items-center gap-1.5 transition-colors"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>進入佇列互動沙盒</span>
            </button>
          </div>
        </div>

        {/* 2. Stack (堆疊) */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">2. 堆疊 (Stack)</h3>
                  <div className="text-xs text-slate-500">後進先出 (LIFO) · 導覽頁面返回鍵</div>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-indigo-700">
                O(1) 推彈
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              所有新增與移除動作都只發生在同一個開口——<strong>頂端 (Top)</strong>，就像疊盤子或程式的函式呼叫堆疊 (Call Stack)。最後瀏覽的頁面最先被彈出返回；若堆疊已到達底端 (Base)，則必須防禦 Underflow 錯誤。
            </p>

            {/* 視覺示意圖 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-around gap-4">
              <div className="flex flex-col items-center gap-1 text-[11px] font-mono">
                <div className="flex items-center gap-1 text-indigo-700 font-bold">
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>Push (進入頁面)</span>
                </div>
                <div className="flex items-center gap-1 text-rose-600 font-bold">
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>Pop (按返回鍵)</span>
                </div>
              </div>

              <div className="border-x-2 border-b-2 border-slate-400 rounded-b-lg p-2 w-44 space-y-1 bg-white">
                <div className="px-2 py-1 bg-indigo-100 border border-indigo-300 rounded text-[11px] font-semibold text-indigo-900 flex justify-between">
                  <span>討論室預約頁</span>
                  <span className="font-mono text-[10px]">← TOP</span>
                </div>
                <div className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-700">
                  圖書館專區
                </div>
                <div className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-500 flex justify-between">
                  <span>首頁</span>
                  <span className="font-mono text-[10px]">BASE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">核心指標：Top (Stack Pointer)</span>
            <button
              onClick={() => onSelectModule("stack")}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded flex items-center gap-1.5 transition-colors"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>進入堆疊互動沙盒</span>
            </button>
          </div>
        </div>

        {/* 3. Linked List (鏈結串列) */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">3. 鏈結串列 (Linked List)</h3>
                  <div className="text-xs text-slate-500">動態指標串接 · 個人化行事曆時間軸</div>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-sky-700">
                指標重接 O(1)
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              節點分散在記憶體各處，每個節點由「<strong>資料 (Data)</strong>」與「<strong>指標 (next)</strong>」組成。在串列中間插入新行程時，只需修改相鄰兩個節點的 <code className="font-mono text-slate-800">next</code> 指標（先接後斷），不需像陣列般移動後續全部元素。
            </p>

            {/* 視覺示意圖：可切換比較 Array vs Linked List */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-700">記憶體配置比較：</span>
                <div className="flex gap-1 bg-slate-200 p-0.5 rounded text-[10px]">
                  <button
                    onClick={() => setMemoryFocus("linked")}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      memoryFocus === "linked"
                        ? "bg-white text-sky-800 font-bold shadow-xs"
                        : "text-slate-600"
                    }`}
                  >
                    鏈結串列 (分散指標)
                  </button>
                  <button
                    onClick={() => setMemoryFocus("array")}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      memoryFocus === "array"
                        ? "bg-white text-slate-900 font-bold shadow-xs"
                        : "text-slate-600"
                    }`}
                  >
                    陣列 (連續記憶體)
                  </button>
                </div>
              </div>

              {memoryFocus === "linked" ? (
                <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1">
                  <span className="text-[10px] font-mono bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-bold">
                    head
                  </span>
                  <ArrowRight className="w-3 h-3 text-sky-600 shrink-0" />
                  <div className="flex border border-sky-300 bg-white rounded text-[11px] font-mono overflow-hidden shrink-0">
                    <span className="px-2 py-1 text-slate-800">週一課</span>
                    <span className="px-1.5 py-1 bg-sky-50 border-l border-sky-200 text-sky-700">next</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  <div className="flex border border-sky-300 bg-white rounded text-[11px] font-mono overflow-hidden shrink-0">
                    <span className="px-2 py-1 text-slate-800">週二借書</span>
                    <span className="px-1.5 py-1 bg-sky-50 border-l border-sky-200 text-sky-700">next</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                    None
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center py-1 gap-1">
                  <div className="flex border border-slate-300 bg-white rounded overflow-hidden text-[11px] font-mono">
                    <span className="px-2.5 py-1 border-r border-slate-200">[0] 週一課</span>
                    <span className="px-2.5 py-1 border-r border-slate-200 bg-amber-50 text-amber-800">插入位置</span>
                    <span className="px-2.5 py-1 border-r border-slate-200">[1→2] 需右移</span>
                    <span className="px-2.5 py-1">[2→3] 需右移</span>
                  </div>
                  <span className="text-[10px] text-slate-500">連續空間：中間插入需將後方元素全部右移 O(n)</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">核心指標：head / cur / next</span>
            <button
              onClick={() => onSelectModule("linkedlist")}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded flex items-center gap-1.5 transition-colors"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>進入鏈結串列沙盒</span>
            </button>
          </div>
        </div>

        {/* 4. Binary Search Tree (二元搜尋樹) */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Binary className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">4. 二元搜尋樹 (Binary Search Tree)</h3>
                  <div className="text-xs text-slate-500">左小右大分治 · 圖書索書號檢索與排序</div>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-700">
                平均 O(log n)
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              每個節點最多有兩個子節點（<code className="font-mono text-slate-800">left</code> 與 <code className="font-mono text-slate-800">right</code>），滿足「<strong>左子樹小於父節點、右子樹大於父節點</strong>」。每次比較即可排除一半搜尋空間，並可透過<strong>中序走訪 (In-order)</strong> 自動由小到大輸出結果。
            </p>

            {/* 視覺示意圖 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-around gap-4">
              <svg width="170" height="96" viewBox="0 0 170 96" className="shrink-0">
                <line x1="85" y1="22" x2="45" y2="55" stroke="#94a3b8" strokeWidth="1.5" />
                <line x1="85" y1="22" x2="125" y2="55" stroke="#94a3b8" strokeWidth="1.5" />
                <line x1="45" y1="55" x2="70" y2="82" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="85" cy="20" r="13" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
                <text x="85" y="24" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace">305</text>
                <circle cx="45" cy="55" r="12" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
                <text x="45" y="59" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace">102</text>
                <circle cx="125" cy="55" r="12" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
                <text x="125" y="59" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace">410</text>
                <circle cx="70" cy="82" r="11" fill="#dcfce7" stroke="#15803d" strokeWidth="1.8" />
                <text x="70" y="86" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace" fill="#166534">210</text>
              </svg>

              <div className="text-[11px] space-y-1 text-slate-700 font-mono">
                <div className="text-emerald-800 font-semibold">三種走訪順序：</div>
                <div>• 前序 (Root→L→R)：305, 102, 210, 410</div>
                <div className="font-bold text-emerald-700">• 中序 (L→Root→R)：102, 210, 305, 410</div>
                <div>• 後序 (L→R→Root)：210, 102, 410, 305</div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">核心指標：root / left / right</span>
            <button
              onClick={() => onSelectModule("bst")}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded flex items-center gap-1.5 transition-colors"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>進入二元樹互動沙盒</span>
            </button>
          </div>
        </div>
      </div>

      {/* 複雜度與適用場景總結對照表 */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-xs font-bold text-slate-900">
            四大資料結構核心特性與時間複雜度比較矩陣
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-700 bg-white font-semibold">
                <th className="py-2.5 px-4">資料結構</th>
                <th className="py-2.5 px-4">存取原則</th>
                <th className="py-2.5 px-4 font-mono">插入 / 新增</th>
                <th className="py-2.5 px-4 font-mono">刪除 / 取出</th>
                <th className="py-2.5 px-4 font-mono">搜尋 / 存取</th>
                <th className="py-2.5 px-4">記憶體配置</th>
                <th className="py-2.5 px-4">典型應用場景</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-4 font-bold text-amber-800">佇列 (Queue)</td>
                <td className="py-2.5 px-4">先進先出 (FIFO)</td>
                <td className="py-2.5 px-4 font-mono">O(1) 隊尾</td>
                <td className="py-2.5 px-4 font-mono">O(1) 隊首</td>
                <td className="py-2.5 px-4 font-mono">O(n)</td>
                <td className="py-2.5 px-4">雙端區塊鏈 (deque)</td>
                <td className="py-2.5 px-4">討論室叫號、印表機排程、BFS</td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-4 font-bold text-indigo-800">堆疊 (Stack)</td>
                <td className="py-2.5 px-4">後進先出 (LIFO)</td>
                <td className="py-2.5 px-4 font-mono">O(1) 頂端</td>
                <td className="py-2.5 px-4 font-mono">O(1) 頂端</td>
                <td className="py-2.5 px-4 font-mono">O(n)</td>
                <td className="py-2.5 px-4">動態陣列 (list)</td>
                <td className="py-2.5 px-4">頁面返回、復原 (Undo)、DFS</td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-4 font-bold text-sky-800">鏈結串列 (Linked List)</td>
                <td className="py-2.5 px-4">單向循序走訪</td>
                <td className="py-2.5 px-4 font-mono">頭部 O(1) / 指定 O(n)</td>
                <td className="py-2.5 px-4 font-mono">頭部 O(1) / 指定 O(n)</td>
                <td className="py-2.5 px-4 font-mono">O(n)</td>
                <td className="py-2.5 px-4">分散節點 + next 指標</td>
                <td className="py-2.5 px-4">動態行程表、音樂播放清單</td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-4 font-bold text-emerald-800">二元搜尋樹 (BST)</td>
                <td className="py-2.5 px-4">左小右大層級分支</td>
                <td className="py-2.5 px-4 font-mono">平均 O(log n)</td>
                <td className="py-2.5 px-4 font-mono">平均 O(log n)</td>
                <td className="py-2.5 px-4 font-mono">平均 O(log n)</td>
                <td className="py-2.5 px-4">樹節點 + left/right</td>
                <td className="py-2.5 px-4">圖書索引、資料庫索引排序</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
