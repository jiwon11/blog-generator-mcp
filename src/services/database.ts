import initSqlJs, { Database } from "sql.js";
import * as fs from "fs/promises";
import * as path from "path";
import { Task, TaskStatus, TaskType, TaskResult, FeedbackEntry } from "../types.js";

let db: Database | null = null;
let dbPath: string = "./data/tasks.db";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    input TEXT NOT NULL,
    result TEXT,
    history TEXT DEFAULT '[]',
    error TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at);
`;

export async function initDatabase(customPath?: string): Promise<void> {
  if (customPath) {
    dbPath = customPath;
  }

  const SQL = await initSqlJs();

  // Ensure directory exists
  const dir = path.dirname(dbPath);
  await fs.mkdir(dir, { recursive: true });

  // Try to load existing database
  try {
    const buffer = await fs.readFile(dbPath);
    db = new SQL.Database(buffer);
  } catch {
    // Create new database
    db = new SQL.Database();
  }

  // Initialize schema
  db.run(SCHEMA);
  await saveDatabase();
}

async function saveDatabase(): Promise<void> {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  await fs.writeFile(dbPath, buffer);
}

export async function createTask(
  id: string,
  type: TaskType,
  input: Record<string, unknown>
): Promise<Task> {
  if (!db) throw new Error("Database not initialized");

  const now = new Date().toISOString();
  const task: Task = {
    id,
    type,
    status: TaskStatus.PENDING,
    progress: 0,
    input,
    result: null,
    history: [],
    error: null,
    createdAt: now,
    updatedAt: now
  };

  db.run(
    `INSERT INTO tasks (id, type, status, progress, input, result, history, error, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.id,
      task.type,
      task.status,
      task.progress,
      JSON.stringify(task.input),
      null,
      JSON.stringify(task.history),
      null,
      task.createdAt,
      task.updatedAt
    ]
  );

  await saveDatabase();
  return task;
}

export async function getTask(id: string): Promise<Task | null> {
  if (!db) throw new Error("Database not initialized");

  const result = db.exec(`SELECT * FROM tasks WHERE id = ?`, [id]);

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const row = result[0].values[0];
  const columns = result[0].columns;

  const getValue = (col: string) => {
    const idx = columns.indexOf(col);
    return idx >= 0 ? row[idx] : null;
  };

  return {
    id: getValue("id") as string,
    type: getValue("type") as TaskType,
    status: getValue("status") as TaskStatus,
    progress: getValue("progress") as number,
    input: JSON.parse(getValue("input") as string),
    result: getValue("result") ? JSON.parse(getValue("result") as string) : null,
    history: JSON.parse(getValue("history") as string || "[]"),
    error: getValue("error") as string | null,
    createdAt: getValue("created_at") as string,
    updatedAt: getValue("updated_at") as string
  };
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
  progress?: number
): Promise<void> {
  if (!db) throw new Error("Database not initialized");

  const now = new Date().toISOString();

  if (progress !== undefined) {
    db.run(
      `UPDATE tasks SET status = ?, progress = ?, updated_at = ? WHERE id = ?`,
      [status, progress, now, id]
    );
  } else {
    db.run(
      `UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?`,
      [status, now, id]
    );
  }

  await saveDatabase();
}

export async function updateTaskResult(
  id: string,
  result: TaskResult
): Promise<void> {
  if (!db) throw new Error("Database not initialized");

  const now = new Date().toISOString();
  db.run(
    `UPDATE tasks SET result = ?, status = ?, progress = 100, updated_at = ? WHERE id = ?`,
    [JSON.stringify(result), TaskStatus.COMPLETED, now, id]
  );

  await saveDatabase();
}

export async function updateTaskError(
  id: string,
  error: string
): Promise<void> {
  if (!db) throw new Error("Database not initialized");

  const now = new Date().toISOString();
  db.run(
    `UPDATE tasks SET error = ?, status = ?, updated_at = ? WHERE id = ?`,
    [error, TaskStatus.FAILED, now, id]
  );

  await saveDatabase();
}

export async function addFeedbackToHistory(
  id: string,
  feedback: string
): Promise<void> {
  if (!db) throw new Error("Database not initialized");

  const task = await getTask(id);
  if (!task) throw new Error(`Task not found: ${id}`);

  const entry: FeedbackEntry = {
    feedback,
    appliedAt: new Date().toISOString()
  };

  const newHistory = [...task.history, entry];
  const now = new Date().toISOString();

  db.run(
    `UPDATE tasks SET history = ?, status = ?, progress = 0, updated_at = ? WHERE id = ?`,
    [JSON.stringify(newHistory), TaskStatus.PENDING, now, id]
  );

  await saveDatabase();
}

export async function cleanupOldTasks(daysOld: number = 7): Promise<number> {
  if (!db) throw new Error("Database not initialized");

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  const result = db.run(
    `DELETE FROM tasks WHERE created_at < ? AND status IN ('completed', 'failed')`,
    [cutoff.toISOString()]
  );

  await saveDatabase();
  return db.getRowsModified();
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
