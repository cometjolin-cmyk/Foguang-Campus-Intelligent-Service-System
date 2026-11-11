/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 佛光校園智慧服務系統 - 工程化提示詞設計與原始碼資料
 */

export const PYTHON_SOURCE_CODE = `"""佛光校園智慧服務系統：Queue + BST + Linked List + Stack"""
import json, re
from collections import deque


class BookNode:                         # BST 節點：索書號 -> 書名
    def __init__(self, call_no, title):
        self.call_no, self.title = call_no, title
        self.left = self.right = None


class BookBST:
    def __init__(self):
        self.root = None

    def insert(self, call_no, title):
        """插入索書號；重複回傳 False。平均 O(log n)"""
        if self.root is None:
            self.root = BookNode(call_no, title)
            return True
        cur = self.root
        while True:
            if call_no == cur.call_no:
                return False
            side = "left" if call_no < cur.call_no else "right"
            nxt = getattr(cur, side)
            if nxt is None:
                setattr(cur, side, BookNode(call_no, title))
                return True
            cur = nxt

    def search(self, call_no):
        """回傳 (節點或 None, 比較次數)。平均 O(log n)"""
        cur, steps = self.root, 0
        while cur:
            steps += 1
            if call_no == cur.call_no:
                return cur, steps
            cur = cur.left if call_no < cur.call_no else cur.right
        return None, steps

    def inorder(self, node="root"):
        """中序走訪：由小到大。O(n)"""
        if node == "root":
            node = self.root
        if node is None:
            return []
        return (self.inorder(node.left) + [(node.call_no, node.title)]
                + self.inorder(node.right))


class EventNode:                         # 鏈結串列節點：一筆行程
    def __init__(self, day, time, location, event):
        self.day, self.time = day, time
        self.location, self.event = location, event
        self.next = None

    def text(self):
        return f"{self.day} {self.time} {self.location}（{self.event}）"


class Schedule:
    """單向鏈結串列：個人行事曆"""
    def __init__(self):
        self.head = None

    def insert(self, node, position=None):
        """position 為 None 加到尾端 O(n)；否則插入到第 position 個位置 (0 起算)。"""
        if position is None or self.head is None:
            if self.head is None:
                self.head = node
            else:
                cur = self.head
                while cur.next:
                    cur = cur.next
                cur.next = node
            return True
        if position == 0:
            node.next, self.head = self.head, node
            return True
        cur = self.head
        for _ in range(position - 1):
            cur = cur.next
            if cur is None:
                return False            # 位置超出串列長度
        node.next, cur.next = cur.next, node
        return True

    def all_events(self):
        """從 head 依序走訪全部行程。O(n)"""
        out, cur = [], self.head
        while cur:
            out.append(cur)
            cur = cur.next
        return out

    def by_day(self, day):
        """走訪並過濾某一天的行程。O(n)"""
        return [n for n in self.all_events() if n.day == day]


class Campus:
    def __init__(self):
        self.rooms = deque()            # 佇列：討論室預約（先進先出）
        self.ticket_no = 0
        self.books = BookBST()          # 二元搜尋樹：索書號
        self.calendars = {}             # 學號 -> 鏈結串列（行事曆）
        self.pages = ["首頁"]            # 堆疊：導覽 APP 頁面

    def handle(self, req):
        try:
            return getattr(self, "_" + req["cmd"])(req)
        except (KeyError, AttributeError, TypeError):
            return {"status": "error", "message": "invalid command or missing field"}

    def _reserve(self, r):
        self.ticket_no += 1
        ticket = f"Q-{self.ticket_no:03d}"
        self.rooms.append((ticket, r["student_id"]))
        return {"status": "ok", "ticket": ticket, "ahead": len(self.rooms) - 1}

    def _call_next(self, r):
        if not self.rooms:
            return {"status": "error", "message": "no one waiting"}
        ticket, sid = self.rooms.popleft()
        return {"status": "ok", "ticket": ticket, "student_id": sid}

    def _add_book(self, r):
        if not isinstance(r["call_no"], int):
            return {"status": "error", "message": "call_no must be int"}
        if not self.books.insert(r["call_no"], r["title"]):
            return {"status": "error", "message": "duplicate call_no"}
        return {"status": "ok"}

    def _search_book(self, r):
        node, steps = self.books.search(r["call_no"])
        if node is None:
            return {"status": "error", "message": "not found", "steps": steps}
        return {"status": "ok", "title": node.title, "steps": steps}

    def _list_books(self, r):
        return {"status": "ok",
                "books": [{"call_no": c, "title": t} for c, t in self.books.inorder()]}

    DAYS = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"]

    def _add_event(self, r):
        if r["day"] not in self.DAYS or not re.fullmatch(r"([01]\\d|2[0-3]):[0-5]\\d", r["time"]):
            return {"status": "error", "message": "invalid day or time"}
        node = EventNode(r["day"], r["time"], r["location"], r["event"])
        cal = self.calendars.setdefault(r["student_id"], Schedule())
        if not cal.insert(node, r.get("position")):
            return {"status": "error", "message": "position out of range"}
        return {"status": "ok", "total": len(cal.all_events())}

    def _show_schedule(self, r):
        cal = self.calendars.get(r["student_id"])
        if cal is None:
            return {"status": "error", "message": "no record"}
        nodes = cal.all_events()
        return {"status": "ok", "timeline": " → ".join(n.text() for n in nodes)}

    def _query_day(self, r):
        cal = self.calendars.get(r["student_id"])
        if cal is None:
            return {"status": "error", "message": "no record"}
        return {"status": "ok", "day": r["day"],
                "events": [{"time": n.time, "location": n.location, "event": n.event}
                           for n in cal.by_day(r["day"])]}

    def _visit(self, r):
        self.pages.append(r["page"])    # push
        return {"status": "ok", "current": self.pages[-1]}

    def _back(self, r):
        if len(self.pages) == 1:
            return {"status": "error", "message": "already at home"}
        self.pages.pop()                # pop
        return {"status": "ok", "current": self.pages[-1]}


if __name__ == "__main__":
    app = Campus()
    with open("test_input.json", encoding="utf-8") as f:
        for req in json.load(f):
            print(json.dumps(app.handle(req), ensure_ascii=False))
`;

