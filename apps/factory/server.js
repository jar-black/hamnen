const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const pty = require('node-pty');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8080;
const PROJECT_DIR = process.env.PROJECT_DIR || '/workspace';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'web')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Factory AI Web Interface is running' });
});

// API endpoint to get project files
app.get('/api/files', (req, res) => {
  const dirPath = req.query.path || PROJECT_DIR;

  try {
    const items = fs.readdirSync(dirPath).map(item => {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      return {
        name: item,
        path: itemPath,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtime
      };
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to read file content
app.get('/api/file-content', (req, res) => {
  const filePath = req.query.path;

  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Store active terminals
const terminals = new Map();

// Handle socket connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Create new terminal session
  socket.on('create-terminal', () => {
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: PROJECT_DIR,
      env: {
        ...process.env,
        TERM: 'xterm-256color'
      }
    });

    terminals.set(socket.id, ptyProcess);

    // Send terminal data to client
    ptyProcess.onData((data) => {
      socket.emit('terminal-data', data);
    });

    // Handle terminal exit
    ptyProcess.onExit(() => {
      terminals.delete(socket.id);
      socket.emit('terminal-exit');
    });

    socket.emit('terminal-created');
  });

  // Handle terminal input
  socket.on('terminal-input', (data) => {
    const terminal = terminals.get(socket.id);
    if (terminal) {
      terminal.write(data);
    }
  });

  // Start Factory AI session
  socket.on('start-droid', () => {
    const terminal = terminals.get(socket.id);
    if (terminal) {
      terminal.write('droid\n');
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const terminal = terminals.get(socket.id);
    if (terminal) {
      terminal.kill();
      terminals.delete(socket.id);
    }
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Factory AI Web Interface running on port ${PORT}`);
});