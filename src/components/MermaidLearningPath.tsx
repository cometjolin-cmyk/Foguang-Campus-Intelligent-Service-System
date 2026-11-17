/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 資料結構學習路徑 Mermaid 流程圖：展示佇列、堆疊、鏈結串列與二元搜尋樹的邏輯銜接順序
 */

import React, { useEffect, useId, useMemo, useState } from "react";
import mermaid from "mermaid";
import {
  GitBranch,
  Code2,
  Copy,
  Check,
  ArrowRight,
  Columns2,
  Rows2,
  PlayCircle,
} from "lucide-react";

interface MermaidLearningPathProps {
  onSelectModule: (mod: "queue" | "bst" | "linkedlist" | "stack") => void;
}

let mermaidInitialized = false;

function ensureMermaidInit() {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    securityLevel: "loose",
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: "basis",
      padding: 16,
      nodeSpacing: 45,
      rankSpacing: 65,
    },
    themeVariables: {
      fontFamily: "'Noto Sans TC', 'Plus Jakarta Sans', sans-serif",
      fontSize: "13px",
      lineColor: "#64748b",
      textColor: "#0f172a",
      edgeLabelBackground: "#ffffff",
    },
  });
  mermaidInitialized = true;
}

function buildMermaidSource(direction: "LR" | "TD"): string {
  return `flowchart ${direction}
    START(["學習起點：線性順序思維<br/>掌握 O(1) 端點存取與記憶體直覺"])
    Q["Step 1：佇列 Queue<br/>FIFO 先進先出 · 雙端開口<br/>討論室預約叫號 / deque"]
    S["Step 2：堆疊 Stack<br/>LIFO 後進先出 · 單口頂端<br/>頁面返回鍵 / 函式呼叫堆疊"]
    LL["Step 3：鏈結串列 Linked List<br/>Node 節點 + 單一 next 指標<br/>行事曆動態插入「先接後斷」"]
    BST["Step 4：二元搜尋樹 BST<br/>left / right 雙分支指標 + 大小規則<br/>索書號 O(log n) 檢索與三序走訪"]

    START --> Q
    START --> S
    Q -->|"認識 deque 避免搬移<br/>進而理解指標節點"| LL
    S -->|"從頂端單向追蹤<br/>延伸到 head / cur 指標"| LL
    LL -->|"單一 next 指標升級為<br/>left & right 雙分支分治"| BST
    S -.->|"底層提供 Call Stack<br/>支撐 BST 遞迴走訪"| BST

    classDef startCls fill:#0f172a,stroke:#334155,color:#fbbf24,stroke-width:2px;
    classDef queueCls fill:#fef3c7,stroke:#d97706,color:#78350f,stroke-width:2px;
    classDef stackCls fill:#e0e7ff,stroke:#4f46e5,color:#312e81,stroke-width:2px;
    classDef listCls fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e,stroke-width:2px;
    classDef bstCls fill:#dcfce7,stroke:#15803d,color:#14532d,stroke-width:2px;

    class START startCls;
    class Q queueCls;
    class S stackCls;
    class LL listCls;
    class BST bstCls;`;
}

const LEARNING_STEPS: {
  step: string;
  mod: "queue" | "stack" | "linkedlist" | "bst";
  title: string;
  bridge: string;
  colorClass: string;
}[] = [
  {
    step: "Step 1",
    mod: "queue",
    title: "佇列 (Queue)",
    bridge: "先由生活最直觀的「排隊 FIFO」建立端點操作與 O(1) 效能意識（理解為何不用 pop(0)）。",
    colorClass: "bg-amber-50 border-amber-200 text-amber-900",
  },
  {
    step: "Step 2",
    mod: "stack",
    title: "堆疊 (Stack)",
    bridge: "將雙端收斂為單端「後進先出 LIFO」，掌握 Top 指標、Underflow 保護與遞迴 Call Stack 基礎。",
    colorClass: "bg-indigo-50 border-indigo-200 text-indigo-900",
  },
  {
    step: "Step 3",
    mod: "linkedlist",
    title: "鏈結串列 (Linked List)",
    bridge: "打破連續陣列限制，親手實作 Node + next 指標，練習 head/cur 走訪與「先接後斷」重接。",
    colorClass: "bg-sky-50 border-sky-200 text-sky-900",
  },
  {
    step: "Step 4",
    mod: "bst",
    title: "二元搜尋樹 (BST)",
    bridge: "將單一 next 擴展為 left / right 雙指標並加上大小約束，結合 Stack 遞迴實現 O(log n) 分治與排序。",
    colorClass: "bg-emerald-50 border-emerald-200 text-emerald-900",
  },
];