export interface PromptSection {
  id: string;
  letter: string;
  title: string;
  subtitle: string;
  keyPoints: string[];
  content: string;
  codeSnippet?: string;
}

export const PROMPT_ENGINEERING_SECTIONS: PromptSection[] = [
  {
    id: "system-prompt",
    letter: "a",
    title: "系統提示詞設計 (System Prompt)",
    subtitle: "角色賦予、硬性規則約束與輸出格式控制",
    keyPoints: [
      "精確角色：資深 Python 工程師兼資料結構助教",
      "硬性規則 1：Queue 用 collections.deque，Stack 用 list 的 append/pop",
      "硬性規則 2：BST 與 Linked List 必須自行實作節點類別 (BookNode, EventNode)",
      "硬性規則 3：每個函式附型別說明、一行 docstring，並標註時間複雜度",
      "硬性規則 4：輸入輸出純 JSON，捕捉所有異常回傳 status=error，不得崩潰",
    ],
    content: `系統提示詞（System Prompt）是引導大型語言模型產出符合專案規格的核心錨點。
在設計本系統時，確立了助教與資深工程師角色，嚴格限定禁止使用 Python 內建 sorted 或 dict 偷懶取代 BST 與 Linked List，並嚴令採用防御性編程 (Defensive Programming)。`,
    codeSnippet: `你是一位資深 Python 工程師兼資料結構助教。
【目標】依使用者規格撰寫可直接執行的 Python 3 程式「佛光校園智慧服務系統」。
【硬性規則】
1. 佇列使用 collections.deque；堆疊使用 list 的 append/pop；二元搜尋樹與鏈結串列必須自行實作節點類別，不可用現成的排序容器取代。
2. 每個函式附型別或參數說明與一行 docstring，並標註時間複雜度。
3. 輸入輸出只能是規格指定的 JSON；缺欄位、指令不存在、型別錯誤時回傳 status=error，不可拋出例外。
4. 先輸出「資料結構對照說明」，再輸出單一 .py 程式碼，最後輸出測試資料與預期輸出。
5. 不確定的需求先列出假設，不要自行增加功能。`,
  },
  {
    id: "few-shot",
    letter: "b",
    title: "Few-shot 少樣本範例引導",
    subtitle: "藉由具體輸入輸出示範校正模型邊界情境判斷",
    keyPoints: [
      "範例 1 示範 Queue 預約成功欄位（ticket, ahead）",
      "範例 2 示範 BST 索書號重複時的標準錯誤處理（duplicate call_no）",
      "範例 3 示範 Stack 在首頁返回時的狀態防禦（already at home）",
    ],
    content: `Few-shot 能大幅減少模型在 JSON key 名稱與錯誤訊息上的幻覺（Hallucination）。
透過 3 組高對比的正常與邊界情境，讓模型立即掌握回傳 {"status":"ok"} 與 {"status":"error","message":...} 的結構一致性。`,
    codeSnippet: `# 範例 1（佇列：正常預約）
輸入：{"cmd":"reserve","student_id":"S1001"}
輸出：{"status":"ok","ticket":"Q-001","ahead":0}

# 範例 2（BST：重複索書號邊界）
輸入：{"cmd":"add_book","call_no":305,"title":"重複"}
輸出：{"status":"error","message":"duplicate call_no"}

# 範例 3（堆疊：已在首頁邊界）
輸入：{"cmd":"back"}
輸出：{"status":"error","message":"already at home"}`,
  },
  {
    id: "rag-long-context",
    letter: "c",
    title: "長上下文 / RAG (檢索增強生成)",
    subtitle: "語意標籤劃分演算法規格與精確知識庫檢索",
    keyPoints: [
      "長上下文：使用 <context>、<spec>、<task> 標籤嚴格隔離參考教材與指令",
      "RAG 檢索：切分 500 字知識片段，提問時檢索 Top-2~3 關聯段落注入 Prompt",
      "零幻覺防護：限制「只依據檢索內容回答，查無資料直接回覆不知道」",
    ],
    content: `當系統涉及多種資料結構演算法（BST 走訪、單向串列指標變換）時：
1. 長上下文策略將課堂偽代碼置於 <context> 區塊，確保模型實作演算法與講義完全一致。
2. RAG 知識庫則索引了圖書館分類號系統、JSON Schema 規範與邊界條件，供自動生成單元測試與排錯。`,
    codeSnippet: `<context>
class BookNode:
    def __init__(self, call_no, title):
        self.call_no = call_no
        self.title = title
        self.left = None
        self.right = None
# BST 插入：小於往左，大於往右，等於回傳 False
</context>

<spec>
以 JSON 為輸入與輸出格式。指令包括 reserve, call_next, add_book, search_book, list_books, add_event, show_schedule, query_day, visit, back。
</spec>

<task>
請根據 context 與 spec 實作 Campus 類別。
</task>`,
  },
  {
    id: "external-tools",
    letter: "d",
    title: "外部工具與標準函式庫限定",
    subtitle: "標準庫純潔性、SQLite 持久化、視覺化與 LLM Function Calling",
    keyPoints: [
      "核心約束：限定使用 Python 3 標準函式庫 (collections.deque, json, re)",
      "選用持久化：使用 sqlite3 支援 load_books() 與 save_books() 參數化查詢",
      "選用視覺化：透過 visualize.py (graphviz, matplotlib) 繪製 BST 拓撲結構",
      "LLM 銜接：利用 Function Calling 將自然語言轉為標準 JSON 指令呼叫 Campus.handle()",
    ],
    content: `為了確保程式碼在任何沒有網路或特殊環境的受測機器上均能 100% 正確執行，提示詞限定核心演算法只能引用標準庫，視覺化與持久化模組解耦為獨立工具。`,
    codeSnippet: `# Function Calling Tools 範例 (自然語言 -> JSON 指令)
tools = [
  {
    "type": "function",
    "function": {
      "name": "reserve",
      "description": "學生預約圖書館或雲起樓討論室",
      "parameters": {
        "type": "object",
        "properties": {
          "student_id": {"type": "string", "description": "佛光大學學號例如 S1001"}
        },
        "required": ["student_id"]
      }
    }
  }
]`,
  },
  {
    id: "structured-io",
    letter: "e",
    title: "結構化輸入/輸出 (JSON Schema 驗證)",
    subtitle: "嚴格型別約束與輸出自動重試機制",
    keyPoints: [
      "嚴格規範 JSON Schema，限制 additionalProperties: false",
      "強制指定欄位型別（例如 call_no 為 integer，day 必須在合法星期內）",
      "程式端以 json.loads 與 jsonschema 雙重驗證",
    ],
    content: `透過給定嚴謹的 JSON Schema，模型不會吐出多餘的 Markdown 或寒暄，並在欄位缺失時立即在第一時間捕獲。`,
    codeSnippet: `{
  "type": "object",
  "required": ["cmd", "call_no", "title"],
  "properties": {
    "cmd": { "const": "add_book" },
    "call_no": { "type": "integer", "minimum": 0 },
    "title": { "type": "string", "minLength": 1 }
  },
  "additionalProperties": false
}`,
  },
  {
    id: "testing-verification",
    letter: "f",
    title: "生成測試資料與手算驗證",
    subtitle: "30 筆測試案例覆蓋常態與全邊界情境，手算推導比較次數與時間軸",
    keyPoints: [
      "佇列驗證：Q-001、Q-002 叫號後空佇列回傳 no one waiting",
      "BST 驗證：305 樹根，搜尋 210 比對 3 次，搜尋 999 比對 2 次未找到",
      "中序走訪：自動由小到大列出 102, 210, 305, 410",
      "鏈結串列驗證：position=2 插入正確位置，格式 25:00 與 position=9 攔截",
      "堆疊驗證：首頁 -> 圖書館 -> 預約頁，連續返回至首頁觸發 already at home",
    ],
    content: `測試資料涵蓋正常路徑與極端邊界（空佇列、重複 key、超時格式、越界索引、堆疊下溢、無效指令）。
透過手算推導 steps 與 timeline，驗證結果完全精確符合理論預期。`,
    codeSnippet: `# 搜尋 210 比較過程推導：
第 1 次：比較根節點 305，210 < 305 -> 往左走
第 2 次：比較節點 102，210 > 102 -> 往右走
第 3 次：比較節點 210，210 == 210 -> 找到！回傳 steps=3`,
  },
  {
    id: "iterative-refinement",
    letter: "g",
    title: "反覆修正心法 (4 輪迭代)",
    subtitle: "單輪一事、先診斷後修改、全量回歸測試防退化",
    keyPoints: [
      "第 1 輪 (基本版)：驗證 BST 與鏈結串列是否親手實作節點類別",
      "第 2 輪 (錯誤處理)：修補缺漏欄位與無效指令時的例外捕捉，保證不中斷",
      "第 3 輪 (邊界與型別)：針對 25:00 時間、超出長度 position、重複 call_no 實作嚴格校驗",
      "第 4 輪 (可讀性與註釋)：全函式補充 docstring、時間複雜度標註與文字樹狀圖",
    ],
    content: `軟體工程原則：「每次只修一個問題」。
每輪修正後重新執行 30 筆測試，確保舊功能完整未被破壞，程式碼結構清晰且穩固。`,
    codeSnippet: `# 迭代原則：
1. 每一輪只專注修復一個問題或補強一組邊界
2. 提示中附上失敗輸入與實際輸出，要求模型先說明根本原因
3. 重跑全量 30 筆測試集，確認通過率 100%`,
  },
  {
    id: "visualization",
    letter: "h",
    title: "可視化優化 (文字樹狀圖與圖形拓撲)",
    subtitle: "從終端機文字樹到現代化 Web 互動視覺沙盒",
    keyPoints: [
      "文字樹狀圖：縮排與「左/右」標記清晰呈現 BST 架構",
      "文字鏈結串列：以箭頭 ( → ) 串聯學生各堂課時程節點",
      "堆疊文字表示：底部至頂部管道 (首頁 | 圖書館 | 預約頁)",
      "佇列文字表示：進出方向 (Q-001 ← Q-002)",
      "現代化 Web 視覺化：SVG 動態節點動畫、即時路徑亮燈、仿真手機 App 體驗",
    ],
    content: `資料結構可視化能將 abstract logic 轉化為直觀感知。
本系統不僅提供完整的終端機文字印出格式，更實作了完整的互動視覺畫布。`,
    codeSnippet: `BST (索書號文字樹)：
305（資料結構）
  左 102（佛學概論）
    右 210（演算法）
  右 410（Python程式設計）

鏈結串列 (S1001 時間軸)：
週一 09:00 雲起樓 → 週二 14:00 圖書館 → 週二 18:00 雲起樓 → 週三 10:00 討論室 → 週三 15:30 雲起樓 → None`,
  },
];
