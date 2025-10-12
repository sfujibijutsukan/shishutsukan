import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ja } from 'date-fns/locale';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'react-datepicker/dist/react-datepicker.css';

// 日本語ロケールを登録
registerLocale('ja', ja);

const genres = ['食費', '交通費', '消耗品', '特別費'];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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
          
          {expenses.length > 0 ? (
            <>
              {/* ジャンル別円グラフ */}
              {genreData.length > 0 && (
                <div style={{ marginBottom: 30 }}>
                  <h3 style={{ marginBottom: 15, fontSize: 18 }}>ジャンル別支出</h3>
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

              {/* 月別棒グラフ */}
              {monthlyArray.length > 0 && (
                <div>
                  <h3 style={{ marginBottom: 15, fontSize: 18 }}>月別支出</h3>
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
