import React, { useState, useEffect } from 'react';

// 認証関連のCSS
const authBtnStyle = `
.auth-container {
  max-width: 450px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8eaed;
  overflow: hidden;
}
.auth-tabs {
  display: flex;
  border-bottom: 1px solid #e8eaed;
  background: #f8f9fa;
}
.auth-tab {
  flex: 1;
  padding: 16px 24px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #5f6368;
  transition: all 0.2s;
  font-family: 'Roboto, Arial, sans-serif';
  position: relative;
}
.auth-tab.active {
  color: #141619ff;
  background: white;
  font-weight: 600;
}
.auth-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #141619ff;
}
.auth-tab:hover:not(.active) {
  color: #202124;
  background: #e8eaed;
}
.auth-btn {
  background: #141619ff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
  font-family: 'Roboto, Arial, sans-serif';
  margin: 8px 0;
  width: 100%;
}
.auth-btn:hover {
  background: #0f1115;
}
.auth-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 14px;
  margin: 8px 0;
  box-sizing: border-box;
  font-family: 'Roboto, Arial, sans-serif';
}
.auth-form {
  padding: 32px;
  min-height: 250px;
}
.password-container {
  position: relative;
  display: flex;
  align-items: center;
}
.password-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 6px;
  font-size: 16px;
  color: #5f6368;
  z-index: 1;
  border-radius: 3px;
  font-weight: normal;
  min-width: 24px;
  text-align: center;
  line-height: 1;
}
.password-toggle:hover {
  color: #202124;
  background: #f8f9fa;
}
`;

// ゴミ箱アイコン用CSS
const trashBtnStyle = `
.trash-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}
.trash-icon {
  color: #202124;
  transition: color 0.2s;
}
.trash-btn:hover .trash-icon {
  color: #ea4335;
}
.trash-label {
  color: #202124;
  font-weight: bold;
  font-size: 14px;
  margin-left: 4px;
  transition: color 0.2s;
}
.trash-btn:hover .trash-label {
  color: #ea4335;
}
 .add-btn {
   background: transparent;
   border: none !important;
   cursor: pointer;
   padding: 4px;
   border-radius: 4px;
   transition: background 0.2s;
 }
 .add-icon {
   color: #202124;
   transition: color 0.2s;
 }
 .add-btn:hover .add-icon {
   color: #34a853;
 }
.add-label {
  color: #202124;
  font-weight: bold;
  font-size: 14px;
  margin-left: 4px;
  transition: color 0.2s;
}
.add-btn:hover .add-label {
  color: #34a853;
}
`;
import DatePicker, { registerLocale } from 'react-datepicker';
import { ja } from 'date-fns/locale';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'react-datepicker/dist/react-datepicker.css';

// 日本語ロケールを登録
registerLocale('ja', ja);

const DEFAULT_GENRES = ['食費', '交通費', '消耗品', 'サブスク', '特別費', 'その他'];
const COLORS = ['#4163adff', '#875095ff', '#ea4335', '#dd5bbeff', '#fbbc04', '#34a853', '#1a73e8', '#137333', '#f9ab00', '#d93025'];

