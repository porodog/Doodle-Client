import { useState } from "react";
import GameRoom from "./GameRoom";

function App() {
  const [nickname, setNickname] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);

  const handleJoin = () => {
    if (!nickname.trim()) return;

    // 방 코드 없으면 자동 생성
    const finalRoomId =
      roomId.trim() || Math.random().toString(36).slice(2, 8);

    setRoomId(finalRoomId);
    setJoined(true);
  };

  if (!joined) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          margin: 0,
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui",
          background: "#fdf9ff",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: "20px 20px 18px",
            borderRadius: "18px",
            boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
            width: "320px",
          }}
        >
          <h1
            style={{
              fontSize: "22px",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>🐥</span>
            <span style={{ color: "#111" }}>Doodle Party</span>
          </h1>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontSize: "13px" }}>닉네임</label>
            <input
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "10px",
                border: "1px solid #e4d9ff",
                marginTop: "4px",
                fontSize: "13px",
              }}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "13px" }}>방 코드 (비워두면 자동 생성)</label>
            <input
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "10px",
                border: "1px solid #e4d9ff",
                marginTop: "4px",
                fontSize: "13px",
              }}
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="예: party1"
            />
          </div>
          <button
            onClick={handleJoin}
            style={{
              width: "100%",
              padding: "9px",
              borderRadius: "999px",
              border: "none",
              background:
                "linear-gradient(135deg, #ffb3d1 0%, #ffc6ff 50%, #b5e8c3 100%)",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            입장하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        fontFamily: "system-ui",
      }}
    >
      <GameRoom nickname={nickname} roomId={roomId} />
    </div>
  );
}

export default App;
