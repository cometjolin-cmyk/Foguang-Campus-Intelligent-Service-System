/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 全模組通用 AI 資料結構老師講堂（連結後端 Gemini 串流 API）
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  X,
  Send,
  Trash2,
  Sparkles,
  Square,
  AlertCircle,
  MessageSquarePlus,
} from "lucide-react";

export type AiModuleId =
  | "overview"
  | "queue"
  | "bst"
  | "linkedlist"
  | "stack"
  | "tests"
  | "console"
  | "prompt"
  | "code";

export interface ModuleTeacherMeta {
  shortName: string;
  title: string;
  subtitle: string;
  starterQuestions: string[];
}

export const MODULE_TEACHER_META: Record<AiModuleId, ModuleTeacherMeta> = {
  overview: {
    shortName: "知識總覽",
    title: "資料結構知識原理總覽",
    subtitle: "比較 FIFO / LIFO / 指標串接與樹狀分治",
    starterQuestions: [
      "堆疊 (Stack) 和佇列 (Queue) 最大的差別是什麼？",
      "什麼時候該用鏈結串列，什麼時候用陣列比較好？",
      "為什麼二元搜尋樹的平均搜尋時間只要 O(log n)？",
    ],
  },
  queue: {
    shortName: "佇列 Queue",
    title: "佇列 (Queue) 討論室預約模組",
    subtitle: "FIFO 先進先出 · collections.deque",
    starterQuestions: [
      "為什麼 Python 要用 deque.popleft() 而不用 list.pop(0)？",
      "目前排隊的同學順序是怎麼運作的？誰會下一個被叫號？",
      "佇列已經空了還按下 call_next 會發生什麼事？",
    ],
  },
  bst: {
    shortName: "二元搜尋樹 BST",
    title: "二元搜尋樹 (BST) 索書號檢索模組",
    subtitle: "左小右大分治 · 前序/中序/後序走訪",
    starterQuestions: [
      "為什麼對 BST 做中序走訪 (In-order) 會由小到大自動排序？",
      "以我目前的樹為例，搜尋 210 為什麼要走這幾步？",
      "前序、中序、後序走訪各自有什麼實際用途？",
    ],
  },
  linkedlist: {
    shortName: "鏈結串列",
    title: "鏈結串列 (Linked List) 行事曆模組",
    subtitle: "head / cur / next 指標 · 動態插入",
    starterQuestions: [
      "在中間插入新節點為什麼要「先接後斷」？反過來會怎樣？",
      "head 指標和走訪用的 cur 指標有什麼差別？",
      "為什麼 query_day 查詢特定星期需要 O(n) 時間？",
    ],
  },
  stack: {
    shortName: "堆疊 Stack",
    title: "堆疊 (Stack) 導覽頁面返回模組",
    subtitle: "LIFO 後進先出 · Top / Base 保護",
    starterQuestions: [
      "為什麼已經在「首頁」時不能再 pop() 返回？什麼是 Underflow？",
      "瀏覽器上一頁、Ctrl+Z 復原和這個模組原理一樣嗎？",
      "為什麼 Stack 的 push 和 pop 時間複雜度都是 O(1)？",
    ],
  },
  tests: {
    shortName: "30 筆測試",
    title: "30 筆規格測試驗證模組",
    subtitle: "正常流程與邊界錯誤防護驗證",
    starterQuestions: [
      "為什麼測試集要刻意設計 25:00 和 pos=99 這類錯誤案例？",
      "這 30 筆測試案例之間有順序相依性嗎？",
      "系統如何做到輸入型別錯誤也不會拋出例外崩潰？",
    ],
  },
  console: {
    shortName: "JSON 終端機",
    title: "JSON 指令終端機模組",
    subtitle: "協定格式驗證與即時資料結構狀態",
    starterQuestions: [
      "每個 JSON 指令一定要帶 cmd 欄位嗎？缺漏會回傳什麼？",
      "可以幫我設計一組串接四個資料結構的測試指令嗎？",
      "add_event 的 position 省略和填 0 有什麼不同？",
    ],
  },
  prompt: {
    shortName: "提示詞工程",
    title: "工程化提示詞手冊模組",
    subtitle: "System Prompt · Few-shot · RAG",
    starterQuestions: [
      "為什麼要在 System Prompt 規定不可用內建排序取代 BST？",
      "Few-shot 範例放正確案例和邊界錯誤案例有什麼好處？",
      "長上下文標籤分隔與 RAG 檢索各自解決什麼問題？",
    ],
  },
  code: {
    shortName: "Python 源碼",
    title: "Python 原始碼與實作模組",
    subtitle: "campus.py 節點類別與時間複雜度",
    starterQuestions: [
      "可以幫我解釋 campus.py 中 BookBST.insert 的實作邏輯嗎？",
      "為什麼 Linked List 節點需要自己寫 EventNode 類別？",
      "handle() 函式是如何把所有例外攔截並轉成 error JSON 的？",
    ],
  },
};

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
}