export const MermaidLearningPath: React.FC<MermaidLearningPathProps> = ({
  onSelectModule,
}) => {
  const reactId = useId();
  const [direction, setDirection] = useState<"LR" | "TD">("LR");
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);
  const [svgMarkup, setSvgMarkup] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);

  const mermaidCode = useMemo(() => buildMermaidSource(direction), [direction]);

  useEffect(() => {
    let cancelled = false;
    const renderDiagram = async () => {
      try {
        ensureMermaidInit();
        const safeId = `mermaid_lp_${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}_${direction}_${Date.now()}`;
        const { svg } = await mermaid.render(safeId, mermaidCode);
        if (!cancelled) {
          setSvgMarkup(svg);
          setRenderError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setRenderError(err instanceof Error ? err.message : "Mermaid 圖表渲染失敗");
        }
      }
    };
    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [mermaidCode, direction, reactId]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Header Toolbar */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              初學者資料結構學習路徑圖（Mermaid 邏輯銜接關係）
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              建議依序由「端點受限線性結構（佇列／堆疊）」→「單指標節點（鏈結串列）」→「雙指標樹狀分治（二元搜尋樹）」漸進學習。
            </p>
          </div>
        </div>

        {/* Layout & Source Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-md text-[11px]">
            <button
              type="button"
              onClick={() => setDirection("LR")}
              className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
                direction === "LR"
                  ? "bg-white text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Columns2 className="w-3 h-3" />
              <span>橫向流程 (LR)</span>
            </button>
            <button
              type="button"
              onClick={() => setDirection("TD")}
              className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
                direction === "TD"
                  ? "bg-white text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Rows2 className="w-3 h-3" />
              <span>縱向階層 (TD)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowSource((s) => !s)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 ${
              showSource
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showSource ? "隱藏 Mermaid 語法" : "檢視 Mermaid 語法"}</span>
          </button>
        </div>
      </div>

      {/* Rendered Mermaid SVG Canvas */}
      <div className="p-5 bg-slate-50/60 border-b border-slate-200">
        {renderError ? (
          <div className="p-4 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700">
            Mermaid 流程圖渲染失敗：{renderError}
          </div>
        ) : svgMarkup ? (
          <div
            className="w-full overflow-x-auto py-2 [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:mx-auto"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        ) : (
          <div className="py-10 text-center text-xs text-slate-400">
            正在渲染 Mermaid 學習路徑流程圖...
          </div>
        )}
      </div>

      {/* Collapsible Mermaid Source Code */}
      {showSource && (
        <div className="bg-slate-950 text-slate-200 border-b border-slate-800 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-amber-400 font-semibold">
              mermaid flowchart {direction}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300">已複製語法</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>複製語法</span>
                </>
              )}
            </button>
          </div>
          <pre className="font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto p-3 rounded bg-slate-900 border border-slate-800">
            {mermaidCode}
          </pre>
        </div>
      )}

      {/* Four-Stage Guided Learning Sequence Cards */}
      <div className="p-5 bg-white">
        <div className="text-xs font-semibold text-slate-700 mb-3">
          依建議學習順序進入各互動模組：
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {LEARNING_STEPS.map((item, idx) => (
            <div
              key={item.mod}
              className={`rounded-lg border p-3.5 flex flex-col justify-between gap-3 ${item.colorClass}`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                  <span>{item.step}</span>
                  {idx < LEARNING_STEPS.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 opacity-60 hidden lg:inline" />
                  )}
                </div>
                <div className="text-xs font-bold">{item.title}</div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {item.bridge}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectModule(item.mod)}
                className="w-full py-1.5 px-2.5 rounded bg-white/90 hover:bg-white border border-current/20 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>開始演練 {item.step}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
