/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BookNode, Campus, JsonResponse } from "../engine/campusCore";
import { Search, Plus, ListOrdered, CheckCircle2, AlertCircle, FileText } from "lucide-react";

interface BSTVisualizerProps {
  campus: Campus;
  onActionTriggered: () => void;
}

interface RenderNode {
  node: BookNode;
  x: number;
  y: number;
  left?: RenderNode | null;
  right?: RenderNode | null;
}

export const BSTVisualizer: React.FC<BSTVisualizerProps> = ({
  campus,
  onActionTriggered,
}) => {
  const [searchCallNo, setSearchCallNo] = useState("210");
  const [newCallNo, setNewCallNo] = useState("500");
  const [newTitle, setNewTitle] = useState("雲端運算架構");
  const [searchHighlightPath, setSearchHighlightPath] = useState<number[]>([]);
  const [searchResult, setSearchResult] = useState<JsonResponse | null>(null);
  const [inorderBooks, setInorderBooks] = useState<{ call_no: number; title: string }[] | null>(null);
  const [showTextTree, setShowTextTree] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // 1. 搜尋索書號
  const handleSearch = () => {
    const num = parseInt(searchCallNo, 10);
    if (isNaN(num)) {
      setFeedback({ type: "error", msg: "索書號必須為整數" });
      return;
    }

    const { node, steps, path } = campus.books.search(num);
    setSearchHighlightPath(path);

    if (node) {
      setSearchResult({ status: "ok", title: node.title, steps });
      setFeedback({
        type: "success",
        msg: `檢索成功！書名：《${node.title}》，比較次數 ${steps} 次`,
      });
    } else {
      setSearchResult({ status: "error", message: "not found", steps });
      setFeedback({
        type: "error",
        msg: `館藏未找到 (not found)，比對次數 ${steps} 次`,
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
      setSearchHighlightPath([callNum]);
    } else {
      setFeedback({
        type: "error",
        msg: `新增失敗：${res.message} (索書號重複)`,
      });
    }
    // 更新中序快照
    if (inorderBooks) {
      setInorderBooks(campus.books.inorder());
    }
    onActionTriggered();
  };

  // 3. 中序走訪
  const handleInorder = () => {
    const res = campus.handle({ cmd: "list_books" });
    setInorderBooks(res.books || []);
    setFeedback({
      type: "success",
      msg: `中序走訪完成（左子樹 → 根節點 → 右子樹），共輸出 ${res.books?.length || 0} 本書籍`,
    });
    onActionTriggered();
  };

  // 計算 SVG 樹節點坐標
  const buildTreeLayout = (): { rootLayout: RenderNode | null; width: number; height: number } => {
    if (!campus.books.root) return { rootLayout: null, width: 600, height: 260 };

    // 遞迴計算節點位置
    const layout = (
      node: BookNode | null,
      depth: number,
      leftBound: number,
      rightBound: number
    ): RenderNode | null => {
      if (!node) return null;
      const x = (leftBound + rightBound) / 2;
      const y = depth * 70 + 45;
      return {
        node,
        x,
        y,
        left: layout(node.left, depth + 1, leftBound, x),
        right: layout(node.right, depth + 1, x, rightBound),
      };
    };

    const rootLayout = layout(campus.books.root, 0, 40, 560);
    return { rootLayout, width: 600, height: 280 };
  };

  const { rootLayout, width, height } = buildTreeLayout();

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
              stroke="#94a3b8"
              strokeWidth="2"
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
              stroke="#94a3b8"
              strokeWidth="2"
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
    const isHighlighted = searchHighlightPath.includes(rNode.node.call_no);
    const stepIdx = searchHighlightPath.indexOf(rNode.node.call_no);
    const isTarget =
      searchResult?.status === "ok" &&
      rNode.node.call_no === parseInt(searchCallNo, 10);

    return (
      <React.Fragment key={`node-${rNode.node.call_no}`}>
        <g className="transition-all duration-300">
          {/* 外光暈 */}
          {isHighlighted && (
            <circle
              cx={rNode.x}
              cy={rNode.y}
              r="26"
              fill={isTarget ? "#dcfce7" : "#fef3c7"}
              className="animate-pulse"
            />
          )}

          {/* 節點主體圓 */}
          <circle
            cx={rNode.x}
            cy={rNode.y}
            r="20"
            fill={isTarget ? "#15803d" : isHighlighted ? "#d97706" : "#ffffff"}
            stroke={isTarget ? "#166534" : isHighlighted ? "#b45309" : "#334155"}
            strokeWidth="2.5"
            className="cursor-pointer hover:opacity-90 transition-colors"
            onClick={() => {
              setSearchCallNo(String(rNode.node.call_no));
            }}
          />

          {/* 比較順序標記 */}
          {isHighlighted && (
            <text
              x={rNode.x + 18}
              y={rNode.y - 12}
              fontSize="10"
              fontWeight="bold"
              fill="#b45309"
              fontFamily="monospace"
            >
              #{stepIdx + 1}
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
            fill={isHighlighted ? "#ffffff" : "#0f172a"}
            pointerEvents="none"
          >
            {rNode.node.call_no}
          </text>

          {/* 書名標籤 */}
          <text
            x={rNode.x}
            y={rNode.y + 32}
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
            圖書館索書號檢索與自動排序 (Binary Search Tree)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            以唯一整數索書號為鍵值，左子節點小於根節點、右子節點大於根節點；中序走訪即可由小到大列出館藏。
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowTextTree(!showTextTree)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{showTextTree ? "切換至樹狀畫布" : "檢視文字樹格式"}</span>
          </button>
          <button
            onClick={handleInorder}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors flex items-center gap-1.5"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>中序走訪 (list_books)</span>
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
              <span>檢索索書號 (search_book)</span>
            </h3>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={searchCallNo}
                  onChange={(e) => setSearchCallNo(e.target.value)}
                  placeholder="輸入索書號，例如 210 或 999"
                  className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors whitespace-nowrap"
                >
                  搜尋書籍
                </button>
              </div>

              {/* 常用測試索書號快捷鍵 */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>測試預設：</span>
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
                    }}
                    className="text-xs text-slate-700 hover:text-emerald-700 underline font-mono"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* 搜尋路徑比對推導說明 */}
              {searchHighlightPath.length > 0 && (
                <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                  <div className="font-semibold text-slate-800 mb-1">
                    走訪節點推導路徑 (比較次數 {searchHighlightPath.length} 步)：
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap font-mono">
                    {searchHighlightPath.map((cNo, idx) => (
                      <React.Fragment key={cNo}>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-bold">
                          步驟 {idx + 1}: {cNo}
                        </span>
                        {idx < searchHighlightPath.length - 1 && (
                          <span className="text-slate-400">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
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

              {/* 規格範例快速批次新增 */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 block mb-1">快速載入經典測試資料：</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleAddBook(305, "資料結構")}
                    className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                  >
                    305: 資料結構
                  </button>
                  <button
                    onClick={() => handleAddBook(102, "佛學概論")}
                    className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                  >
                    102: 佛學概論
                  </button>
                  <button
                    onClick={() => handleAddBook(410, "Python程式設計")}
                    className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                  >
                    410: Python程式設計
                  </button>
                  <button
                    onClick={() => handleAddBook(210, "演算法")}
                    className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                  >
                    210: 演算法
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
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{feedback.msg}</span>
              </div>
            </div>
          )}
        </div>

        {/* 右側：BST 視覺化樹形圖 / 文字樹狀圖 */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {showTextTree ? "二元搜尋樹文字縮排結構" : "二元搜尋樹視覺化拓撲圖 (BST Canvas)"}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                <span>左小右大</span>
                <span aria-hidden="true">·</span>
                <span>點擊節點可快速檢索</span>
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

            {/* 中序走訪排序結果清單 */}
            {inorderBooks && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
                  <span>中序走訪由小到大館藏清單 ({inorderBooks.length} 筆)：</span>
                  <span className="text-slate-400 font-mono">In-Order: Left → Root → Right</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {inorderBooks.map((b, i) => (
                    <div
                      key={b.call_no}
                      className="p-2 bg-emerald-50/60 border border-emerald-100 rounded text-xs"
                    >
                      <div className="text-[10px] text-emerald-800 font-mono">順序 #{i + 1}</div>
                      <div className="font-mono font-bold text-slate-900">{b.call_no}</div>
                      <div className="text-slate-600 truncate">{b.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 演算法複雜度手冊卡片 */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600">
            <div className="font-semibold text-slate-800 mb-1">演算法與複雜度解析：</div>
            <p>
              • <strong>二元搜尋樹 (BST)</strong> 規定：任一節點左子樹所有索書號皆小於該節點，右子樹皆大於該節點。<br />
              • <strong>搜尋/插入：</strong>平均時間複雜度為 <strong className="font-mono text-emerald-700">O(log n)</strong>，每次比較皆將搜尋區間減半；最差情況（退化為單向鏈）為 O(n)。<br />
              • <strong>中序走訪 (In-Order)：</strong>時間複雜度為 <strong className="font-mono text-emerald-700">O(n)</strong>，因自然遍歷順序滿足遞增，可由小到大自動輸出有序陣列。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
