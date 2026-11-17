/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

type ModuleKey =
  | "overview"
  | "queue"
  | "bst"
  | "linkedlist"
  | "stack"
  | "tests"
  | "console"
  | "prompt"
  | "code";

interface HistoryMessage {
  role: "user" | "model";
  text: string;
}

interface AskTeacherBody {
  module?: ModuleKey;
  question?: string;
  history?: HistoryMessage[];
  contextSnapshot?: string;
}

const MODULE_CONTEXT_MAP: Record<ModuleKey, string> = {
  overview:
    "目前學生正在瀏覽「0. 知識原理總覽」，內容涵蓋佇列 (Queue)、堆疊 (Stack)、鏈結串列 (Linked List)、二元搜尋樹 (BST) 的記憶體配置對照與時間複雜度矩陣。",
  queue:
    "目前學生正在操作「1. 佇列 (Queue) 圖書館討論室預約叫號」沙盒。系統使用 Python collections.deque 實作 FIFO（先進先出），enqueue 使用 append() 於隊尾 (REAR)，dequeue 使用 popleft() 於隊首 (FRONT)，兩者皆為 O(1)。",
  bst:
    "目前學生正在操作「2. 二元搜尋樹 (BST) 圖書館索書號檢索與自動排序」沙盒。每個 BookNode 含 call_no、title、left、right，滿足左子樹 < 根 < 右子樹，平均搜尋/插入 O(log n)，支援前序、中序（由小到大排序）、後序三種走訪。",
  linkedlist:
    "目前學生正在操作「3. 鏈結串列 (Linked List) 校園個人化行事曆」沙盒。每個 EventNode 含 day、time、location、event 與 next 指標。支援頭部插入 O(1)、尾端加入 O(n)、指定位置插入（「先接 node.next = cur.next，後斷 cur.next = node」）與逐節點過濾查詢 query_day。",
  stack:
    "目前學生正在操作「4. 堆疊 (Stack) 校園導覽 APP 頁面歷史返回」沙盒。使用 Python list 實作 LIFO（後進先出），visit 使用 append() 壓棧 O(1)，back 使用 pop() 彈棧 O(1)，並設有棧底保護（只剩「首頁」時回傳 already at home 防止 Underflow）。",
  tests:
    "目前學生正在檢視「30 筆自動化規格測試驗證」頁面，逐筆驗證 reserve、call_next、add_book、search_book、list_books、add_event、show_schedule、query_day、visit、back 及各類邊界錯誤處理。",
  console:
    "目前學生正在使用「JSON 互動終端機」，可手動輸入 JSON 指令測試系統協定與無例外拋出的錯誤防護機制。",
  prompt:
    "目前學生正在閱讀「工程化提示詞手冊」，學習如何透過 System Prompt、Few-shot 範例、長上下文標籤隔離與 RAG 檢索來引導模型產出符合規格的資料結構程式。",
  code:
    "目前學生正在閱讀「Python 原始碼與測試檔 (campus.py)」，檢視完整的 Node 類別實作、時間複雜度標註與 JSON 命令分派架構。",
};

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function buildSystemInstruction(moduleKey: ModuleKey, contextSnapshot?: string): string {
  const moduleInfo = MODULE_CONTEXT_MAP[moduleKey] || MODULE_CONTEXT_MAP.overview;
  return [
    "你是「佛光校園智慧服務系統」的專屬 AI 資料結構老師（同時是一位親切、善於用生活比喻與視覺思維引導大學生的資訊系教授與助教）。",
    "請務必使用繁體中文（台灣常用技術術語）回答學生的提問。",
    "",
    "【教學原則】",
    "1. 針對學生目前所在的模組背景與畫面即時狀態精準回答，必要時引用該模組的佛光大學生活情境（如雲起樓討論室、圖書館索書號、個人行事曆、校園導覽返回鍵）。",
    "2. 說明由淺入深：先用 1～2 句直白核心結論破題，再補充步驟拆解、指標/記憶體變化或時間複雜度（Big-O）原因；若學生問比較問題或程式碼問題，可附上精簡的 Python 片段或步驟示意。",
    "3. 篇幅精煉好讀（建議 150～350 字以內，善用項目符號），避免冗長說教；在回答最後可附帶一句鼓勵嘗試的小練習或反問，引導學生回沙盒驗證。",
    "4. 排版清楚：請直接寫 `O(1)`、`O(log n)`、`O(n)`，不要使用 LaTeX `$...$` 錢字號語法。",
    "5. 絕對嚴格遵守事實：不要捏造系統沒有實作的功能或數據。",
    "",
    `【目前所在模組】\n${moduleInfo}`,
    contextSnapshot ? `\n【學生畫面目前即時資料狀態】\n${contextSnapshot}` : "",
  ].join("\n");
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw === "MISSING_API_KEY") {
    return {
      status: 503,
      message: "系統尚未偵測到 GEMINI_API_KEY，請於 Settings > Secrets 面板確認環境金鑰設定後再試。",
    };
  }
  if (raw.includes("403") || raw.includes("PERMISSION_DENIED") || raw.includes("API_KEY_INVALID")) {
    return {
      status: 403,
      message: "API 金鑰驗證失敗，請於 Settings > Secrets 面板檢查 GEMINI_API_KEY 是否有效。",
    };
  }
  if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      message: "AI 老師目前提問請求較多（配額暫時達上限），請稍候幾秒後再發問。",
    };
  }
  if (raw.includes("404") || raw.includes("NOT_FOUND")) {
    return {
      status: 404,
      message: "無法連接指定 AI 模型服務，請稍後重試。",
    };
  }
  return {
    status: 500,
    message: `AI 老師暫時無法回應，請稍後再試。（${raw.slice(0, 120)}）`,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  // AI 老師問答串流端點 (SSE)
  app.post("/api/ai-teacher/ask", async (req, res) => {
    const body = (req.body || {}) as AskTeacherBody;
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const moduleKey: ModuleKey =
      body.module && body.module in MODULE_CONTEXT_MAP ? body.module : "overview";
    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
    const contextSnapshot =
      typeof body.contextSnapshot === "string" ? body.contextSnapshot.slice(0, 1500) : undefined;

    if (!question) {
      res.status(400).json({ error: "請輸入想詢問 AI 老師的問題。" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const sendEvent = (payload: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      const ai = getAiClient();
      const contents = [
        ...history
          .filter((m) => m && typeof m.text === "string" && m.text.trim())
          .map((m) => ({
            role: m.role === "model" ? "model" : "user",
            parts: [{ text: m.text }],
          })),
        {
          role: "user",
          parts: [{ text: question }],
        },
      ];

      const stream = await ai.models.generateContentStream({
        model: "gemini-4-hydrogen",
        contents,
        config: {
          systemInstruction: buildSystemInstruction(moduleKey, contextSnapshot),
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          sendEvent({ text: chunk.text });
        }
      }

      sendEvent({ done: true });
      res.end();
    } catch (err) {
      const formatted = formatGeminiError(err);
      sendEvent({ error: formatted.message });
      res.end();
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
