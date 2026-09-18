import { ensureGameSchema, readRoom } from "../../../../../db/game";
import { scoreGuess } from "../../../../../lib/words";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await context.params;
  const code = rawCode.toUpperCase();
  const payload = await request.json().catch(() => ({})) as { player?: string; word?: string };
  const player = payload.player?.trim().slice(0, 20);
  const rawWord = payload.word?.trim().slice(0, 40);
  if (!player || !rawWord) return Response.json({ error: "Введите имя и слово" }, { status: 400 });

  const db = await ensureGameSchema();
  const current = await db.prepare("SELECT target, solved FROM rooms WHERE code = ?").bind(code).first<{ target: string; solved: number }>();
  if (!current) return Response.json({ error: "Комната не найдена" }, { status: 404 });
  if (current.solved) return Response.json({ room: await readRoom(code) });

  const result = scoreGuess(rawWord, current.target);
  if (!result.word) return Response.json({ error: "Введите русское существительное" }, { status: 400 });
  const duplicate = await db.prepare("SELECT id FROM guesses WHERE room_code = ? AND word = ?").bind(code, result.word).first();
  if (duplicate) return Response.json({ error: "Это слово уже называли" }, { status: 409 });

  await db.batch([
    db.prepare("INSERT INTO guesses (room_code, player, word, score, rank) VALUES (?, ?, ?, ?, ?)").bind(code, player, result.word, result.score, result.rank),
    ...(result.score === 100 ? [db.prepare("UPDATE rooms SET solved = 1 WHERE code = ?").bind(code)] : []),
  ]);
  return Response.json({ room: await readRoom(code) });
}
