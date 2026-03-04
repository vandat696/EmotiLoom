require('dotenv').config();
const express = require('express');
const cors = require('cors');
const diaryController = require('./controllers/DiaryController');

const app = express();
app.use(cors());
app.use(express.json());

// Định nghĩa Route theo hướng đối tượng
app.post('/api/diary', (req, res) => diaryController.analyzeAndSave(req, res));

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 EmotiLoom OOP Backend running on port ${PORT}`);
});