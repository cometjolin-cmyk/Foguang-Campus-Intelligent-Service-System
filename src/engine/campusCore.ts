/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 佛光校園智慧服務系統 - 核心資料結構引擎
 * 完整對照 Python campus.py 的邏輯與 JSON 協定
 */

// 1. 二元搜尋樹節點
export class BookNode {
  call_no: number;
  title: string;
  left: BookNode | null = null;
  right: BookNode | null = null;

  constructor(call_no: number, title: string) {
    this.call_no = call_no;
    this.title = title;
  }
}

// 二元搜尋樹 (BST) - 索書號檢索與自動排序
export class BookBST {
  root: BookNode | null = null;

  /** 插入索書號；重複回傳 false。平均 O(log n) */
  insert(call_no: number, title: string): boolean {
    if (this.root === null) {
      this.root = new BookNode(call_no, title);
      return true;
    }
    let cur = this.root;
    while (true) {
      if (call_no === cur.call_no) {
        return false;
      }
      if (call_no < cur.call_no) {
        if (cur.left === null) {
          cur.left = new BookNode(call_no, title);
          return true;
        }
        cur = cur.left;
      } else {
        if (cur.right === null) {
          cur.right = new BookNode(call_no, title);
          return true;
        }
        cur = cur.right;
      }
    }
  }

  /** 回傳 { node: BookNode | null, steps: number, path: number[] }。平均 O(log n) */
  search(call_no: number): { node: BookNode | null; steps: number; path: number[] } {
    let cur = this.root;
    let steps = 0;
    const path: number[] = [];
    while (cur !== null) {
      steps += 1;
      path.push(cur.call_no);
      if (call_no === cur.call_no) {
        return { node: cur, steps, path };
      }
      cur = call_no < cur.call_no ? cur.left : cur.right;
    }
    return { node: null, steps, path };
  }

  /** 中序走訪：由小到大。O(n) */
  inorder(node: BookNode | null = this.root): { call_no: number; title: string }[] {
    if (node === null) {
      return [];
    }
    return [
      ...this.inorder(node.left),
      { call_no: node.call_no, title: node.title },
      ...this.inorder(node.right),
    ];
  }

  /** 產生文字格式樹狀圖 */
  toTextTree(node: BookNode | null = this.root, indent: number = 0, prefix: string = ""): string {
    if (!node) return indent === 0 ? "（目前無館藏資料）" : "";
    let res = "";
    if (indent === 0) {
      res += `${node.call_no}（${node.title}）\n`;
    } else {
      res += `${"  ".repeat(indent)}${prefix} ${node.call_no}（${node.title}）\n`;
    }
    if (node.left) {
      res += this.toTextTree(node.left, indent + 1, "左");
    }
    if (node.right) {
      res += this.toTextTree(node.right, indent + 1, "右");
    }
    return res;
  }
}

// 2. 鏈結串列節點：一筆行程
export class EventNode {
  day: string;
  time: string;
  location: string;
  event: string;
  next: EventNode | null = null;

  constructor(day: string, time: string, location: string, event: string) {
    this.day = day;
    this.time = time;
    this.location = location;
    this.event = event;
  }

  text(): string {
    return `${this.day} ${this.time} ${this.location}（${this.event}）`;
  }
}

// 單向鏈結串列：個人行事曆
export class Schedule {
  head: EventNode | null = null;

  /** position 為 null/undefined 加到尾端 O(n)；否則插入到第 position 個位置 (0 起算) */
  insert(node: EventNode, position?: number): boolean {
    if (position === undefined || position === null || this.head === null) {
      if (this.head === null) {
        this.head = node;
      } else {
        let cur = this.head;
        while (cur.next !== null) {
          cur = cur.next;
        }
        cur.next = node;
      }
      return true;
    }

    if (position === 0) {
      node.next = this.head;
      this.head = node;
      return true;
    }

    let cur = this.head;
    for (let i = 0; i < position - 1; i++) {
      if (cur.next === null) {
        return false; // 位置超出串列長度
      }
      cur = cur.next;
    }

    node.next = cur.next;
    cur.next = node;
    return true;
  }

  /** 從 head 依序走訪全部行程。O(n) */
  allEvents(): EventNode[] {
    const out: EventNode[] = [];
    let cur = this.head;
    while (cur !== null) {
      out.push(cur);
      cur = cur.next;
    }
    return out;
  }

  /** 走訪並過濾某一天的行程。O(n) */
  byDay(day: string): EventNode[] {
    return this.allEvents().filter((n) => n.day === day);
  }
}

