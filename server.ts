import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import axios from "axios";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.db");
const JWT_SECRET = process.env.JWT_SECRET || "taskflow_super_secret_key";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS task_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    task_id INTEGER,
    date TEXT,
    completed INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(task_id) REFERENCES tasks(id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    date TEXT,
    description TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS monthly_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    month_name TEXT,
    year INTEGER,
    data_json TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS system_state (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Migration: Ensure 'password' column exists in 'users' table
try {
  db.exec("ALTER TABLE users ADD COLUMN password TEXT;");
} catch (e) {}

// Migration: Ensure 'google_id' column exists in 'users' table
try {
  db.exec("ALTER TABLE users ADD COLUMN google_id TEXT;");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);");
} catch (e) {}

// Migration: Ensure 'created_at' column exists in 'tasks' table
try {
  db.exec("ALTER TABLE tasks ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;");
} catch (e) {}

// Create Demo User
(async () => {
  const demoEmail = "demo@taskflow.com";
  const demoPassword = "password123";
  const demoName = "Demo User";

  const existingDemo = db.prepare("SELECT id FROM users WHERE email = ?").get(demoEmail);
  if (!existingDemo) {
    const hashedPassword = await bcrypt.hash(demoPassword, 10);
    const result = db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)")
      .run(demoName, demoEmail, hashedPassword);
    
    const userId = result.lastInsertRowid as number;
    
    // Seed some demo tasks
    const demoTasks = ["Acme Corp", "Globex", "Initech", "Umbrella Corp"];
    const insertTask = db.prepare("INSERT INTO tasks (user_id, name) VALUES (?, ?)");
    demoTasks.forEach(name => insertTask.run(userId, name));
    
    console.log("Demo user created successfully.");
  }
})();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to get Redirect URI
  const getRedirectUri = () => {
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    return `${appUrl.replace(/\/$/, "")}/auth/callback`;
  };

  // Helper to seed default tasks
  const seedDefaultTasks = (userId: number) => {
    const taskCount = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ?").get(userId) as { count: number };
    if (taskCount.count === 0) {
      const defaultTasks = ["Task A", "Task B", "Task C", "Task D"];
      const insertTask = db.prepare("INSERT INTO tasks (user_id, name) VALUES (?, ?)");
      defaultTasks.forEach(name => insertTask.run(userId, name));
    }
  };

  // --- Auth Routes ---

  // Email Signup
  app.post("/api/auth/signup", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    try {
      const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)")
        .run(name, email, hashedPassword);
      
      const userId = result.lastInsertRowid as number;
      seedDefaultTasks(userId);

      const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
      const user = { id: userId, name, email };

      res.json({ user, token });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Email Login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    try {
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid credentials." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials." });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ 
        user: { id: user.id, name: user.name, email: user.email }, 
        token 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Google Auth URL
  app.get("/api/auth/url", (req, res) => {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: getRedirectUri(),
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
    };

    if (!options.client_id) {
      return res.status(500).json({ error: "GOOGLE_CLIENT_ID is not configured." });
    }

    const qs = new URLSearchParams(options);
    res.json({ url: `${rootUrl}?${qs.toString()}` });
  });

  // Google Callback
  app.get("/auth/callback", async (req, res) => {
    const { code } = req.query;

    if (!code) return res.status(400).send("No code provided.");

    try {
      const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: getRedirectUri(),
        grant_type: "authorization_code",
      });

      const { access_token } = tokenResponse.data;
      const userResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const googleUser = userResponse.data;
      const userData = {
        google_id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split('@')[0]
      };

      db.prepare(`
        INSERT INTO users (google_id, email, name) 
        VALUES (?, ?, ?) 
        ON CONFLICT(google_id) DO UPDATE SET email=excluded.email, name=excluded.name
      `).run(userData.google_id, userData.email, userData.name);
      
      const user = db.prepare("SELECT id, google_id, email, name FROM users WHERE google_id = ?").get(userData.google_id) as any;
      seedDefaultTasks(user.id);

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  user: ${JSON.stringify(user)},
                  token: '${token}'
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } catch (error: any) {
      res.status(500).send(`Auth failed: ${error.message}`);
    }
  });

  // --- Protected Routes Middleware ---
  const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      (req as any).userId = decoded.userId;
      next();
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };

  // Task CRUD
  app.get("/api/tasks", authenticate, (req, res) => {
    const userId = (req as any).userId;
    const tasks = db.prepare("SELECT * FROM tasks WHERE user_id = ?").all(userId);
    res.json(tasks);
  });

  app.post("/api/tasks", authenticate, (req, res) => {
    const userId = (req as any).userId;
    const { name } = req.body;
    const result = db.prepare("INSERT INTO tasks (user_id, name) VALUES (?, ?)").run(userId, name);
    res.json({ id: result.lastInsertRowid, name });
  });

  app.put("/api/tasks/:id", authenticate, (req, res) => {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { name } = req.body;
    db.prepare("UPDATE tasks SET name = ? WHERE id = ? AND user_id = ?").run(name, id, userId);
    res.json({ success: true });
  });

  app.delete("/api/tasks/:id", authenticate, (req, res) => {
    const userId = (req as any).userId;
    const { id } = req.params;
    
    const deleteTransaction = db.transaction(() => {
      // 1. Delete all completions associated with this task for this user
      db.prepare("DELETE FROM task_completions WHERE task_id = ? AND user_id = ?").run(id, userId);
      // 2. Delete the task itself
      db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(id, userId);
    });

    try {
      deleteTransaction();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Task Completions
  app.get("/api/task-completions", authenticate, (req, res) => {
    const userId = (req as any).userId;
    const { date } = req.query;
    const completions = db.prepare("SELECT * FROM task_completions WHERE user_id = ? AND date = ?").all(userId, date);
    res.json(completions);
  });

  app.post("/api/task-completions", authenticate, (req, res) => {
    const userId = (req as any).userId;
    const { date, completions } = req.body;
    const deleteStmt = db.prepare("DELETE FROM task_completions WHERE user_id = ? AND date = ?");
    deleteStmt.run(userId, date);

    const insertStmt = db.prepare("INSERT INTO task_completions (user_id, task_id, date, completed) VALUES (?, ?, ?, ?)");
    for (const [taskId, completed] of Object.entries(completions)) {
      insertStmt.run(userId, parseInt(taskId), date, completed ? 1 : 0);
    }
    res.json({ success: true });
  });

  // Events
  app.get("/api/events", authenticate, (req, res) => {
    const userId = (req as any).userId;
    const events = db.prepare("SELECT * FROM events WHERE user_id = ? ORDER BY date DESC").all(userId);
    res.json(events);
  });

  app.post("/api/events", authenticate, (req, res) => {
    const userId = (req as any).userId;
    const { title, date, description } = req.body;
    const result = db.prepare("INSERT INTO events (user_id, title, date, description) VALUES (?, ?, ?, ?)").run(userId, title, date, description);
    res.json({ id: result.lastInsertRowid, title, date, description });
  });

  app.delete("/api/events/:id", authenticate, (req, res) => {
    const userId = (req as any).userId;
    const { id } = req.params;
    db.prepare("DELETE FROM events WHERE id = ? AND user_id = ?").run(id, userId);
    res.json({ success: true });
  });

  app.get("/api/tasks/all", authenticate, (req, res) => {
    const userId = (req as any).userId;
    const completions = db.prepare(`
      SELECT t.*, c.name as task_name 
      FROM task_completions t 
      JOIN tasks c ON t.task_id = c.id 
      WHERE t.user_id = ? 
      ORDER BY t.date DESC
    `).all(userId);
    res.json(completions);
  });

  // Stats
  app.get("/api/stats/monthly-summary", authenticate, (req, res) => {
    const userId = (req as any).userId;
    
    // Get summary from monthly_reports
    const archivedReports = db.prepare(`
      SELECT month_name, year, data_json 
      FROM monthly_reports 
      WHERE user_id = ? 
      ORDER BY year ASC, id ASC
    `).all(userId);

    const summary = archivedReports.map((r: any) => {
      const tasks = JSON.parse(r.data_json as string);
      const completed = tasks.filter((t: any) => t.completed === 1).length;
      return {
        name: `${r.month_name} ${r.year}`,
        completed,
        total: tasks.length
      };
    });

    // Get current month data from tasks
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long' });
    const currentYear = now.getFullYear();
    const currentMonthPrefix = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}%`;
    
    const currentTasks = db.prepare(`
      SELECT completed FROM task_completions 
      WHERE user_id = ? AND date LIKE ?
    `).all(userId, currentMonthPrefix);

    if (currentTasks.length > 0) {
      const completed = currentTasks.filter((t: any) => t.completed === 1).length;
      summary.push({
        name: `${currentMonth} ${currentYear}`,
        completed,
        total: currentTasks.length
      });
    } else {
      // If no tasks for current month yet, still show the bar with 0
      summary.push({
        name: `${currentMonth} ${currentYear}`,
        completed: 0,
        total: 0
      });
    }

    res.json(summary);
  });

  // Reports
  app.get("/api/reports", authenticate, (req, res) => {
    const userId = (req as any).userId;
    const reports = db.prepare("SELECT * FROM monthly_reports WHERE user_id = ? ORDER BY year DESC, id DESC").all(userId);
    res.json(reports.map(r => ({ ...r, data: JSON.parse(r.data_json as string) })));
  });

  // Reset Logic
  app.post("/api/check-reset", authenticate, (req, res) => {
    const userId = (req as any).userId;
    const now = new Date();
    const day = now.getDate();
    
    // If it's the 1st of the month, we check if we need to archive the PREVIOUS month
    if (day === 1) {
      const prevMonthDate = new Date();
      prevMonthDate.setMonth(now.getMonth() - 1);
      const month = prevMonthDate.getMonth();
      const year = prevMonthDate.getFullYear();
      const monthName = prevMonthDate.toLocaleString('default', { month: 'long' });
      
      const lastResetKey = `last_reset_${userId}_${month}_${year}`;
      const lastReset = db.prepare("SELECT value FROM system_state WHERE key = ?").get(lastResetKey);

      if (!lastReset) {
          const completions = db.prepare(`
            SELECT t.*, c.name as task_name 
            FROM task_completions t 
            JOIN tasks c ON t.task_id = c.id 
            WHERE t.user_id = ? AND t.date LIKE ?
          `).all(userId, `${year}-${String(month + 1).padStart(2, '0')}%`);

          if (completions.length > 0) {
            db.prepare("INSERT INTO monthly_reports (user_id, month_name, year, data_json) VALUES (?, ?, ?, ?)")
              .run(userId, monthName, year, JSON.stringify(completions));
          }

        db.prepare("INSERT OR REPLACE INTO system_state (key, value) VALUES (?, ?)").run(lastResetKey, "done");
        return res.json({ reset: true, month: monthName });
      }
    }
    res.json({ reset: false });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
