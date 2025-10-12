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
conn.commit()
conn.close()

class Expense(BaseModel):
    date: str
    genre: str
    amount: int

class ExpenseWithId(Expense):
    id: int

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