/** 輕量格式化 AI 老師回覆：支援 ```code``` 區塊、`inline code`、**粗體** 與換行 */
function renderFormattedText(text: string): React.ReactNode {
  const codeBlockParts = text.split(/(```[\s\S]*?```)/g);

  return codeBlockParts.map((block, bIdx) => {
    if (block.startsWith("```") && block.endsWith("```")) {
      const inner = block.slice(3, -3).replace(/^[a-zA-Z0-9_-]+\n/, "");
      return (
        <pre
          key={bIdx}
          className="my-2 p-2.5 rounded-md bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-700"
        >
          <code>{inner.trim()}</code>
        </pre>
      );
    }

    const lines = block.split("\n");
    return (
      <div key={bIdx} className="space-y-1">
        {lines.map((line, lIdx) => {
          if (!line.trim()) {
            return <div key={lIdx} className="h-1" />;
          }
          // 處理 **粗體**、`inline code` 與簡易 $O(...)$
          const normalizedLine = line.replace(/\$([^$\n]{1,30})\$/g, "`$1`");
          const inlineParts = normalizedLine.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
          return (
            <p key={lIdx} className="leading-relaxed">
              {inlineParts.map((seg, sIdx) => {
                if (seg.startsWith("**") && seg.endsWith("**")) {
                  return (
                    <strong key={sIdx} className="font-bold text-slate-950">
                      {seg.slice(2, -2)}
                    </strong>
                  );
                }
                if (seg.startsWith("`") && seg.endsWith("`")) {
                  return (
                    <code
                      key={sIdx}
                      className="px-1 py-0.5 mx-0.5 rounded bg-slate-200/80 text-slate-900 font-mono text-[11px]"
                    >
                      {seg.slice(1, -1)}
                    </code>
                  );
                }
                return <React.Fragment key={sIdx}>{seg}</React.Fragment>;
              })}
            </p>
          );
        })}
      </div>
    );
  });
}

interface AiTeacherPromptBarProps {
  moduleId: AiModuleId;
  onOpenWithQuestion: (question?: string) => void;
}

/** 嵌入式模組發問導引列：出現在當前頁面中，讓學生隨時直接點題發問 */
export const AiTeacherPromptBar: React.FC<AiTeacherPromptBarProps> = ({
  moduleId,
  onOpenWithQuestion,
}) => {
  const meta = MODULE_TEACHER_META[moduleId];
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
          <GraduationCap className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <span>AI 資料結構老師 · {meta.shortName}隨堂解惑</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            對目前的原理、指標步驟或即時數據有疑問嗎？點擊建議問題或自由發問。
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        {meta.starterQuestions.slice(0, 2).map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onOpenWithQuestion(q)}
            className="px-2.5 py-1.5 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-amber-50 hover:text-amber-900 border border-slate-200 hover:border-amber-300 rounded-md transition-colors text-left max-w-[260px] truncate"
            title={q}
          >
            {q}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onOpenWithQuestion()}
          className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span>問 AI 老師</span>
        </button>
      </div>
    </div>
  );
};

interface AiTeacherDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: AiModuleId;
  contextSnapshot: string;
  pendingQuestion: string | null;
  onClearPendingQuestion: () => void;
}

