import { ensureGameSchema, readRoom } from "../../../../../db/game";
import { pickTarget } from "../../../../../lib/words";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await context.params;
  const code = rawCode.toUpperCase();
  const payload = await request.json().catch(() => ({})) as { action?: string };
  const db = await ensureGameSchema();
  const existing = await db.prepare("SELECT code FROM rooms WHERE code = ?").bind(code).first();
  if (!existing) return Response.json({ error: "Комната не найдена" }, { status: 404 });
  if (payload.action === "new_round") {
    await db.batch([
      db.prepare("DELETE FROM guesses WHERE room_code = ?").bind(code),
      db.prepare("UPDATE rooms SET target = ?, solved = 0, closed = 0 WHERE code = ?").bind(pickTarget(Date.now()), code),
    ]);
  } else if (payload.action === "close") {
    await db.prepare("UPDATE rooms SET closed = 1 WHERE code = ?").bind(code).run();
  } else return Response.json({ error: "Неизвестное действие" }, { status: 400 });
  return Response.json({ room: await readRoom(code) });
}
