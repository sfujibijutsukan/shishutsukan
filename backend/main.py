# FastAPI backend main file
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime
import sqlite3
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.getenv("DATABASE_URL", "sqlite:///app.db").replace("sqlite:///", "")


def get_conn():
    """Create a new sqlite3 connection with foreign key enforcement enabled."""
    conn = sqlite3.connect(DB_PATH)
    # Enable foreign keys per-connection in SQLite
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

# DB初期化
conn = get_conn()
c = conn.cursor()

# ジャンルテーブル（先に作成）
c.execute(
    """
CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""
)

# expensesテーブル（新スキーマ）
c.execute(
    """
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    genre_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE RESTRICT ON UPDATE CASCADE
)
"""
)

# デフォルトジャンルの初期化
default_genres = ['食費', '交通費', '消耗品', 'サブスク', '特別費', 'その他']
for genre in default_genres:
    c.execute("INSERT OR IGNORE INTO genres (name) VALUES (?)", (genre,))

"""Create helpful indexes for performance."""
c.execute("CREATE INDEX IF NOT EXISTS idx_expenses_genre_id ON expenses(genre_id)")
c.execute("CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)")

conn.commit()
conn.close()

class Expense(BaseModel):
    date: str
    genre: str
    amount: int

class ExpenseWithId(Expense):
    id: int

class Genre(BaseModel):
    name: str

class GenreWithId(BaseModel):
    id: int
    name: str
    created_at: str


# 支出関連のAPI
@app.post("/expenses")
def add_expense(expense: Expense):
    conn = get_conn()
    c = conn.cursor()
    # Validate date format (YYYY-MM-DD)
    try:
        datetime.strptime(expense.date, "%Y-%m-%d")
    except ValueError:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    # Validate amount
    if not isinstance(expense.amount, int) or expense.amount <= 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Amount must be a positive integer.")

    # 指定されたジャンル名が存在するか確認し、IDに変換
    c.execute("SELECT id FROM genres WHERE name = ?", (expense.genre,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=400, detail="Genre does not exist")
    genre_id = row[0]

    c.execute(
        "INSERT INTO expenses (date, genre_id, amount) VALUES (?, ?, ?)",
        (expense.date, genre_id, expense.amount),
    )
    conn.commit()
    conn.close()
    return {"message": "ok"}

@app.get("/expenses", response_model=List[ExpenseWithId])
def get_expenses():
    conn = get_conn()
    c = conn.cursor()
    # ジャンル名をJOINで取得
    c.execute(
        """
        SELECT e.id, e.date, g.name as genre, e.amount
        FROM expenses e
        JOIN genres g ON g.id = e.genre_id
        ORDER BY e.id DESC
        """
    )
    rows = c.fetchall()
    conn.close()
    return [ExpenseWithId(id=row[0], date=row[1], genre=row[2], amount=row[3]) for row in rows]

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int):
    conn = get_conn()
    c = conn.cursor()
    c.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    conn.commit()
    conn.close()
    return {"message": "deleted"}


# ジャンル関連のAPI
@app.get("/genres", response_model=List[GenreWithId])
def get_genres():
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT id, name, created_at FROM genres ORDER BY id")
    rows = c.fetchall()
    conn.close()
    return [GenreWithId(id=row[0], name=row[1], created_at=row[2]) for row in rows]

@app.post("/genres")
def add_genre(genre: Genre):
    conn = get_conn()
    c = conn.cursor()
    try:
        # Normalize: trim whitespace and ensure non-empty
        name = (genre.name or "").strip()
        if not name:
            conn.close()
            raise HTTPException(status_code=400, detail="Genre name cannot be empty")
        c.execute("INSERT INTO genres (name) VALUES (?)", (name,))
        conn.commit()
        conn.close()
        return {"message": "ok"}
    except sqlite3.IntegrityError:
        conn.close()
        return {"error": "Genre already exists"}

@app.delete("/genres/{genre_id}")
def delete_genre(genre_id: int):
    conn = get_conn()
    c = conn.cursor()
    # ジャンルが使用されているかチェック
    # 新スキーマではgenre_idで参照
    c.execute("SELECT COUNT(*) FROM expenses WHERE genre_id = ?", (genre_id,))
    count = c.fetchone()[0]
    
    if count > 0:
        conn.close()
        return {"error": "Cannot delete genre that is in use"}
    
    c.execute("DELETE FROM genres WHERE id = ?", (genre_id,))
    conn.commit()
    conn.close()
    return {"message": "deleted"}