export const AiTeacherDrawer: React.FC<AiTeacherDrawerProps> = ({
  isOpen,
  onClose,
  moduleId,
  contextSnapshot,
  pendingQuestion,
  onClearPendingQuestion,
}) => {
  const meta = MODULE_TEACHER_META[moduleId];
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({});
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showStarters, setShowStarters] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const currentMessages = conversations[moduleId] || [];

  // 自動捲動至最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, isStreaming, isOpen]);

  // 開啟抽屜時聚焦輸入框
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 180);
    }
  }, [isOpen, moduleId]);

  const sendQuestion = async (rawQuestion: string) => {
    const trimmed = rawQuestion.trim();
    if (!trimmed || isStreaming) return;

    setErrorMsg(null);
    setShowStarters(false);
    setInputValue("");

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    const modelMsgId = `m-${Date.now() + 1}`;
    const historyForApi = (conversations[moduleId] || []).map((m) => ({
      role: m.role,
      text: m.text,
    }));

    setConversations((prev) => ({
      ...prev,
      [moduleId]: [...(prev[moduleId] || []), userMsg, { id: modelMsgId, role: "model", text: "" }],
    }));

    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    try {
      const response = await fetch("/api/ai-teacher/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: moduleId,
          question: trimmed,
          history: historyForApi,
          contextSnapshot,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errText = `請求失敗 (HTTP ${response.status})`;
        try {
          const errJson = await response.json();
          if (errJson?.error) errText = errJson.error;
        } catch {
          // ignore JSON parse failure
        }
        throw new Error(errText);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("無法讀取串流回應");

      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const chunkLine of lines) {
          const trimmedLine = chunkLine.trim();
          if (!trimmedLine.startsWith("data:")) continue;
          const jsonStr = trimmedLine.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const payload = JSON.parse(jsonStr) as {
              text?: string;
              error?: string;
              done?: boolean;
            };
            if (payload.error) {
              setErrorMsg(payload.error);
            } else if (payload.text) {
              setConversations((prev) => ({
                ...prev,
                [moduleId]: (prev[moduleId] || []).map((msg) =>
                  msg.id === modelMsgId
                    ? { ...msg, text: msg.text + payload.text }
                    : msg
                ),
              }));
            }
          } catch {
            // ignore incomplete SSE chunk
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // User stopped streaming manually
      } else {
        const message = err instanceof Error ? err.message : "連線 AI 老師失敗，請稍後再試";
        setErrorMsg(message);
        // Remove empty placeholder message if nothing was generated
        setConversations((prev) => ({
          ...prev,
          [moduleId]: (prev[moduleId] || []).filter(
            (m) => m.id !== modelMsgId || m.text.trim().length > 0
          ),
        }));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  // 若透過快捷提問按鈕開啟，自動送出該問題
  useEffect(() => {
    if (isOpen && pendingQuestion) {
      const q = pendingQuestion;
      onClearPendingQuestion();
      sendQuestion(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pendingQuestion]);

  const handleStopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const handleClearModuleChat = () => {
    if (isStreaming) handleStopStreaming();
    setErrorMsg(null);
    setConversations((prev) => ({
      ...prev,
      [moduleId]: [],
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩（點擊關閉） */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-[1px]"
          />

          {/* 右側滑出式 AI 老師講堂 */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col"
            aria-label="AI 資料結構老師"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white px-4 py-3.5 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>AI 資料結構老師</span>
                    <span className="text-[11px] font-medium text-amber-400">
                      · {meta.shortName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {meta.subtitle}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {currentMessages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearModuleChat}
                    title="清空本模組對話紀錄"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  title="關閉 AI 老師視窗"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 即時系統狀態情境條 */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-mono flex items-center justify-between gap-2">
              <span className="truncate" title={contextSnapshot}>
                即時畫面：{contextSnapshot}
              </span>
            </div>

            {/* 對話內容區 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {currentMessages.length === 0 ? (
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>你好！我是「{meta.title}」的隨堂老師</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      我可以根據你目前在畫面上操作的即時資料狀態，替你講解資料結構原理、指標移動原因、時間複雜度或 Python 實作細節。
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-500 px-1">
                      點選下列常見疑問立即發問：
                    </div>
                    {meta.starterQuestions.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => sendQuestion(q)}
                        className="w-full text-left p-3 rounded-lg bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-xs text-slate-800 transition-colors flex items-center justify-between gap-2 group"
                      >
                        <span className="leading-relaxed">{q}</span>
                        <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[88%] rounded-lg px-3.5 py-2.5 text-xs shadow-xs ${
                          msg.role === "user"
                            ? "bg-slate-900 text-white"
                            : "bg-white border border-slate-200 text-slate-800"
                        }`}
                      >
                        {msg.role === "model" && (
                          <div className="text-[10px] font-bold text-amber-700 mb-1 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            <span>AI 老師解答</span>
                          </div>
                        )}
                        {msg.role === "user" ? (
                          <div className="whitespace-pre-wrap leading-relaxed">
                            {msg.text}
                          </div>
                        ) : msg.text ? (
                          renderFormattedText(msg.text)
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>老師正在思考並整理圖解說明...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}
            </div>

            {/* 展開建議問題小面板 */}
            {showStarters && currentMessages.length > 0 && (
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>本模組推薦延伸提問：</span>
                  <button
                    type="button"
                    onClick={() => setShowStarters(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    收合
                  </button>
                </div>
                <div className="space-y-1">
                  {meta.starterQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendQuestion(q)}
                      className="w-full text-left px-2.5 py-1.5 rounded bg-white hover:bg-amber-50 border border-slate-200 text-[11px] text-slate-700 truncate transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 輸入區 */}
            <div className="p-3 bg-white border-t border-slate-200 space-y-2">
              {currentMessages.length > 0 && (
                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => setShowStarters((s) => !s)}
                    className="text-slate-500 hover:text-amber-700 font-medium underline"
                  >
                    {showStarters ? "隱藏推薦問題" : "查看本模組推薦問題"}
                  </button>
                  <span className="text-slate-400">Enter 送出 · Shift+Enter 換行</span>
                </div>
              )}

              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  rows={2}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendQuestion(inputValue);
                    }
                  }}
                  placeholder={`輸入關於「${meta.shortName}」的問題...`}
                  disabled={isStreaming}
                  className="flex-1 resize-none px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-400 disabled:bg-slate-50"
                />
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={handleStopStreaming}
                    title="停止生成"
                    className="p-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors shrink-0"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => sendQuestion(inputValue)}
                    disabled={!inputValue.trim()}
                    title="送出提問"
                    className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-amber-400 transition-colors shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
