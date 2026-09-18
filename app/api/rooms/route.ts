import { ensureGameSchema, readRoom } from "../../../db/game";
import { pickTarget } from "../../../lib/words";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCode = () => Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({})) as { player?: string };
  const player = payload.player?.trim().slice(0, 20) || "Игрок";
  const db = await ensureGameSchema();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    try {
      await db.prepare("INSERT INTO rooms (code, name, target) VALUES (?, ?, ?)").bind(code, `Комната ${player}`, pickTarget(Date.now() + attempt)).run();
      return Response.json({ room: await readRoom(code) }, { status: 201 });
    } catch { /* retry a rare code collision */ }
  }
  return Response.json({ error: "Не удалось создать комнату" }, { status: 500 });
}