export default function App() {
  // 認証関連のCSSをheadに追加
  useEffect(() => {
    if (!document.getElementById('auth-btn-style')) {
      const style = document.createElement('style');
      style.id = 'auth-btn-style';
      style.innerHTML = authBtnStyle;
      document.head.appendChild(style);
    }
  }, []);

  // 認証状態管理
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [loginData, setLoginData] = useState({ user_id: '', password: '' });
  const [registerData, setRegisterData] = useState({ user_id: '', password: '', confirmPassword: '' });
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // ローカルストレージから認証状態を復元
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  // ログイン処理
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const baseUrl = process.env.REACT_APP_API_URL.replace('/expenses', '');
      const response = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.access_token);
        setIsAuthenticated(true);
        localStorage.setItem('authToken', data.access_token);
        setLoginData({ user_id: '', password: '' });
      } else {
        const error = await response.json();
        setAuthError(error.detail || 'ログインに失敗しました');
      }
    } catch (error) {
      setAuthError('ネットワークエラーが発生しました');
    }
  };

  // ユーザー登録処理
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    // パスワード確認チェック
    if (registerData.password !== registerData.confirmPassword) {
      setAuthError('パスワードが一致しません');
      return;
    }
    
    // パスワードの長さチェック
    if (registerData.password.length < 4) {
      setAuthError('パスワードは4文字以上で入力してください');
      return;
    }
    
    try {
      const baseUrl = process.env.REACT_APP_API_URL.replace('/expenses', '');
      const response = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: registerData.user_id,
          password: registerData.password
        })
      });
      
      if (response.ok) {
        setShowRegister(false);
        setRegisterData({ user_id: '', password: '', confirmPassword: '' });
        alert('アカウントが作成されました。ログインしてください。');
      } else {
        const error = await response.json();
        setAuthError(error.detail || 'アカウント作成に失敗しました');
      }
    } catch (error) {
      setAuthError('ネットワークエラーが発生しました');
    }
  };

  // ログアウト処理
  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthToken('');
    localStorage.removeItem('authToken');
    setExpenses([]);
    setGenres([]);
  };
  // ゴミ箱アイコン用CSSをheadに追加
  useEffect(() => {
    if (!document.getElementById('trash-btn-style')) {
      const style = document.createElement('style');
      style.id = 'trash-btn-style';
      style.innerHTML = trashBtnStyle;
      document.head.appendChild(style);
    }
  }, []);
  // 凡例をカスタムレンダリングするコンポーネント(フォント色を黒に変更・レスポンシブ対応)
  const renderLegend = (props) => {
    return (
      <ul style={{ 
        color: '#000', 
        fontSize: isMobile ? '12px' : '14px', 
        fontFamily: 'Roboto, Arial, sans-serif', 
        margin: 0, 
        padding: 0, 
        listStyle: 'none', 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center',
        gap: isMobile ? '8px' : '16px'
      }}>
        {props.payload.map((entry, index) => (
          <li key={`item-${index}`} style={{ 
            display: 'flex', 
            alignItems: 'center',
            marginBottom: isMobile ? '4px' : '0'
          }}>
            <span style={{
              display: 'inline-block',
              width: isMobile ? 10 : 12,
              height: isMobile ? 10 : 12,
              backgroundColor: entry.color,
              marginRight: 4,
              borderRadius: 2,
              border: '1px solid #ccc'
            }} />
            <span style={{ color: '#000' }}>{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };
  // DatePickerのz-indexを確実にするためのスタイル
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .react-datepicker-popper,
      .datepicker-popper,
      .react-datepicker {
        z-index: 10000 !important;
      }
      .react-datepicker__portal {
        z-index: 10000 !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const [showGenreEdit, setShowGenreEdit] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  // APIからジャンルを取得
  const [genres, setGenres] = useState([]);
  const [genre, setGenre] = useState('');
  const [amount, setAmount] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [newGenre, setNewGenre] = useState('');

  // 支出データを取得
  const fetchExpenses = async () => {
    if (!authToken) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.error('支出データの取得に失敗しました:', error);
    }
  };

  // ジャンルデータを取得
  const fetchGenres = async () => {
    if (!authToken) return;
    try {
      const baseUrl = process.env.REACT_APP_API_URL.replace('/expenses', '');
      const response = await fetch(`${baseUrl}/genres`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const genreNames = data.map(g => g.name);
        setGenres(genreNames);
        if (genreNames.length > 0 && !genre) {
          setGenre(genreNames[0]);
        }
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.error('ジャンルデータの取得に失敗しました:', error);
      // APIが利用できない場合はデフォルトジャンルを使用
      setGenres([...DEFAULT_GENRES]);
      if (!genre) {
        setGenre(DEFAULT_GENRES[0]);
      }
    }
  };

  // ジャンル追加
  const addGenre = async (genreName) => {
    if (!authToken) return false;
    try {
      const baseUrl = process.env.REACT_APP_API_URL.replace('/expenses', '');
      const response = await fetch(`${baseUrl}/genres`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ name: genreName })
      });
      if (response.status === 401) {
        handleLogout();
        return false;
      }
      const result = await response.json();
      if (result.error) {
        alert('ジャンルは既に存在します');
        return false;
      }
      await fetchGenres(); // ジャンル一覧を再取得
      return true;
    } catch (error) {
      console.error('ジャンル追加に失敗しました:', error);
      return false;
    }
  };

  // ジャンル削除
  const deleteGenre = async (genreName) => {
    if (!authToken) return false;
    try {
      const baseUrl = process.env.REACT_APP_API_URL.replace('/expenses', '');
      // ジャンルIDを取得
      const genresResponse = await fetch(`${baseUrl}/genres`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (genresResponse.status === 401) {
        handleLogout();
        return false;
      }
      const genresData = await genresResponse.json();
      const targetGenre = genresData.find(g => g.name === genreName);
      
      if (!targetGenre) {
        alert('ジャンルが見つかりません');
        return false;
      }

      const response = await fetch(`${baseUrl}/genres/${targetGenre.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.status === 401) {
        handleLogout();
        return false;
      }
      const result = await response.json();
      if (result.error) {
        alert('使用中のジャンルは削除できません');
        return false;
      }
      await fetchGenres(); // ジャンル一覧を再取得
      return true;
    } catch (error) {
      console.error('ジャンル削除に失敗しました:', error);
      return false;
    }
  };

  useEffect(() => {
    if (isAuthenticated && authToken) {
      fetchExpenses();
      fetchGenres();
    }
  }, [isAuthenticated, authToken]);

  // ジャンル同期用のインターバル（5分ごと）
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchGenres();
    }, 5 * 60 * 1000); // 5分ごと

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // ウィンドウフォーカス時にジャンルを同期
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleFocus = () => {
      fetchGenres();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authToken) return;
    
    const expense = {
      date: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD形式
      genre,
      amount: Number(amount)
    };
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(expense)
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      setAmount('');
      // データを再取得してグラフを更新
      fetchExpenses();
    } catch (error) {
      console.error('支出データの登録に失敗しました:', error);
    }
  };

  // ジャンル別の合計金額を計算
  const genreData = genres.map(g => {
    const total = expenses
      .filter(expense => expense.genre === g)
      .reduce((sum, expense) => sum + expense.amount, 0);
    return { name: g, value: total };
  }).filter(item => item.value > 0);

  // 月別の支出データを計算
  const monthlyData = expenses.reduce((acc, expense) => {
    const month = expense.date.substring(0, 7); // YYYY-MM形式
    if (!acc[month]) {
      acc[month] = { month, total: 0 };
    }
    acc[month].total += expense.amount;
    return acc;
  }, {});

  const monthlyArray = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

  // 今年の月別ジャンル集計
  const today = new Date();
  const currentYear = today.getFullYear().toString();
  const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
  const monthlyGenreData = {};
  expenses.forEach(expense => {
    const [year, month] = expense.date.split('-');
    if (year !== currentYear) return;
    if (!monthlyGenreData[month]) monthlyGenreData[month] = {};
    if (!monthlyGenreData[month][expense.genre]) monthlyGenreData[month][expense.genre] = 0;
    monthlyGenreData[month][expense.genre] += expense.amount;
  });
  // 棒グラフ用データ（月ごと、今年のみ）
  const monthlyGenreArray = allMonths.map(m => {
    const monthStr = m.toString().padStart(2, '0');
    const obj = { month: monthStr };
    genres.forEach(g => { obj[g] = monthlyGenreData[monthStr]?.[g] || 0; });
    return obj;
  });

  // 今月の日別ジャンル集計
  const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
  const dailyGenreData = {};
  expenses.forEach(expense => {
    const [year, month, day] = expense.date.split('-');
    if (year !== currentYear || month !== currentMonth) return;
    if (!dailyGenreData[day]) dailyGenreData[day] = {};
    if (!dailyGenreData[day][expense.genre]) dailyGenreData[day][expense.genre] = 0;
    dailyGenreData[day][expense.genre] += expense.amount;
  });
  // 棒グラフ用データ（日ごと、今月のみ）
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dailyGenreArray = Array.from({ length: daysInMonth }, (_, i) => {
    const dayStr = (i + 1).toString().padStart(2, '0');
    const obj = { day: dayStr };
    genres.forEach(g => { obj[g] = dailyGenreData[dayStr]?.[g] || 0; });
    return obj;
  });
  
    // 支出削除処理
    const handleDelete = async (id) => {
      if (!window.confirm('本当に削除しますか？')) return;
      if (!authToken) return;
      
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/${id}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (res.status === 401) {
          handleLogout();
          return;
        }
        if (!res.ok) throw new Error('削除API失敗');
        setExpenses([]); // 一度空にしてから再取得
        await fetchExpenses();
      } catch (error) {
        alert('削除に失敗しました');
      }
    };

  // 年・月選択用ステート
  const allYears = Array.from(new Set(expenses.map(e => e.date.substring(0, 4)))).sort();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // 選択中の年・月の支出一覧
  const filteredExpenses = expenses.filter(e => {
    const [y, m] = e.date.split('-');
    return y === selectedYear && m === selectedMonth;
  });

  // レスポンシブ対応: 画面幅でレイアウト切替（動的検知）
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth <= 768
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      // 初期値を設定
      handleResize();
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  // 認証されていない場合はログイン画面を表示
  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: '#f8f9fa',
        padding: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="auth-container">
          <h1 style={{ 
            textAlign: 'center', 
            color: '#202124', 
            fontSize: 28, 
            fontWeight: '400', 
            margin: '24px 0 8px 0',
            padding: '0 32px',
            fontFamily: 'Google Sans, Roboto, Arial, sans-serif'
          }}>
            <b>shishutsukan</b>
          </h1>
          <p style={{
            color: '#5f6368',
            fontSize: 14,
            margin: '0 0 24px 0',
            textAlign: 'center',
            padding: '0 32px',
            fontFamily: 'Roboto, Arial, sans-serif'
          }}>
            ログインするか<br />新しくアカウントを作成してください
          </p>
          
          {/* タブヘッダー */}
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${!showRegister ? 'active' : ''}`}
              onClick={() => {
                setShowRegister(false);
                setAuthError('');
                setShowLoginPassword(false);
              }}
            >
              ログイン
            </button>
            <button 
              className={`auth-tab ${showRegister ? 'active' : ''}`}
              onClick={() => {
                setShowRegister(true);
                setAuthError('');
                setShowPassword(false);
                setShowConfirmPassword(false);
              }}
            >
              アカウント作成
            </button>
          </div>

          <div className="auth-form">
          {authError && (
            <div style={{
              background: '#fce8e6',
              color: '#d93025',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px',
              border: '1px solid #fce8e6'
            }}>
              {authError}
            </div>
          )}
          
          {showRegister ? (
            <form onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="ユーザーID"
                value={registerData.user_id}
                onChange={(e) => setRegisterData({...registerData, user_id: e.target.value})}
                className="auth-input"
                required
              />
              <div className="password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="パスワード"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  className="auth-input"
                  style={{ paddingRight: '40px' }}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? '⊘' : '⚪'}
                </button>
              </div>
              <div className="password-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="パスワードを再入力"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  className="auth-input"
                  style={{ paddingRight: '40px' }}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? '⊘' : '⚪︎'}
                </button>
              </div>
              <button type="submit" className="auth-btn">アカウント作成</button>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="ユーザーID"
                value={loginData.user_id}
                onChange={(e) => setLoginData({...loginData, user_id: e.target.value})}
                className="auth-input"
                required
              />
              <div className="password-container">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="パスワード"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="auth-input"
                  style={{ paddingRight: '40px' }}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  tabIndex="-1"
                >
                  {showLoginPassword ? '⊘' : '⚪︎'}
                </button>
              </div>
              <button type="submit" className="auth-btn">ログイン</button>
            </form>
          )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#f8f9fa',
      padding: isMobile ? 12 : 24,
      overflowX: 'hidden'
    }}>
      <div style={{ 
        maxWidth: isMobile ? '100%' : 1200, 
        margin: '0 auto', 
        padding: 0,
        background: '#ffffff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e8eaed',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{
          padding: isMobile ? 16 : 24,
          borderBottom: '1px solid #e8eaed',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ 
              textAlign: 'left', 
              color: '#202124', 
              fontSize: isMobile ? 24 : 28, 
              fontWeight: '400', 
              margin: 0,
              fontFamily: 'Google Sans, Roboto, Arial, sans-serif'
            }}>
              支出管理
            </h1>
            <p style={{
              color: '#5f6368',
              fontSize: 14,
              margin: '4px 0 0 0',
              fontFamily: 'Roboto, Arial, sans-serif'
            }}>
              家計の支出を記録・分析できます
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: '#ea4335',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'Roboto, Arial, sans-serif'
            }}
          >
            ログアウト
          </button>
        </div>
        <div style={{ padding: isMobile ? 16 : 24 }}>
        <div
          style={
            isMobile
              ? { display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch' }
              : { display: 'grid', gridTemplateColumns: '420px 1fr', gap: 30, alignItems: 'start' }
          }
        >
        {/* 支出入力フォーム＋支出一覧 */}
  <div style={{ 
    border: '1px solid #e8eaed', 
    borderRadius: 8, 
    padding: isMobile ? 16 : 20, 
    minHeight: isMobile ? 400 : 600, 
    background: '#ffffff', 
    boxSizing: 'border-box', 
    width: '100%', 
    overflowX: 'auto', 
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
  }}>
          <h2 style={{ 
            marginTop: 0, 
            marginBottom: 20, 
            color: '#202124', 
            fontSize: 18, 
            fontWeight: '500', 
            textAlign: 'left',
            fontFamily: 'Google Sans, Roboto, Arial, sans-serif',
            borderBottom: '1px solid #e8eaed', 
            paddingBottom: 12 
          }}>支出入力</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                fontWeight: '500', 
                fontSize: 14,
                color: '#202124',
                fontFamily: 'Roboto, Arial, sans-serif'
              }}>ジャンル</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
                {genres.map(g => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGenre(g)}
                    style={{
                      background: genre === g ? '#141619ff' : '#f8f9fa',
                      color: genre === g ? '#ffffff' : '#5f6368',
                      border: '1px solid ' + (genre === g ? '#141619ff' : '#dadce0'),
                      borderRadius: 4,
                      width: 100,
                      height: 36,
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      fontFamily: 'Roboto, Arial, sans-serif'
                    }}
                  >
                    {g}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowGenreEdit(v => !v)}
                  style={{
                    background: showGenreEdit ? '#141619ff' : '#f8f9fa',
                    color: showGenreEdit ? '#ffffff' : '#5f6368',
                    border: '1px solid ' + (showGenreEdit ? '#141619ff' : '#dadce0'),
                    borderRadius: 4,
                    width: 36,
                    height: 36,
                    fontSize: 18,
                    fontWeight: '500',
                    marginLeft: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  title={showGenreEdit ? 'ジャンル追加・削除欄を隠す' : 'ジャンル追加・削除欄を表示'}
                >＋</button>
              </div>
              {showGenreEdit && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    value={newGenre}
                    onChange={e => setNewGenre(e.target.value)}
                    placeholder="ジャンル名を入力"
                    style={{ 
                      width: 120, 
                      padding: '8px 12px', 
                      borderRadius: 4, 
                      border: '1px solid #dadce0', 
                      fontSize: 14,
                      fontFamily: 'Roboto, Arial, sans-serif',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const val = newGenre.trim();
                      if (val && !genres.includes(val)) {
                        const success = await addGenre(val);
                        if (success) {
                          setNewGenre('');
                        }
                      }
                    }}
                    className="add-btn"
                    title="ジャンル追加"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20" height="20" viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="add-icon"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span className="add-label">追加</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const val = newGenre.trim();
                      if (val && genres.includes(val) && genres.length > 1) {
                        const success = await deleteGenre(val);
                        if (success) {
                          // 削除されたジャンルが現在選択されている場合は別のジャンルに変更
                          if (genre === val) {
                            const remainingGenres = genres.filter(x => x !== val);
                            setGenre(remainingGenres[0] || '');
                          }
                          setNewGenre('');
                        }
                      }
                    }}
                    className="trash-btn"
                    title="ジャンル削除"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20" height="20" viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="trash-icon"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m5 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    <span className="trash-label">削除</span>
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', marginBottom: 20, alignItems: 'flex-end', gap: 16 }}>
              <div style={{ flex: 1, maxWidth: 140 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 6, 
                  fontWeight: '500', 
                  fontSize: 14,
                  color: '#202124',
                  fontFamily: 'Roboto, Arial, sans-serif'
                }}>日付</label>
                <DatePicker
                  selected={selectedDate}
                  onChange={date => setSelectedDate(date)}
                  dateFormat="yyyy/MM/dd"
                  locale="ja"
                  placeholderText="日付を選択してください"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  popperClassName="datepicker-popper"
                  popperProps={{
                    style: {
                      zIndex: 10000
                    }
                  }}
                  popperModifiers={[
                    {
                      name: 'preventOverflow',
                      options: {
                        rootBoundary: 'viewport',
                        tether: false,
                        altAxis: true,
                      },
                    },
                  ]}
                  customInput={
                    <input
                      style={{
                        width: 120,
                        minWidth: 100,
                        padding: '8px 12px',
                        border: '1px solid #dadce0',
                        borderRadius: 4,
                        fontSize: 14,
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontFamily: 'Roboto, Arial, sans-serif',
                        outline: 'none'
                      }}
                    />
                  }
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 6, 
                  fontWeight: '500', 
                  fontSize: 14,
                  color: '#202124',
                  fontFamily: 'Roboto, Arial, sans-serif'
                }}>金額</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dadce0',
                      borderRadius: 4,
                      fontSize: 14,
                      fontFamily: 'Roboto, Arial, sans-serif',
                      outline: 'none'
                    }}
                    placeholder="金額"
                    required
                    min={1}
                  />
                  <span style={{ fontSize: 14, color: '#5f6368', fontFamily: 'Roboto, Arial, sans-serif' }}>円</span>
                </div>
              </div>
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px 24px',
                background: '#141619ff',
                color: '#ffffff',
                border: 'none',
                borderRadius: 4,
                fontSize: 14,
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background-color 0.2s',
                fontFamily: 'Roboto, Arial, sans-serif'
              }}
              onMouseOver={e => e.target.style.backgroundColor = '#0f1115'}
              onMouseOut={e => e.target.style.backgroundColor = '#141619ff'}
            >
              登録
            </button>
          </form>

          {/* 支出一覧テーブル（入力欄の下に表示） */}
          {expenses.length > 0 && (
            <div style={{ marginTop: 30, marginBottom: 0, maxHeight: 437, overflowY: 'auto', background: '#fafafa', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: 18, marginBottom: 10, position: 'sticky', top: 0, background: '#fafafa', zIndex: 0 }}>支出一覧</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
                <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ fontSize: 15, padding: '4px 8px', borderRadius: 4 }}>
                  {allYears.map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1,2,3,4,5,6].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedMonth(m.toString().padStart(2, '0'))}
                        style={{
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: selectedMonth === m.toString().padStart(2, '0') ? '#141619ff' : '#eee',
                          color: selectedMonth === m.toString().padStart(2, '0') ? '#fff' : '#333',
                          border: 'none',
                          borderRadius: 4,
                          padding: '2px 8px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >{m}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[7,8,9,10,11,12].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedMonth(m.toString().padStart(2, '0'))}
                        style={{
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: selectedMonth === m.toString().padStart(2, '0') ? '#141619ff' : '#eee',
                          color: selectedMonth === m.toString().padStart(2, '0') ? '#fff' : '#333',
                          border: 'none',
                          borderRadius: 4,
                          padding: '2px 8px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >{m}</button>
                    ))}
                  </div>
                  <span style={{ marginLeft: 4 }}></span>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>日付</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>ジャンル</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>金額</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.length > 0 ? filteredExpenses.map((exp, idx) => (
                      <tr key={exp.id}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' ,textAlign: 'center'}}>{exp.date}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' ,textAlign: 'center'}}>{exp.genre}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{exp.amount.toLocaleString()}円</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDelete(exp.id)}
                            className="trash-btn"
                            title="削除"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20" height="20" viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="trash-icon"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m5 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '16px', color: '#888' }}>データがありません</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        {/* グラフエリア（2つの棒グラフのみ表示） */}
  <div style={{ 
    border: '1px solid #e8eaed', 
    borderRadius: 8, 
    padding: isMobile ? 16 : 20, 
    minHeight: isMobile ? 400 : 600, 
    background: '#ffffff', 
    boxSizing: 'border-box', 
    width: '100%', 
    overflowX: 'auto',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  }}>
      <h2 style={{ 
        marginTop: 0, 
        marginBottom: 24, 
        color: '#202124', 
        fontSize: 18, 
        fontWeight: '500',
        textAlign: 'left',
        fontFamily: 'Google Sans, Roboto, Arial, sans-serif',
        borderBottom: '1px solid #e8eaed', 
        paddingBottom: 12 
      }}>支出グラフ</h2>
          {/* 今年の月別ジャンル別支出グラフ */}
          <div style={{ 
            marginBottom: 10,
            padding: isMobile ? 12 : 16,
            background: '#f8f9fa',
            borderRadius: 8,
            border: '1px solid #e8eaed',
            overflow: 'hidden',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <h3 style={{ 
              marginBottom: 16, 
              fontSize: 16, 
              color: '#202124',
              fontWeight: '500',
              textAlign: 'left',
              fontFamily: 'Roboto, Arial, sans-serif',
              margin: '0 0 16px 0'
            }}>
              {currentYear}年の支出 (月別)
            </h3>
              <ResponsiveContainer width="100%" height={isMobile ? 350 : 265}>
              {isMobile ? (
                <BarChart 
                  data={monthlyGenreArray}
                  layout="vertical"
                  margin={{ 
                    top: 0, 
                    right: 10, 
                    left: 10, 
                    bottom: 10 
                  }}
                  barCategoryGap="10%"
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#dadce0" 
                    horizontal={false}
                    vertical={true}
                  />
                  <YAxis 
                    type="category"
                    dataKey="month" 
                    tickFormatter={m => `${parseInt(m, 10)}月`}
                    interval={0}
                    width={40}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#5f6368' }}
                  />
                  <XAxis 
                    type="number"
                    tickFormatter={value => `${Math.round(value)}円`} 
                    domain={[0, 'dataMax']} 
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#5f6368' }}
                  />
                  <Tooltip 
                    formatter={value => [`${value.toLocaleString()}円`, '']}
                    labelFormatter={label => `${parseInt(label, 10)}月`}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e8eaed',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      fontSize: '14px',
                      fontFamily: 'Roboto, Arial, sans-serif'
                    }}
                  />
                  <Legend 
                    content={renderLegend}
                    wrapperStyle={{ paddingTop: '10px' }}
                  />
                  {genres.map((g, idx) => (
                    <Bar 
                      key={g} 
                      dataKey={g} 
                      stackId="a"
                      fill={COLORS[idx % COLORS.length]} 
                      name={g}
                      radius={idx === genres.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              ) : (
                <BarChart 
                  data={monthlyGenreArray}
                  margin={{ 
                    top: 10, 
                    right: isMobile ? 10 : 10, 
                    left: isMobile ? 10 : 10, 
                    bottom: isMobile ? 10 : 10 
                  }}
                  barCategoryGap="15%"
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#dadce0" 
                    horizontal={true}
                    vertical={true}
                  />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={m => `${parseInt(m, 10)}月`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 14, fill: '#5f6368' }}
                  />
                  <YAxis 
                    tickFormatter={value => `${value.toLocaleString()}円`} 
                    domain={[0, 'dataMax']} 
                    allowDecimals={false} 
                    width={isMobile ? 90 : 80}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 14, fill: '#5f6368' }}
                  />
                  <Tooltip 
                    formatter={value => [`${value.toLocaleString()}円`, '']}
                    labelFormatter={label => `${parseInt(label, 10)}月`}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e8eaed',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      fontSize: '14px',
                      fontFamily: 'Roboto, Arial, sans-serif'
                    }}
                  />
                  <Legend 
                    content={renderLegend}
                  />
                  {genres.map((g, idx) => (
                    <Bar 
                      key={g} 
                      dataKey={g} 
                      stackId="a"
                      fill={COLORS[idx % COLORS.length]} 
                      name={g}
                      radius={idx === genres.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          {/* 今月の日別ジャンル別支出グラフ（最大31日分） */}
          <div style={{ 
            padding: isMobile ? 12 : 16,
            background: '#f8f9fa',
            borderRadius: 8,
            border: '1px solid #e8eaed',
            overflow: 'hidden',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <h3 style={{ 
              marginBottom: 16, 
              fontSize: 16, 
              color: '#202124',
              fontWeight: '500',
              textAlign: 'left',
              fontFamily: 'Roboto, Arial, sans-serif',
              margin: '0 0 16px 0'
            }}>
              {currentMonth}月の支出 (日別)
            </h3>
            <ResponsiveContainer width="100%" height={isMobile ? 500 : 265}>
              {isMobile ? (
                <BarChart 
                  data={dailyGenreArray} 
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 10 }}
                  barCategoryGap="10%"
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#dadce0" 
                    horizontal={false}
                    vertical={true}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="day" 
                    tickFormatter={d => `${parseInt(d, 10)}日`} 
                    interval={0} 
                    width={45}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#5f6368' }}
                  />
                  <XAxis 
                    type="number" 
                    tickFormatter={value => `${Math.round(value)}円`} 
                    domain={[0, 'dataMax']} 
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#5f6368' }}
                  />
                  <Tooltip 
                    formatter={value => [`${value.toLocaleString()}円`, '']}
                    labelFormatter={label => `${parseInt(label, 10)}日`}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e8eaed',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      fontSize: '14px',
                      fontFamily: 'Roboto, Arial, sans-serif'
                    }}
                  />
                  <Legend 
                    content={renderLegend}
                    wrapperStyle={{ paddingTop: '10px' }}
                  />
                  {genres.map((g, idx) => (
                    <Bar 
                      key={g} 
                      dataKey={g} 
                      stackId="a"
                      fill={COLORS[idx % COLORS.length]} 
                      name={g}
                      radius={idx === genres.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              ) : (
                <BarChart 
                  data={dailyGenreArray}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  barCategoryGap="15%"
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#dadce0" 
                    horizontal={true}
                    vertical={true}
                  />
                  <XAxis 
                    dataKey="day" 
                    tickFormatter={d => `${parseInt(d, 10)}`} 
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 13, fill: '#5f6368' }}
                  />
                  <YAxis 
                    tickFormatter={value => `${value.toLocaleString()}円`} 
                    domain={[0, 'dataMax']} 
                    allowDecimals={false} 
                    width={80}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 13, fill: '#5f6368' }}
                  />
                  <Tooltip 
                    formatter={value => [`${value.toLocaleString()}円`, '']}
                    labelFormatter={label => `${parseInt(label, 10)}日`}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e8eaed',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      fontSize: '14px',
                      fontFamily: 'Roboto, Arial, sans-serif'
                    }}
                  />
                  <Legend 
                    content={renderLegend}
                  />
                  {genres.map((g, idx) => (
                    <Bar 
                      key={g} 
                      dataKey={g} 
                      stackId="a"
                      fill={COLORS[idx % COLORS.length]} 
                      name={g}
                      radius={idx === genres.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}