// 3. 校園核心系統 (Campus)
export interface JsonRequest {
  cmd?: string;
  student_id?: string;
  call_no?: any;
  title?: string;
  day?: string;
  time?: string;
  location?: string;
  event?: string;
  position?: number;
  page?: string;
  [key: string]: any;
}

export interface JsonResponse {
  status: "ok" | "error";
  message?: string;
  ticket?: string;
  student_id?: string;
  ahead?: number;
  title?: string;
  steps?: number;
  books?: { call_no: number; title: string }[];
  total?: number;
  timeline?: string;
  day?: string;
  events?: { time: string; location: string; event: string }[];
  current?: string;
  [key: string]: any;
}

export class Campus {
  // 佇列：討論室預約（先進先出 FIFO）
  rooms: { ticket: string; student_id: string }[] = [];
  ticket_no: number = 0;

  // 二元搜尋樹：索書號
  books: BookBST = new BookBST();

  // 學號 -> 鏈結串列（個人行事曆）
  calendars: Map<string, Schedule> = new Map();

  // 堆疊：導覽 APP 頁面歷史（後進先出 LIFO）
  pages: string[] = ["首頁"];

  static readonly DAYS = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];

  /** 處理單一請求 */
  handle(req: JsonRequest): JsonResponse {
    try {
      if (!req || typeof req !== "object" || !req.cmd) {
        return { status: "error", message: "invalid command or missing field" };
      }

      switch (req.cmd) {
        case "reserve":
          return this.reserve(req);
        case "call_next":
          return this.call_next(req);
        case "add_book":
          return this.add_book(req);
        case "search_book":
          return this.search_book(req);
        case "list_books":
          return this.list_books(req);
        case "add_event":
          return this.add_event(req);
        case "show_schedule":
          return this.show_schedule(req);
        case "query_day":
          return this.query_day(req);
        case "visit":
          return this.visit(req);
        case "back":
          return this.back(req);
        default:
          return { status: "error", message: "invalid command or missing field" };
      }
    } catch {
      return { status: "error", message: "invalid command or missing field" };
    }
  }

  // 1. 佇列操作
  private reserve(r: JsonRequest): JsonResponse {
    if (!r.student_id || typeof r.student_id !== "string") {
      return { status: "error", message: "invalid command or missing field" };
    }
    this.ticket_no += 1;
    const ticket = `Q-${String(this.ticket_no).padStart(3, "0")}`;
    this.rooms.push({ ticket, student_id: r.student_id });
    return {
      status: "ok",
      ticket,
      ahead: this.rooms.length - 1,
    };
  }

  private call_next(_r: JsonRequest): JsonResponse {
    if (this.rooms.length === 0) {
      return { status: "error", message: "no one waiting" };
    }
    const item = this.rooms.shift()!;
    return {
      status: "ok",
      ticket: item.ticket,
      student_id: item.student_id,
    };
  }

  // 2. BST 操作
  private add_book(r: JsonRequest): JsonResponse {
    if (typeof r.call_no !== "number" || !Number.isInteger(r.call_no)) {
      return { status: "error", message: "call_no must be int" };
    }
    if (typeof r.title !== "string" || !r.title) {
      return { status: "error", message: "invalid command or missing field" };
    }
    const ok = this.books.insert(r.call_no, r.title);
    if (!ok) {
      return { status: "error", message: "duplicate call_no" };
    }
    return { status: "ok" };
  }

  private search_book(r: JsonRequest): JsonResponse {
    if (typeof r.call_no !== "number" || !Number.isInteger(r.call_no)) {
      return { status: "error", message: "call_no must be int" };
    }
    const { node, steps } = this.books.search(r.call_no);
    if (!node) {
      return { status: "error", message: "not found", steps };
    }
    return { status: "ok", title: node.title, steps };
  }

  private list_books(_r: JsonRequest): JsonResponse {
    return {
      status: "ok",
      books: this.books.inorder(),
    };
  }

  // 3. 鏈結串列操作
  private add_event(r: JsonRequest): JsonResponse {
    if (!r.student_id || typeof r.student_id !== "string") {
      return { status: "error", message: "invalid command or missing field" };
    }
    if (!r.day || !Campus.DAYS.includes(r.day)) {
      return { status: "error", message: "invalid day or time" };
    }
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!r.time || typeof r.time !== "string" || !timeRegex.test(r.time)) {
      return { status: "error", message: "invalid day or time" };
    }
    if (!r.location || typeof r.location !== "string" || !r.event || typeof r.event !== "string") {
      return { status: "error", message: "invalid command or missing field" };
    }

    let pos: number | undefined = undefined;
    if (r.position !== undefined) {
      if (typeof r.position !== "number" || !Number.isInteger(r.position) || r.position < 0) {
        return { status: "error", message: "position out of range" };
      }
      pos = r.position;
    }

    const node = new EventNode(r.day, r.time, r.location, r.event);
    if (!this.calendars.has(r.student_id)) {
      this.calendars.set(r.student_id, new Schedule());
    }
    const cal = this.calendars.get(r.student_id)!;

    if (!cal.insert(node, pos)) {
      return { status: "error", message: "position out of range" };
    }

    return { status: "ok", total: cal.allEvents().length };
  }

  private show_schedule(r: JsonRequest): JsonResponse {
    if (!r.student_id || typeof r.student_id !== "string") {
      return { status: "error", message: "invalid command or missing field" };
    }
    const cal = this.calendars.get(r.student_id);
    if (!cal || cal.head === null) {
      return { status: "error", message: "no record" };
    }
    const nodes = cal.allEvents();
    if (nodes.length === 0) {
      return { status: "error", message: "no record" };
    }
    return {
      status: "ok",
      timeline: nodes.map((n) => n.text()).join(" → "),
    };
  }

  private query_day(r: JsonRequest): JsonResponse {
    if (!r.student_id || typeof r.student_id !== "string" || !r.day || typeof r.day !== "string") {
      return { status: "error", message: "invalid command or missing field" };
    }
    const cal = this.calendars.get(r.student_id);
    if (!cal) {
      return { status: "error", message: "no record" };
    }
    const events = cal.byDay(r.day).map((n) => ({
      time: n.time,
      location: n.location,
      event: n.event,
    }));
    return {
      status: "ok",
      day: r.day,
      events,
    };
  }

  // 4. 堆疊操作
  private visit(r: JsonRequest): JsonResponse {
    if (!r.page || typeof r.page !== "string") {
      return { status: "error", message: "invalid command or missing field" };
    }
    this.pages.push(r.page);
    return {
      status: "ok",
      current: this.pages[this.pages.length - 1],
    };
  }

  private back(_r: JsonRequest): JsonResponse {
    if (this.pages.length <= 1) {
      return { status: "error", message: "already at home" };
    }
    this.pages.pop();
    return {
      status: "ok",
      current: this.pages[this.pages.length - 1],
    };
  }

  /** 重設為初始狀態 */
  reset(): void {
    this.rooms = [];
    this.ticket_no = 0;
    this.books = new BookBST();
    this.calendars = new Map();
    this.pages = ["首頁"];
  }

  /** 載入佛光校園經典題目規格示範資料 */
  loadDemoData(): void {
    this.reset();
    // 1. 佇列
    this.handle({ cmd: "reserve", student_id: "S1001" });
    this.handle({ cmd: "reserve", student_id: "S1002" });
    // 2. BST
    this.handle({ cmd: "add_book", call_no: 305, title: "資料結構" });
    this.handle({ cmd: "add_book", call_no: 102, title: "佛學概論" });
    this.handle({ cmd: "add_book", call_no: 410, title: "Python程式設計" });
    this.handle({ cmd: "add_book", call_no: 210, title: "演算法" });
    // 3. 鏈結串列
    this.handle({
      cmd: "add_event",
      student_id: "S1001",
      day: "週一",
      time: "09:00",
      location: "雲起樓",
      event: "資料結構課",
    });
    this.handle({
      cmd: "add_event",
      student_id: "S1001",
      day: "週二",
      time: "14:00",
      location: "圖書館",
      event: "借書",
    });
    this.handle({
      cmd: "add_event",
      student_id: "S1001",
      day: "週三",
      time: "10:00",
      location: "討論室",
      event: "小組討論",
    });
    this.handle({
      cmd: "add_event",
      student_id: "S1001",
      day: "週二",
      time: "18:00",
      location: "雲起樓",
      event: "社團開會",
      position: 2,
    });
    this.handle({
      cmd: "add_event",
      student_id: "S1001",
      day: "週三",
      time: "15:30",
      location: "雲起樓",
      event: "期中考",
    });
    // 4. 堆疊
    this.handle({ cmd: "visit", page: "圖書館專區" });
    this.handle({ cmd: "visit", page: "討論室預約頁" });
  }
}
