import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ja } from 'date-fns/locale';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'react-datepicker/dist/react-datepicker.css';

// 日本語ロケールを登録
registerLocale('ja', ja);

const DEFAULT_GENRES = ['食費', '交通費', '消耗品', 'サブスク', '特別費', 'その他'];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF90B8', '#FF4560'];

export default function App() {
  const [showGenreEdit, setShowGenreEdit] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [genres, setGenres] = useState([...DEFAULT_GENRES]);
  const [genre, setGenre] = useState(DEFAULT_GENRES[0]);
  const [amount, setAmount] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [newGenre, setNewGenre] = useState('');

  // 支出データを取得
  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}`);
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('支出データの取得に失敗しました:', error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const expense = {
      date: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD形式
      genre,
      amount: Number(amount)
    };
    
    try {
  await fetch(`${process.env.REACT_APP_API_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
      });
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
      try {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/${id}`, { method: 'DELETE' });
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

  // レスポンシブ対応: 画面幅でレイアウト切替
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;
  return (
    <div style={{ background: '#f5f5f5', maxWidth: 1200, margin: '20px auto', padding: isMobile ? 8 : 20 }}>
      <div
        style={
          isMobile
            ? { display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'stretch' }
            : { display: 'grid', gridTemplateColumns: '400px 1fr', gap: 30, alignItems: 'start' }
        }
      >
        {/* 支出入力フォーム＋支出一覧 */}
  <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: isMobile ? 12 : 20, minHeight: isMobile ? 400 : 600, background: '#fff', boxSizing: 'border-box', width: '100%', overflowX: 'auto' }}>
          {/* <h2 style={{ marginTop: 0, marginBottom: 20 }}>支出入力</h2> */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>日付:</label>
              <DatePicker
                selected={selectedDate}
                onChange={date => setSelectedDate(date)}
                dateFormat="yyyy/MM/dd"
                locale="ja"
                placeholderText="日付を選択してください"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                customInput={
                  <input
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      fontSize: 16,
                      cursor: 'pointer'
                    }}
                  />
                }
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>ジャンル:</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
                {genres.map(g => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGenre(g)}
                    style={{
                      background: genre === g ? '#1976d2' : '#f5f5f5',
                      color: genre === g ? '#fff' : '#333',
                      border: '1px solid ' + (genre === g ? '#1976d2' : '#ddd'),
                      borderRadius: 6,
                      width: 100,
                      height: 40,
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: 16,
                      fontWeight: 'bold',
                      transition: 'all 0.2s'
                    }}
                  >
                    {g}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowGenreEdit(v => !v)}
                  style={{
                    background: showGenreEdit ? '#1976d2' : '#f5f5f5',
                    color: showGenreEdit ? '#fff' : '#333',
                    border: '1px solid ' + (showGenreEdit ? '#1976d2' : '#ddd'),
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    fontSize: 24,
                    fontWeight: 'bold',
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
                    style={{ width: 120, padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: 15 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = newGenre.trim();
                      if (val && !genres.includes(val)) {
                        setGenres([...genres, val]);
                        setNewGenre('');
                      }
                    }}
                    style={{ padding: '6px 16px', borderRadius: 4, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: 15, cursor: 'pointer' }}
                  >追加</button>
                  <button
                    type="button"
                    onClick={() => {
                      const val = newGenre.trim();
                      if (val && genres.includes(val) && genres.length > 1) {
                        setGenres(genres.filter(x => x !== val));
                        if (genre === val) setGenre(genres.filter(x => x !== val)[0] || '');
                        setNewGenre('');
                      }
                    }}
                    style={{ padding: '6px 16px', borderRadius: 4, background: '#e53935', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: 15, cursor: 'pointer' }}
                  >削除</button>
                </div>
              )}
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>金額:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    fontSize: 16
                  }}
                  placeholder="金額を入力"
                  required
                  min={1}
                />
                <span style={{ fontSize: 16, color: '#666' }}>円</span>
              </div>
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: 12,
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 16,
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={e => e.target.style.backgroundColor = '#1565c0'}
              onMouseOut={e => e.target.style.backgroundColor = '#1976d2'}
            >
              登録
            </button>
          </form>

          {/* 支出一覧テーブル（入力欄の下に表示） */}
          {expenses.length > 0 && (
            <div style={{ marginTop: 30, marginBottom: 0, maxHeight: 320, overflowY: 'auto', background: '#fafafa', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: 18, marginBottom: 10, position: 'sticky', top: 0, background: '#fafafa', zIndex: 1 }}>支出一覧</h3>
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
                          background: selectedMonth === m.toString().padStart(2, '0') ? '#1976d2' : '#eee',
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
                          background: selectedMonth === m.toString().padStart(2, '0') ? '#1976d2' : '#eee',
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
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{exp.date}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{exp.genre}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{exp.amount.toLocaleString()}円</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDelete(exp.id)}
                            style={{
                              background: '#e53935',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              padding: '4px 12px',
                              cursor: 'pointer',
                              fontSize: 14
                            }}
                          >削除</button>
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
  <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: isMobile ? 12 : 20, minHeight: isMobile ? 400 : 600, background: '#fff', boxSizing: 'border-box', width: '100%', overflowX: 'auto' }}>
          {/* <h2 style={{ marginTop: 0, marginBottom: 20 }}>支出分析</h2> */}
          {/* 今年の月別ジャンル別支出グラフ */}
          <div style={{ marginBottom: 40 }}>
            <h3 style={{ marginBottom: 15, fontSize: 18 }}>月別支出</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyGenreArray}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={m => `${parseInt(m, 10)}月`} />
                  <YAxis tickFormatter={value => `${value.toLocaleString()}円`} domain={[0, 'dataMax']} allowDecimals={false} width={80} />
                <Tooltip formatter={value => `${value.toLocaleString()}円`} />
                <Legend />
                {genres.map((g, idx) => (
                  <Bar key={g} dataKey={g} stackId="a" fill={COLORS[idx % COLORS.length]} name={g} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* 今月の日別ジャンル別支出グラフ（最大31日分） */}
          <div>
            <h3 style={{ marginBottom: 15, fontSize: 18 }}>日別支出</h3>
            <ResponsiveContainer width="100%" height={isMobile ? 600 : 250}>
              {isMobile ? (
                <BarChart data={dailyGenreArray} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <YAxis type="category" dataKey="day" tickFormatter={d => `${parseInt(d, 10)}`} interval={0} width={40} />
                  <XAxis type="number" tickFormatter={value => `${value.toLocaleString()}円`} domain={[0, 'dataMax']} allowDecimals={false} />
                  <Tooltip formatter={value => `${value.toLocaleString()}円`} />
                  <Legend />
                  {genres.map((g, idx) => (
                    <Bar key={g} dataKey={g} stackId="a" fill={COLORS[idx % COLORS.length]} name={g} />
                  ))}
                </BarChart>
              ) : (
                <BarChart data={dailyGenreArray}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickFormatter={d => `${parseInt(d, 10)}`} interval={0} />
                  <YAxis tickFormatter={value => `${value.toLocaleString()}円`} domain={[0, 'dataMax']} allowDecimals={false} width={80} />
                  <Tooltip formatter={value => `${value.toLocaleString()}円`} />
                  <Legend />
                  {genres.map((g, idx) => (
                    <Bar key={g} dataKey={g} stackId="a" fill={COLORS[idx % COLORS.length]} name={g} />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
