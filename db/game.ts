import { env } from "cloudflare:workers";

type DatabaseEnv = { DB?: D1Database };

function database() {
  const db = (env as DatabaseEnv).DB;
  if (!db) throw new Error("Хранилище игры временно недоступно");
  return db;
}

export async function ensureGameSchema() {
  const db = database();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS rooms (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      target TEXT NOT NULL,
      solved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS guesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_code TEXT NOT NULL,
      player TEXT NOT NULL,
      word TEXT NOT NULL,
      score INTEGER NOT NULL,
      rank INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS guesses_room_idx ON guesses(room_code, id)"),
  ]);
  return db;
}

export async function readRoom(code: string) {
  const db = await ensureGameSchema();
  const room = await db.prepare("SELECT code, name, target, solved, created_at AS createdAt FROM rooms WHERE code = ?").bind(code).first<Record<string, unknown>>();
  if (!room) return null;
  const guesses = await db.prepare("SELECT id, player, word, score, rank, created_at AS createdAt FROM guesses WHERE room_code = ? ORDER BY id DESC LIMIT 200").bind(code).all();
  const players = await db.prepare("SELECT player, COUNT(*) AS attempts, MIN(rank) AS bestRank, MAX(score) AS points FROM guesses WHERE room_code = ? GROUP BY player ORDER BY bestRank ASC, attempts ASC").bind(code).all();
  return {
    code: room.code,
    name: room.name,
    solved: Boolean(room.solved),
    ...(room.solved ? { answer: room.target } : {}),
    guesses: guesses.results,
    players: players.results,
  };
}
