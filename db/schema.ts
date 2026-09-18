import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const rooms = sqliteTable("rooms", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  target: text("target").notNull(),
  solved: integer("solved").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const guesses = sqliteTable("guesses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roomCode: text("room_code").notNull(),
  player: text("player").notNull(),
  word: text("word").notNull(),
  score: integer("score").notNull(),
  rank: integer("rank").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
