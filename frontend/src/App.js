import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ja } from 'date-fns/locale';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'react-datepicker/dist/react-datepicker.css';

// 日本語ロケールを登録
registerLocale('ja', ja);

const genres = ['食費', '交通費', '外食費', '消耗品', '特別費', 'その他'];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF90B8', '#FF4560'];

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [genre, setGenre] = useState(genres[0]);
  const [amount, setAmount] = useState('');
  const [expenses, setExpenses] = useState([]);

  // 支出データを取得
  const fetchExpenses = async () => {
    try {
      const response = await fetch('http://localhost:8000/expenses');
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
      await fetch('http://localhost:8000/expenses', {
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

    // ジャンル別・月ごとの集計
    const genreMonthlyData = {};
    expenses.forEach(expense => {
      const month = expense.date.substring(0, 7);
      if (!genreMonthlyData[month]) genreMonthlyData[month] = {};
      if (!genreMonthlyData[month][expense.genre]) genreMonthlyData[month][expense.genre] = 0;
      genreMonthlyData[month][expense.genre] += expense.amount;
    });
    // 棒グラフ用データ（月ごと）
    const genreMonthlyArray = Object.keys(genreMonthlyData).sort().map(month => {
      const obj = { month };
      genres.forEach(g => { obj[g] = genreMonthlyData[month][g] || 0; });
      return obj;
    });

    // ジャンル別・年ごとの集計
    const genreYearlyData = {};
    expenses.forEach(expense => {
      const year = expense.date.substring(0, 4);
      if (!genreYearlyData[year]) genreYearlyData[year] = {};
      if (!genreYearlyData[year][expense.genre]) genreYearlyData[year][expense.genre] = 0;
      genreYearlyData[year][expense.genre] += expense.amount;
    });
    // 棒グラフ用データ（年ごと）
    const genreYearlyArray = Object.keys(genreYearlyData).sort().map(year => {
      const obj = { year };
      genres.forEach(g => { obj[g] = genreYearlyData[year][g] || 0; });
      return obj;
    });
  
    // 支出削除処理
    const handleDelete = async (id) => {
      if (!window.confirm('本当に削除しますか？')) return;
      try {
        const res = await fetch(`http://localhost:8000/expenses/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('削除API失敗');
        setExpenses([]); // 一度空にしてから再取得
        await fetchExpenses();
      } catch (error) {
        alert('削除に失敗しました');
      }
    };

  // 年・月選択用ステート
  const today = new Date();
  const allYears = Array.from(new Set(expenses.map(e => e.date.substring(0, 4)))).sort();
  const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((today.getMonth() + 1).toString().padStart(2, '0'));

  // 選択中の年・月の支出一覧
  const filteredExpenses = expenses.filter(e => {
    const [y, m] = e.date.split('-');
    return y === selectedYear && m === selectedMonth;
  });

  return (
    <div style={{ maxWidth: 1200, margin: '20px auto', padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 30, alignItems: 'start' }}>
        {/* 支出入力フォーム */}
        <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 20 }}>
          <h2 style={{ marginTop: 0, marginBottom: 20 }}>支出入力</h2>
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
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontSize: 14,
                      transition: 'all 0.2s'
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
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
        </div>

        {/* グラフエリア */}
        <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 20 }}>
          <h2 style={{ marginTop: 0, marginBottom: 20 }}>支出分析</h2>
          {/* 支出一覧テーブル */}
          {expenses.length > 0 && (
            <div style={{ marginBottom: 30 }}>
              <h3 style={{ fontSize: 18, marginBottom: 10 }}>支出一覧</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
                <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ fontSize: 15, padding: '4px 8px', borderRadius: 4 }}>
                  {allYears.map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
                <div style={{ display: 'flex', gap: 4 }}>
                  {allMonths.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMonth(m.toString().padStart(2, '0'))}
                      style={{
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
                  <span style={{ marginLeft: 4 }}>月</span>
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
          
          {expenses.length > 0 ? (
            <>
              {/* ジャンル別支出グラフ（横並び） */}
              <div style={{ display: 'flex', gap: 30, marginBottom: 30 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginBottom: 15, fontSize: 18 }}>ジャンル別支出（月ごと）</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={genreMonthlyArray}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={value => `${value.toLocaleString()}円`} />
                      <Tooltip formatter={value => `${value.toLocaleString()}円`} />
                      <Legend />
                      {genres.map((g, idx) => (
                        <Bar key={g} dataKey={g} stackId="a" fill={COLORS[idx % COLORS.length]} name={g} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginBottom: 15, fontSize: 18 }}>ジャンル別支出（年ごと）</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={genreYearlyArray}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={value => `${value.toLocaleString()}円`} />
                      <Tooltip formatter={value => `${value.toLocaleString()}円`} />
                      <Legend />
                      {genres.map((g, idx) => (
                        <Bar key={g} dataKey={g} stackId="a" fill={COLORS[idx % COLORS.length]} name={g} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 月別棒グラフ */}
              {monthlyArray.length > 0 && (
                <div>
                  <h3 style={{ marginBottom: 15, fontSize: 18 }}>月別支出（合計）</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyArray}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={value => `${value.toLocaleString()}円`} />
                      <Tooltip formatter={value => `${value.toLocaleString()}円`} />
                      <Legend />
                      <Bar dataKey="total" fill="#1976d2" name="支出合計" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* ジャンル別円グラフ（合計） */}
              {genreData.length > 0 && (
                <div style={{ marginTop: 30 }}>
                  <h3 style={{ marginBottom: 15, fontSize: 18 }}>ジャンル別支出（全期間合計）</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={genreData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value.toLocaleString()}円 (${(percent * 100).toFixed(1)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {genreData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={value => `${value.toLocaleString()}円`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* 合計金額表示 */}
              <div style={{ marginTop: 20, padding: 15, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
                <h4 style={{ margin: 0, marginBottom: 10 }}>支出サマリー</h4>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 'bold', color: '#1976d2' }}>
                  総支出: {expenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}円
                </p>
                <p style={{ margin: 0, marginTop: 5, color: '#666' }}>
                  登録件数: {expenses.length}件
                </p>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
              <p>まだ支出データがありません。</p>
              <p>左のフォームから支出を登録してください。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
