const express = require('express');
const cors = require('cors');
const path = require('path');
const appsRouter = require('./routes/apps');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/apps', appsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Hamnen backend server running on port ${PORT}`);
});
