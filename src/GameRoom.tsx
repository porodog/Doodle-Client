import { useEffect, useRef, useState } from "react";
import { socket } from "./Socket";
import DrawingBoard from "./DrawingBoard";
import Chat from "./Chat";

type Props = {
  nickname: string;
  roomId: string;
};

type Player = {
  id: string;
  nickname: string;
  score: number;
};

export default function GameRoom({ nickname, roomId }: Props) {
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [round, setRound] = useState(0);
  const [maxRounds, setMaxRounds] = useState(0);
  const [roundActive, setRoundActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hint, setHint] = useState("");
  const [category, setCategory] = useState("food");
  const [showGameOver, setShowGameOver] = useState(false);
  const [finalPlayers, setFinalPlayers] = useState<Player[]>([]);

  const timerRef = useRef<number | null>(null);

  const isDrawer = socket.id === drawerId;

  useEffect(() => {
    socket.emit("joinRoom", { roomId, nickname });

    const roomStateHandler = (data: any) => {
      setDrawerId(data.drawerId ?? null);
      setPlayers(data.players ?? []);
      setRound(data.round ?? 0);
      setMaxRounds(data.maxRounds ?? 0);
      setRoundActive(Boolean(data.roundActive));
      setCategory(data.category ?? "food");
    };

    const wordHandler = (data: any) => {
      setCurrentWord(data.word);
    };

    const roundStartedHandler = (data: any) => {
      setRound(data.round);
      setMaxRounds(data.maxRounds);
      setDrawerId(data.drawerId ?? null);
      setRoundActive(true);
      setTimeLeft(data.roundDurationSec ?? 40);
      setHint("");
      setShowGameOver(false);

      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    };

    const roundEndedHandler = () => {
      setRoundActive(false);
      setCurrentWord(null);
      setTimeLeft(0);
      setHint("");
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    const gameEndedHandler = (data: { players: Player[] }) => {
      setRoundActive(false);
      setCurrentWord(null);
      setTimeLeft(0);
      setHint("");
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setFinalPlayers(data.players ?? []);
      setShowGameOver(true);
    };

    const hintUpdatedHandler = (data: { hint: string }) => {
      setHint(data.hint || "");
    };

    socket.on("roomState", roomStateHandler);
    socket.on("wordForDrawer", wordHandler);
    socket.on("roundStarted", roundStartedHandler);
    socket.on("roundEnded", roundEndedHandler);
    socket.on("gameEnded", gameEndedHandler);
    socket.on("hintUpdated", hintUpdatedHandler);

    return () => {
      socket.off("roomState", roomStateHandler);
      socket.off("wordForDrawer", wordHandler);
      socket.off("roundStarted", roundStartedHandler);
      socket.off("roundEnded", roundEndedHandler);
      socket.off("gameEnded", gameEndedHandler);
      socket.off("hintUpdated", hintUpdatedHandler);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [nickname, roomId]);

  const handleStartGame = () => {
    setShowGameOver(false);
    socket.emit("startGame");
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const handleSetCategory = (cat: string) => {
    if (!isDrawer) return;
    socket.emit("setCategory", cat);
  };

  const topPlayers = [...finalPlayers].sort((a, b) => b.score - a.score);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        background: "linear-gradient(135deg, #fdf9ff 0%, #ffeef5 100%)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        color: "#000"
      }}
    >
      <header
        style={{
          padding: "6px 12px 4px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 20 }}>🐥</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>
            Doodle Party
          </span>
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          방: <strong>{roomId}</strong> · 나: <strong>{nickname}</strong>
        </div>

        <button
          onClick={handleStartGame}
          style={{
            marginLeft: "auto",
            padding: "6px 12px",
            borderRadius: "999px",
            border: "none",
            background:
              "linear-gradient(135deg, #ffb3d1 0%, #ffc6ff 50%, #b5e8c3 100%)",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          🚀 게임 시작
        </button>

        <div style={{ fontSize: 12 }}>
          라운드:{" "}
          <strong>
            {round}/{maxRounds || "-"}
          </strong>
        </div>
        <div style={{ fontSize: 12 }}>
          남은 시간:{" "}
          <strong>{roundActive ? `${timeLeft}s` : "-"}</strong>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 12 }}>
          <span style={{ fontSize: 12 }}>카테고리:</span>
          {isDrawer ? (
            <select
              value={category}
              onChange={(e) => handleSetCategory(e.target.value)}
              style={{
                borderRadius: 6,
                padding: "2px 6px",
                fontSize: 12,
                border: "1px solid #ddd",
              }}
            >
              <option value="food">🍎 음식</option>
              <option value="animal">🐶 동물</option>
              <option value="object">🏠 사물</option>
            </select>
          ) : (
            <span style={{ fontSize: 12 }}>
              {category === "food" && "🍎 음식"}
              {category === "animal" && "🐶 동물"}
              {category === "object" && "🏠 사물"}
            </span>
          )}
        </div>
      </header>

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "minmax(0, 2.1fr) minmax(260px, 0.9fr)",
          gap: 10,
          padding: "6px 10px 10px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 0 }}>
          {isDrawer && currentWord && (
            <div
              style={{
                alignSelf: "flex-start",
                background: "#fff4b8",
                padding: "6px 10px",
                borderRadius: "999px",
                fontWeight: 700,
                fontSize: 14,
                boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
              }}
            >
              ✏️ 제시어: {currentWord}
            </div>
          )}
          {!isDrawer && hint && (
            <div
              style={{
                alignSelf: "flex-start",
                background: "#ffffffcc",
                padding: "5px 10px",
                borderRadius: "999px",
                fontSize: 13,
                boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
              }}
            >
              💡 힌트(초성): <strong>{hint}</strong>
            </div>
          )}
          <div style={{ flex: 1, minHeight: 0 }}>
            <DrawingBoard roomId={roomId} isDrawer={isDrawer} />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateRows: "minmax(0, 2.2fr) minmax(120px, 1fr)",
            gap: 8,
            height: "100%",
            minHeight: 0,
          }}
        >
          <Chat />
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "10px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
              fontSize: "13px",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <div style={{ marginBottom: 6, fontWeight: 600 }}>
              🏆 플레이어 점수
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                paddingRight: 4,
              }}
            >
              {sortedPlayers.length === 0 && (
                <div style={{ opacity: 0.7 }}>아직 플레이어가 없습니다.</div>
              )}
              {sortedPlayers.map((p, idx) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "2px 0",
                    fontWeight: p.id === socket.id ? 700 : 400,
                    color: p.id === drawerId ? "#ff6f00" : "#333",
                  }}
                >
                  <span>
                    {idx + 1}. {p.nickname}
                    {p.id === drawerId && " ✏️"}
                    {p.id === socket.id && " (나)"}
                  </span>
                  <span>{p.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 게임 종료 연출 오버레이 */}
      {showGameOver && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "18px",
              padding: "18px 20px",
              width: "360px",
              boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 6 }}>🎉 Game Over!</div>
            {topPlayers.length > 0 && (
              <div style={{ marginBottom: 10, fontSize: 16 }}>
                🏆 1등:{" "}
                <strong>
                  {topPlayers[0].nickname} ({topPlayers[0].score}점)
                </strong>
              </div>
            )}

            <div
              style={{
                textAlign: "left",
                marginBottom: 10,
                background: "#fff7fb",
                borderRadius: 12,
                padding: "8px 10px",
                maxHeight: 160,
                overflowY: "auto",
              }}
            >
              {topPlayers.map((p, idx) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "2px 0",
                    fontSize: 13,
                  }}
                >
                  <span>
                    {idx === 0 && "🥇 "}
                    {idx === 1 && "🥈 "}
                    {idx === 2 && "🥉 "}
                    {idx > 2 && `${idx + 1}. `}
                    {p.nickname}
                  </span>
                  <span>{p.score}점</span>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                marginTop: 6,
              }}
            >
              <button
                onClick={() => {
                  setShowGameOver(false);
                  handleStartGame();
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: "999px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #ffb3d1 0%, #ffc6ff 50%, #b5e8c3 100%)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                🔁 다시 하기
              </button>
              <button
                onClick={() => setShowGameOver(false)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "999px",
                  border: "1px solid #ddd",
                  background: "#fff",
                  fontWeight: 500,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
