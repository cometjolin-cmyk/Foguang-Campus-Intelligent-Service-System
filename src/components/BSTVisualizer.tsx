/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BookNode, Campus } from "../engine/campusCore";
import { LiveCodeTracer, TraceStep } from "./LiveCodeTracer";
import { Search, Plus, ListOrdered, CheckCircle2, AlertCircle, FileText } from "lucide-react";

interface BSTVisualizerProps {
  campus: Campus;
  onActionTriggered: () => void;
  systemVersion?: number;
}

interface RenderNode {
  node: BookNode;
  x: number;
  y: number;
  left?: RenderNode | null;
  right?: RenderNode | null;
}

interface BSTTraceStep extends TraceStep {
  activeCallNo: number | null;
  visitedCallNos: number[];
  foundCallNo?: number | null;
  traversalOutput?: { call_no: number; title: string }[];
}

const BST_SEARCH_CODE = [
  "def search(self, call_no):           # 平均 O(log n)",
  "    cur, steps = self.root, 0        # 從根節點出發",
  "    while cur:",
  "        steps += 1                   # 比較次數 +1",
  "        if call_no == cur.call_no:   # 命中目標！",
  "            return cur, steps",
  "        if call_no < cur.call_no:    # 小於目前節點 → 往左",
  "            cur = cur.left",
  "        else:                        # 大於目前節點 → 往右",
  "            cur = cur.right",
  "    return None, steps               # 走訪至空位，未找到",
];

const BST_TRAVERSAL_CODE: Record<"inorder" | "preorder" | "postorder", string[]> = {
  inorder: [
    "def inorder(self, node):             # 中序 (由小到大排序): O(n)",
    "    if node is None: return []",
    "    left = self.inorder(node.left)   # 1. 先走訪左子樹 (較小值)",
    "    mid  = [(node.call_no, node.title)]  # 2. 拜訪根節點",
    "    right = self.inorder(node.right) # 3. 再走訪右子樹 (較大值)",
    "    return left + mid + right",
  ],
  preorder: [
    "def preorder(self, node):            # 前序 (由上而下建立): O(n)",
    "    if node is None: return []",
    "    mid  = [(node.call_no, node.title)]  # 1. 先拜訪根節點",
    "    left = self.preorder(node.left)  # 2. 再走訪左子樹",
    "    right = self.preorder(node.right)# 3. 最後走訪右子樹",
    "    return mid + left + right",
  ],
  postorder: [
    "def postorder(self, node):           # 後序 (由底而上清除): O(n)",
    "    if node is None: return []",
    "    left = self.postorder(node.left) # 1. 先走訪左子樹",
    "    right = self.postorder(node.right)# 2. 再走訪右子樹",
    "    mid  = [(node.call_no, node.title)]  # 3. 最後拜訪根節點",
    "    return left + right + mid",
  ],
};

