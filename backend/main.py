# FastAPI backend main file
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
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

# DB初期化
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
c.execute("""
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    genre TEXT NOT NULL,
    amount INTEGER NOT NULL
)
""")

# ジャンルテーブル作成
c.execute("""
CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")

# デフォルトジャンルの初期化
default_genres = ['食費', '交通費', '消耗品', 'サブスク', '特別費', 'その他']
for genre in default_genres:
    c.execute("INSERT OR IGNORE INTO genres (name) VALUES (?)", (genre,))

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

@app.post("/expenses")
def add_expense(expense: Expense):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO expenses (date, genre, amount) VALUES (?, ?, ?)", (expense.date, expense.genre, expense.amount))
    conn.commit()
    conn.close()
    return {"message": "ok"}


@app.get("/expenses", response_model=List[ExpenseWithId])
def get_expenses():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, date, genre, amount FROM expenses ORDER BY id DESC")
    rows = c.fetchall()
    conn.close()
    return [ExpenseWithId(id=row[0], date=row[1], genre=row[2], amount=row[3]) for row in rows]

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    conn.commit()
    conn.close()
    return {"message": "deleted"}

# ジャンル関連のAPI
@app.get("/genres", response_model=List[GenreWithId])
def get_genres():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, name, created_at FROM genres ORDER BY id")
    rows = c.fetchall()
    conn.close()
    return [GenreWithId(id=row[0], name=row[1], created_at=row[2]) for row in rows]

@app.post("/genres")
def add_genre(genre: Genre):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        c.execute("INSERT INTO genres (name) VALUES (?)", (genre.name,))
        conn.commit()
        conn.close()
        return {"message": "ok"}
    except sqlite3.IntegrityError:
        conn.close()
        return {"error": "Genre already exists"}

@app.delete("/genres/{genre_id}")
def delete_genre(genre_id: int):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # ジャンルが使用されているかチェック
    c.execute("SELECT COUNT(*) FROM expenses WHERE genre = (SELECT name FROM genres WHERE id = ?)", (genre_id,))
    count = c.fetchone()[0]
    
    if count > 0:
        conn.close()
        return {"error": "Cannot delete genre that is in use"}
    
    c.execute("DELETE FROM genres WHERE id = ?", (genre_id,))
    conn.commit()
    conn.close()
    return {"message": "deleted"}
