require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');

const app = express();
app.use(cors());
app.use(express.json());

// Tất cả routes
app.use('/api', routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`EmotiLoom OOP Backend running on port ${PORT}`);
});