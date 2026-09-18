import { readRoom } from "../../../../db/game";

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const room = await readRoom(code.toUpperCase());
  if (!room) return Response.json({ error: "Комната не найдена" }, { status: 404 });
  return Response.json({ room });
}
