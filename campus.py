"""佛光校園智慧服務系統：Queue + BST + Linked List + Stack"""
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
        if r["day"] not in self.DAYS or not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", r["time"]):
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