export const BSTVisualizer: React.FC<BSTVisualizerProps> = ({
  campus,
  onActionTriggered,
  systemVersion = 0,
}) => {
  const [searchCallNo, setSearchCallNo] = useState("210");
  const [newCallNo, setNewCallNo] = useState("500");
  const [newTitle, setNewTitle] = useState("雲端運算架構");
  const [showTextTree, setShowTextTree] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // 動畫追蹤模式：search 或 traversal
  const [traceMode, setTraceMode] = useState<"search" | "inorder" | "preorder" | "postorder">("search");
  const [traceSteps, setTraceSteps] = useState<BSTTraceStep[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
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

  // 1. 搜尋索書號（生成動畫步驟）
  const handleSearch = (overrideCallNo?: number) => {
    const num = overrideCallNo !== undefined ? overrideCallNo : parseInt(searchCallNo, 10);
    if (isNaN(num)) {
      setFeedback({ type: "error", msg: "索書號必須為整數" });
      return;
    }

    setTraceMode("search");
    const steps: BSTTraceStep[] = [];
    let cur = campus.books.root;
    let count = 0;
    const visited: number[] = [];

    if (!cur) {
      steps.push({
        line: 11,
        activeCallNo: null,
        visitedCallNos: [],
        description: `樹為空 (root is None)，無法找到索書號 ${num}`,
        variables: { target: num, steps: 0, result: "not found" },
      });
    } else {
      steps.push({
        line: 2,
        activeCallNo: cur.call_no,
        visitedCallNos: [],
        description: `開始搜尋 ${num}：指標 cur 指向樹根節點 ${cur.call_no}（${cur.title}）`,
        variables: { target: num, cur: cur.call_no, steps: 0 },
      });

      while (cur !== null) {
        count += 1;
        visited.push(cur.call_no);
        if (num === cur.call_no) {
          steps.push({
            line: 5,
            activeCallNo: cur.call_no,
            visitedCallNos: [...visited],
            foundCallNo: cur.call_no,
            description: `第 ${count} 次比較：${num} == ${cur.call_no}，命中《${cur.title}》！`,
            variables: { target: num, cur: cur.call_no, steps: count, result: "found" },
          });
          break;
        } else if (num < cur.call_no) {
          steps.push({
            line: 8,
            activeCallNo: cur.call_no,
            visitedCallNos: [...visited],
            description: `第 ${count} 次比較：${num} < ${cur.call_no}，往左子節點 (left) 尋找`,
            variables: { target: num, cur: cur.call_no, direction: "left", steps: count },
          });
          cur = cur.left;
        } else {
          steps.push({
            line: 10,
            activeCallNo: cur.call_no,
            visitedCallNos: [...visited],
            description: `第 ${count} 次比較：${num} > ${cur.call_no}，往右子節點 (right) 尋找`,
            variables: { target: num, cur: cur.call_no, direction: "right", steps: count },
          });
          cur = cur.right;
        }

        if (cur === null) {
          steps.push({
            line: 11,
            activeCallNo: null,
            visitedCallNos: [...visited],
            foundCallNo: null,
            description: `走訪至空節點 (None)，確定館藏中無索書號 ${num}，共比較 ${count} 次`,
            variables: { target: num, steps: count, result: "not found" },
          });
        }
      }
    }

    setTraceSteps(steps);
    setStepIdx(0);
    setIsPlaying(steps.length > 1);

    const { node, steps: totalSteps } = campus.books.search(num);
    if (node) {
      setFeedback({
        type: "success",
        msg: `檢索成功！書名：《${node.title}》，比較次數 ${totalSteps} 次`,
      });
    } else {
      setFeedback({
        type: "error",
        msg: `館藏未找到 (not found)，比對次數 ${totalSteps} 次`,
      });
    }
    onActionTriggered();
  };

  // 2. 新增書籍
  const handleAddBook = (cNo?: number, t?: string) => {
    const callNum = cNo !== undefined ? cNo : parseInt(newCallNo, 10);
    const title = t !== undefined ? t : newTitle.trim();

    if (isNaN(callNum)) {
      setFeedback({ type: "error", msg: "索書號必須為整數" });
      return;
    }
    if (!title) {
      setFeedback({ type: "error", msg: "請輸入書名" });
      return;
    }

    const res = campus.handle({ cmd: "add_book", call_no: callNum, title });
    if (res.status === "ok") {
      setFeedback({
        type: "success",
        msg: `成功建立索書號 ${callNum}《${title}》至二元搜尋樹`,
      });
      // 自動播放剛插入節點的搜尋路徑動畫
      setSearchCallNo(String(callNum));
      const { path } = campus.books.search(callNum);
      setTraceMode("search");
      setTraceSteps([
        {
          line: 5,
          activeCallNo: callNum,
          visitedCallNos: path,
          foundCallNo: callNum,
          description: `新節點 ${callNum}《${title}》已沿比較路徑 [${path.join(" → ")}] 插入至正確空位！`,
          variables: { inserted: callNum, depth: path.length },
        },
      ]);
      setStepIdx(0);
      setIsPlaying(false);
    } else {
      setFeedback({
        type: "error",
        msg: `新增失敗：${res.message} (索書號重複)`,
      });
    }
    onActionTriggered();
  };

  // 3. 三種走訪動畫 (In-order / Pre-order / Post-order)
  const handleRunTraversal = (order: "inorder" | "preorder" | "postorder") => {
    const list =
      order === "inorder"
        ? campus.books.inorder()
        : order === "preorder"
        ? campus.books.preorder()
        : campus.books.postorder();

    if (list.length === 0) {
      setFeedback({ type: "error", msg: "目前樹為空，請先新增館藏書籍" });
      return;
    }

    const orderLabel =
      order === "inorder"
        ? "中序走訪 (左 → 根 → 右)"
        : order === "preorder"
        ? "前序走訪 (根 → 左 → 右)"
        : "後序走訪 (左 → 右 → 根)";

    const activeLineNum = order === "inorder" ? 4 : order === "preorder" ? 3 : 5;
    const visited: number[] = [];
    const outputSoFar: { call_no: number; title: string }[] = [];

    const steps: BSTTraceStep[] = list.map((b, idx) => {
      visited.push(b.call_no);
      outputSoFar.push(b);
      return {
        line: activeLineNum,
        activeCallNo: b.call_no,
        visitedCallNos: [...visited],
        foundCallNo: b.call_no,
        traversalOutput: [...outputSoFar],
        description: `${orderLabel} 第 ${idx + 1} 步：輸出節點 ${b.call_no}《${b.title}》`,
        variables: {
          order,
          visit: `${idx + 1}/${list.length}`,
          node: b.call_no,
        },
      };
    });

    setTraceMode(order);
    setTraceSteps(steps);
    setStepIdx(0);
    setIsPlaying(steps.length > 1);
    setFeedback({
      type: "success",
      msg: `正在演示【${orderLabel}】，共 ${list.length} 個節點${order === "inorder" ? "（結果依索書號由小到大自動排序）" : ""}`,
    });
    onActionTriggered();
  };

  // 計算 SVG 樹節點坐標
  const buildTreeLayout = (): { rootLayout: RenderNode | null; width: number; height: number } => {
    if (!campus.books.root) return { rootLayout: null, width: 620, height: 280 };

    let maxDepth = 0;
    const layout = (
      node: BookNode | null,
      depth: number,
      leftBound: number,
      rightBound: number
    ): RenderNode | null => {
      if (!node) return null;
      if (depth > maxDepth) maxDepth = depth;
      const x = (leftBound + rightBound) / 2;
      const y = depth * 72 + 45;
      return {
        node,
        x,
        y,
        left: layout(node.left, depth + 1, leftBound, x),
        right: layout(node.right, depth + 1, x, rightBound),
      };
    };

    const width = 620;
    const rootLayout = layout(campus.books.root, 0, 35, width - 35);
    const height = Math.max(280, (maxDepth + 1) * 72 + 40);
    return { rootLayout, width, height };
  };

  const { rootLayout, width, height } = buildTreeLayout();
  const activeStep = traceSteps[stepIdx];
  const visitedSet = activeStep?.visitedCallNos || [];
  const currentActiveCallNo = activeStep?.activeCallNo ?? null;
  const foundCallNo = activeStep?.foundCallNo ?? null;

  // 遞迴渲染 SVG 邊線
  const renderLines = (rNode: RenderNode | null): React.ReactNode => {
    if (!rNode) return null;
    return (
      <React.Fragment key={`lines-${rNode.node.call_no}`}>
        {rNode.left && (
          <>
            <line
              x1={rNode.x}
              y1={rNode.y}
              x2={rNode.left.x}
              y2={rNode.left.y}
              stroke={visitedSet.includes(rNode.left.node.call_no) ? "#d97706" : "#94a3b8"}
              strokeWidth={visitedSet.includes(rNode.left.node.call_no) ? "2.5" : "2"}
            />
            {renderLines(rNode.left)}
          </>
        )}
        {rNode.right && (
          <>
            <line
              x1={rNode.x}
              y1={rNode.y}
              x2={rNode.right.x}
              y2={rNode.right.y}
              stroke={visitedSet.includes(rNode.right.node.call_no) ? "#d97706" : "#94a3b8"}
              strokeWidth={visitedSet.includes(rNode.right.node.call_no) ? "2.5" : "2"}
            />
            {renderLines(rNode.right)}
          </>
        )}
      </React.Fragment>
    );
  };

  // 遞迴渲染 SVG 圓圈節點
  const renderNodes = (rNode: RenderNode | null | undefined): React.ReactNode => {
    if (!rNode) return null;
    const cNo = rNode.node.call_no;
    const isCurrent = currentActiveCallNo === cNo;
    const isVisited = visitedSet.includes(cNo);
    const stepOrder = visitedSet.indexOf(cNo);
    const isFoundTarget = foundCallNo === cNo;

    return (
      <React.Fragment key={`node-${cNo}`}>
        <g className="transition-all duration-300">
          {/* 外光暈 */}
          {(isCurrent || isFoundTarget) && (
            <circle
              cx={rNode.x}
              cy={rNode.y}
              r="27"
              fill={isFoundTarget ? "#dcfce7" : "#fef3c7"}
              className="animate-pulse"
            />
          )}

          {/* 節點主體圓 */}
          <circle
            cx={rNode.x}
            cy={rNode.y}
            r="20"
            fill={
              isFoundTarget
                ? "#15803d"
                : isCurrent
                ? "#d97706"
                : isVisited
                ? "#f59e0b"
                : "#ffffff"
            }
            stroke={
              isFoundTarget
                ? "#166534"
                : isCurrent || isVisited
                ? "#b45309"
                : "#334155"
            }
            strokeWidth="2.5"
            className="cursor-pointer hover:opacity-90 transition-colors"
            onClick={() => {
              setSearchCallNo(String(cNo));
              handleSearch(cNo);
            }}
          />

          {/* 走訪次序標記 */}
          {isVisited && (
            <text
              x={rNode.x + 20}
              y={rNode.y - 12}
              fontSize="10"
              fontWeight="bold"
              fill={isFoundTarget ? "#15803d" : "#b45309"}
              fontFamily="monospace"
            >
              #{stepOrder + 1}
            </text>
          )}

          {/* cur 游標標記 */}
          {isCurrent && (
            <text
              x={rNode.x}
              y={rNode.y - 25}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill="#b45309"
              fontFamily="monospace"
            >
              cur ↓
            </text>
          )}

          {/* 索書號數字 */}
          <text
            x={rNode.x}
            y={rNode.y + 4}
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fontFamily="monospace"
            fill={isVisited || isCurrent || isFoundTarget ? "#ffffff" : "#0f172a"}
            pointerEvents="none"
          >
            {cNo}
          </text>

          {/* 書名標籤 */}
          <text
            x={rNode.x}
            y={rNode.y + 33}
            textAnchor="middle"
            fontSize="11"
            fill="#334155"
            fontWeight="500"
            pointerEvents="none"
          >
            {rNode.node.title}
          </text>
        </g>
        {renderNodes(rNode.left)}
        {renderNodes(rNode.right)}
      </React.Fragment>
    );
  };

  const allInorder = campus.books.inorder();
  const treeHeight = campus.books.height();

  return (
    <div className="space-y-6">
      {/* 模組標題與規格導讀 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 tracking-wide uppercase">
            <span>Data Structure 2</span>
            <span aria-hidden="true">·</span>
            <span>二元搜尋樹 (BST)</span>
            <span aria-hidden="true">·</span>
            <span>平均 O(log n) 檢索</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            圖書館索書號檢索與三序走訪視覺化 (Binary Search Tree)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            左子樹 &lt; 根節點 &lt; 右子樹。透過逐步搜尋動畫與前序/中序/後序走訪演示，徹底理解二元樹的分治與排序原理。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="bg-slate-100 px-3 py-1.5 rounded text-xs text-slate-700 font-mono">
            節點數: <strong className="text-slate-900">{allInorder.length}</strong> · 樹高: <strong className="text-slate-900">{treeHeight}</strong>
          </div>
          <button
            onClick={() => setShowTextTree(!showTextTree)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{showTextTree ? "切換至樹狀畫布" : "檢視文字樹格式"}</span>
          </button>
        </div>
      </div>

      {/* 互動區 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左側：控制面板 */}
        <div className="lg:col-span-5 space-y-4">
          {/* 搜尋書籍 Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-700" />
              <span>動畫檢索索書號 (search_book)</span>
            </h3>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={searchCallNo}
                  onChange={(e) => setSearchCallNo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="輸入索書號，例如 210 或 999"
                  className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <button
                  onClick={() => handleSearch()}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors whitespace-nowrap"
                >
                  逐步搜尋
                </button>
              </div>

              {/* 常用測試索書號快捷鍵 */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>點擊立即演示：</span>
                {[
                  { label: "210 (命中3步)", val: "210" },
                  { label: "999 (未找到2步)", val: "999" },
                  { label: "305 (樹根1步)", val: "305" },
                  { label: "102 (左樹2步)", val: "102" },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      setSearchCallNo(item.val);
                      handleSearch(parseInt(item.val, 10));
                    }}
                    className="text-xs text-slate-700 hover:text-emerald-700 underline font-mono"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 三種二元樹走訪動畫演練 Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-emerald-700" />
              <span>二元樹走訪順序動畫演示 (Tree Traversal)</span>
            </h3>
            <p className="text-xs text-slate-600">
              點選不同走訪策略，觀察節點被拜訪的先後次序與輸出序列差異：
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleRunTraversal("inorder")}
                className={`p-2 rounded border text-xs transition-colors text-center ${
                  traceMode === "inorder"
                    ? "bg-emerald-700 text-white border-emerald-700 font-semibold"
                    : "bg-slate-50 hover:bg-emerald-50 text-slate-800 border-slate-200"
                }`}
              >
                <div>中序 In-order</div>
                <div className="text-[10px] opacity-80 font-mono mt-0.5">左 → 根 → 右</div>
              </button>
              <button
                onClick={() => handleRunTraversal("preorder")}
                className={`p-2 rounded border text-xs transition-colors text-center ${
                  traceMode === "preorder"
                    ? "bg-emerald-700 text-white border-emerald-700 font-semibold"
                    : "bg-slate-50 hover:bg-emerald-50 text-slate-800 border-slate-200"
                }`}
              >
                <div>前序 Pre-order</div>
                <div className="text-[10px] opacity-80 font-mono mt-0.5">根 → 左 → 右</div>
              </button>
              <button
                onClick={() => handleRunTraversal("postorder")}
                className={`p-2 rounded border text-xs transition-colors text-center ${
                  traceMode === "postorder"
                    ? "bg-emerald-700 text-white border-emerald-700 font-semibold"
                    : "bg-slate-50 hover:bg-emerald-50 text-slate-800 border-slate-200"
                }`}
              >
                <div>後序 Post-order</div>
                <div className="text-[10px] opacity-80 font-mono mt-0.5">左 → 右 → 根</div>
              </button>
            </div>
          </div>

          {/* 新增館藏 Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-slate-700" />
              <span>新增館藏書籍 (add_book)</span>
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    索書號 (call_no 整數)
                  </label>
                  <input
                    type="number"
                    value={newCallNo}
                    onChange={(e) => setNewCallNo(e.target.value)}
                    placeholder="例如 500"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    書名 (title)
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddBook()}
                    placeholder="例如 佛光文選"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                onClick={() => handleAddBook()}
                className="w-full py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors"
              >
                插入至二元搜尋樹
              </button>

              {/* 快速插入測試資料 */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 block mb-1">快捷新增 / 邊界測試：</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleAddBook(150, "資料庫系統")}
                    className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                  >
                    + 150 資料庫系統
                  </button>
                  <button
                    onClick={() => handleAddBook(380, "作業系統")}
                    className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                  >
                    + 380 作業系統
                  </button>
                  <button
                    onClick={() => handleAddBook(305, "重複書籍")}
                    title="測試重複索書號錯誤 (duplicate call_no)"
                    className="px-2 py-1 text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-mono"
                  >
                    [測試重複] 305
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 反饋通知 */}
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

        {/* 右側：BST 視覺化樹形圖 + 逐步程式碼追蹤 */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {showTextTree ? "二元搜尋樹文字縮排結構" : "二元搜尋樹視覺化拓撲圖 (點擊節點可動畫檢索)"}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                <span>left &lt; root &lt; right</span>
              </div>
            </div>

            {showTextTree ? (
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                {campus.books.toTextTree()}
              </pre>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 overflow-x-auto min-h-[280px] flex items-center justify-center">
                {!rootLayout ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    目前尚未新增任何館藏。請在左側點擊「新增館藏書籍」建立樹根節點。
                  </div>
                ) : (
                  <svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    className="select-none"
                  >
                    {renderLines(rootLayout)}
                    {renderNodes(rootLayout)}
                  </svg>
                )}
              </div>
            )}

            {/* 即時走訪輸出序列（於走訪模式或中序列表時顯示） */}
            {activeStep?.traversalOutput && activeStep.traversalOutput.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
                  <span>
                    當前已走訪輸出序列 ({activeStep.traversalOutput.length} 筆)：
                  </span>
                  <span className="text-emerald-700 font-mono font-semibold">
                    {traceMode === "inorder"
                      ? "In-Order (左→根→右：自然遞增)"
                      : traceMode === "preorder"
                      ? "Pre-Order (根→左→右)"
                      : "Post-Order (左→右→根)"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeStep.traversalOutput.map((b, i) => (
                    <div
                      key={b.call_no}
                      className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded text-xs flex items-center gap-1.5"
                    >
                      <span className="text-[10px] text-emerald-700 font-mono">#{i + 1}</span>
                      <span className="font-mono font-bold text-slate-900">{b.call_no}</span>
                      <span className="text-slate-600">{b.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 逐步動畫與程式碼追蹤器 */}
          {traceSteps.length > 0 ? (
            <LiveCodeTracer
              title={
                traceMode === "search"
                  ? "BST 二元搜尋比較動畫追蹤"
                  : `BST ${traceMode.toUpperCase()} 遞迴走訪動畫追蹤`
              }
              codeLines={
                traceMode === "search"
                  ? BST_SEARCH_CODE
                  : BST_TRAVERSAL_CODE[traceMode]
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
              title="BST 二元搜尋演算法追蹤器"
              codeLines={BST_SEARCH_CODE}
              activeLine={2}
              stepDescription="提示：點擊左側「逐步搜尋」、「中序/前序/後序走訪」，或直接點擊畫布上的任一書籍節點，即可啟動逐步動畫追蹤！"
            />
          )}
        </div>
      </div>
    </div>
  );
};
