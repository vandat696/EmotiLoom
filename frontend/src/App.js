import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/diary', { content: text });
      setResult(res.data.analysis);
   } catch (err) {
     // Sửa dòng này để biết lỗi gì
     const errorMsg = err.response?.data?.error || "Không kết nối được với Server!";
     alert("Lỗi rồi: " + errorMsg);
   }
   setLoading(false);
};

  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Arial' }}>
      <h1>EmotiLoom 🌸</h1>
      <p>Hôm nay cậu cảm thấy thế nào?</p>
      
      <textarea 
        rows="5" cols="50" 
        value={text} 
        onChange={(e) => setText(e.target.value)}
        placeholder="Chia sẻ cảm xúc của cậu tại đây..."
      /><br/>

      <button onClick={handleSubmit} disabled={loading} style={{ marginTop: '10px', padding: '10px 20px' }}>
        {loading ? 'AI đang lắng nghe...' : 'Gửi nhật ký'}
      </button>

      {result && (
        <div style={{ marginTop: '30px', border: '1px solid #ddd', padding: '20px', borderRadius: '10px' }}>
          <h3>Kết quả phân tích:</h3>
          <p><b>Trạng thái:</b> {result.sentiment}</p>
          <p><b>Điểm tích cực:</b> {result.score}/10</p>
          <p><b>Lời khuyên:</b> {result.advice}</p>
        </div>
      )}
    </div>
  );
}

export default App;