"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Guess = {
  id: number;
  player: string;
  word: string;
  score: number;
  rank: number;
  createdAt: string;
};

type Room = {
  code: string;
  name: string;
  solved: boolean;
  answer?: string;
  guesses: Guess[];
};

const STORE_KEY = "blizko-player";

export default function Home() {
  const [room, setRoom] = useState<Room | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [player, setPlayer] = useState("");
  const [guess, setGuess] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORE_KEY) || "";
    setPlayer(saved);
    const code = new URLSearchParams(location.search).get("room");
    if (code) setRoomCode(code.toUpperCase());
  }, []);

  const loadRoom = useCallback(async (code: string, quiet = false) => {
    try {
      const response = await fetch(`/api/rooms/${encodeURIComponent(code)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Комната не найдена");
      const data = (await response.json()) as { room: Room };
      setRoom(data.room);
      setRoomCode(data.room.code);
      history.replaceState(null, "", `?room=${data.room.code}`);
      if (!quiet) setStatus("");
    } catch (error) {
      if (!quiet) setStatus(error instanceof Error ? error.message : "Не удалось войти");
    }
  }, []);

  useEffect(() => {
    if (!roomCode || room) return;
    void loadRoom(roomCode);
  }, [loadRoom, room, roomCode]);

  useEffect(() => {
    if (!room) return;
    const timer = setInterval(() => void loadRoom(room.code, true), 2200);
    return () => clearInterval(timer);
  }, [loadRoom, room]);

  const rememberPlayer = () => {
    const cleaned = player.trim().slice(0, 20);
    if (!cleaned) throw new Error("Введите своё имя");
    localStorage.setItem(STORE_KEY, cleaned);
    return cleaned;
  };

  async function createRoom() {
    setBusy(true);
    setStatus("");
    try {
      const name = rememberPlayer();
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ player: name }),
      });
      if (!response.ok) throw new Error("Не удалось создать комнату");
      const data = (await response.json()) as { room: Room };
      setRoom(data.room);
      setRoomCode(data.room.code);
      history.replaceState(null, "", `?room=${data.room.code}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Что-то пошло не так");
    } finally {
      setBusy(false);
    }
  }

  async function joinRoom(event: FormEvent) {
    event.preventDefault();
    try {
      rememberPlayer();
      await loadRoom(roomCode.trim().toUpperCase());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Не удалось войти");
    }
  }

  async function submitGuess(event: FormEvent) {
    event.preventDefault();
    if (!room || !guess.trim() || busy) return;
    setBusy(true);
    setStatus("");
    try {
      const name = rememberPlayer();
      const response = await fetch(`/api/rooms/${room.code}/guess`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ player: name, word: guess.trim() }),
      });
      const data = (await response.json()) as { room?: Room; error?: string };
      if (!response.ok || !data.room) throw new Error(data.error || "Не удалось проверить слово");
      setGuess("");
      setRoom(data.room);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Что-то пошло не так");
    } finally {
      setBusy(false);
    }
  }

  async function shareRoom() {
    if (!room) return;
    const url = `${location.origin}${location.pathname}?room=${room.code}`;
    try {
      if (navigator.share) await navigator.share({ title: "Играем в Близко?", text: `Комната ${room.code}`, url });
      else await navigator.clipboard.writeText(url);
      setStatus("Ссылка скопирована — отправляйте друзьям!");
    } catch { /* sharing was cancelled */ }
  }

  const sortedGuesses = useMemo(
    () => [...(room?.guesses || [])].sort((a, b) => a.rank - b.rank || b.id - a.id),
    [room?.guesses],
  );

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Близко — на главную"><span>БЛИЗ</span><i>К</i><span>О</span><b>●</b></a>
        <div className="online"><span /> играем вместе</div>
      </header>

      {!room ? (
        <section className="landing">
          <div className="eyebrow">СЛОВЕСНАЯ ИГРА ДЛЯ КОМПАНИИ</div>
          <h1>Насколько<br /><em>близко?</em></h1>
          <p className="lede">Угадайте секретное слово вместе. Чем меньше номер догадки — тем ближе загаданное слово.</p>

          <div className="entry-card">
            <label>Как вас зовут?</label>
            <input value={player} onChange={(e) => setPlayer(e.target.value)} placeholder="Например, Ваня" maxLength={20} />
            <button className="primary" onClick={createRoom} disabled={busy}>Создать комнату <span>↗</span></button>
            <div className="divider"><span>или войти по коду</span></div>
            <form className="join" onSubmit={joinRoom}>
              <input value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} placeholder="КОД" maxLength={6} aria-label="Код комнаты" />
              <button aria-label="Войти">→</button>
            </form>
            {status && <p className="status">{status}</p>}
          </div>

          <div className="how">
            <span>01</span><p><b>Создайте комнату</b><small>и отправьте ссылку друзьям</small></p>
            <span>02</span><p><b>Предлагайте слова</b><small>по очереди или все сразу</small></p>
            <span>03</span><p><b>Найдите ответ</b><small>ориентируясь на «теплоту»</small></p>
          </div>
        </section>
      ) : (
        <section className="game">
          <div className="game-head">
            <div><div className="eyebrow">КОМНАТА {room.code}</div><h1>{room.solved ? "Нашли!" : "Ищем слово"}</h1></div>
            <button className="share" onClick={shareRoom}>Пригласить <span>↗</span></button>
          </div>

          {room.solved ? (
            <div className="win-card">
              <div className="confetti">✦　●　✦</div>
              <span>СЕКРЕТНОЕ СЛОВО</span>
              <strong>{room.answer}</strong>
              <p>Вы справились за {room.guesses.length} {room.guesses.length === 1 ? "попытку" : "попыток"}.</p>
              <button className="primary" onClick={() => { setRoom(null); setRoomCode(""); history.replaceState(null, "", location.pathname); }}>Новая игра</button>
            </div>
          ) : (
            <>
              <form className="guess-box" onSubmit={submitGuess}>
                <label htmlFor="guess">Введите любое существительное</label>
                <div><input id="guess" value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Ваша догадка…" autoComplete="off" autoFocus /><button disabled={busy || !guess.trim()}>Проверить</button></div>
              </form>
              {status && <p className="status game-status">{status}</p>}

              <div className="board-head"><span>Лучшие догадки</span><small>{room.guesses.length} попыток</small></div>
              {sortedGuesses.length ? (
                <div className="guesses">
                  {sortedGuesses.map((item, index) => (
                    <div className="guess-row" key={item.id}>
                      <span className="position">{String(index + 1).padStart(2, "0")}</span>
                      <div className="word"><b>{item.word}</b><small>{item.player}</small></div>
                      <div className="heat"><div style={{ width: `${Math.max(4, item.score)}%` }} /></div>
                      <strong className={item.rank <= 100 ? "hot" : item.rank <= 500 ? "warm" : "cold"}>{item.rank}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-board"><span>?</span><p>Первое слово за вами.<br />Начните с чего-нибудь общего.</p></div>
              )}
            </>
          )}
        </section>
      )}
      <footer><span>БЛИЗКО · БЕТА</span><p>Слова сближают</p></footer>
    </main>
  );
}
