# FastAPI backend main file
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import os
import hashlib
import jwt
from datetime import datetime, timedelta
import bcrypt

app = FastAPI()

# JWT設定
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# セキュリティ
security = HTTPBearer()

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

# ユーザーテーブル作成
c.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")

c.execute("""
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    genre TEXT NOT NULL,
    amount INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (user_id)
)
""")

# ジャンルテーブル作成
c.execute("""
CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name),
    FOREIGN KEY (user_id) REFERENCES users (user_id)
)
""")

conn.commit()
conn.close()

# Pydantic models
class UserCreate(BaseModel):
    user_id: str
    password: str

class UserLogin(BaseModel):
    user_id: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

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

# パスワードハッシュ化関数
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# JWT トークン作成
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# JWT トークン検証
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# 現在のユーザーを取得
def get_current_user(user_id: str = Depends(verify_token)):
    return user_id

# 認証関連のAPI
@app.post("/register", response_model=dict)
def register_user(user: UserCreate):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # ユーザーの存在確認
    c.execute("SELECT user_id FROM users WHERE user_id = ?", (user.user_id,))
    if c.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    
    # パスワードハッシュ化とユーザー作成
    password_hash = hash_password(user.password)
    c.execute("INSERT INTO users (user_id, password_hash) VALUES (?, ?)", 
              (user.user_id, password_hash))
    
    # デフォルトジャンルの作成
    default_genres = ['食費', '交通費', '消耗品', 'サブスク', '特別費', 'その他']
    for genre in default_genres:
        c.execute("INSERT INTO genres (user_id, name) VALUES (?, ?)", 
                  (user.user_id, genre))
    
    conn.commit()
    conn.close()
    
    return {"message": "User created successfully"}

@app.post("/login", response_model=Token)
def login_user(user: UserLogin):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # ユーザーの認証
    c.execute("SELECT password_hash FROM users WHERE user_id = ?", (user.user_id,))
    result = c.fetchone()
    conn.close()
    
    if not result or not verify_password(user.password, result[0]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect user_id or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # トークン作成
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.user_id}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/expenses")
def add_expense(expense: Expense, current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO expenses (user_id, date, genre, amount) VALUES (?, ?, ?, ?)", 
              (current_user, expense.date, expense.genre, expense.amount))
    conn.commit()
    conn.close()
    return {"message": "ok"}


@app.get("/expenses", response_model=List[ExpenseWithId])
def get_expenses(current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, date, genre, amount FROM expenses WHERE user_id = ? ORDER BY id DESC", 
              (current_user,))
    rows = c.fetchall()
    conn.close()
    return [ExpenseWithId(id=row[0], date=row[1], genre=row[2], amount=row[3]) for row in rows]

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM expenses WHERE id = ? AND user_id = ?", (expense_id, current_user))
    conn.commit()
    conn.close()
    return {"message": "deleted"}

# ジャンル関連のAPI
@app.get("/genres", response_model=List[GenreWithId])
def get_genres(current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, name, created_at FROM genres WHERE user_id = ? ORDER BY id", 
              (current_user,))
    rows = c.fetchall()
    conn.close()
    return [GenreWithId(id=row[0], name=row[1], created_at=row[2]) for row in rows]

@app.post("/genres")
def add_genre(genre: Genre, current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        c.execute("INSERT INTO genres (user_id, name) VALUES (?, ?)", (current_user, genre.name))
        conn.commit()
        conn.close()
        return {"message": "ok"}
    except sqlite3.IntegrityError:
        conn.close()
        return {"error": "Genre already exists"}

@app.delete("/genres/{genre_id}")
def delete_genre(genre_id: int, current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # ジャンルが使用されているかチェック
    c.execute("SELECT COUNT(*) FROM expenses WHERE genre = (SELECT name FROM genres WHERE id = ? AND user_id = ?) AND user_id = ?", 
              (genre_id, current_user, current_user))
    count = c.fetchone()[0]
    
    if count > 0:
        conn.close()
        return {"error": "Cannot delete genre that is in use"}
    
    c.execute("DELETE FROM genres WHERE id = ? AND user_id = ?", (genre_id, current_user))
    conn.commit()
    conn.close()
    return {"message": "deleted"}
