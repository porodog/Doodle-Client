import { useEffect, useState } from "react";
import { socket } from "./Socket";

type ChatMessage = {
  nickname: string;
  message: string;
  correct?: boolean;
  system?: boolean;
};

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const chatHandler = (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    };

    const answerHandler = (data: any) => {
      setMessages((prev) => [
        ...prev,
        {
          nickname: "SYSTEM",
          message: `${data.nickname} 님 정답! (${data.word})`,
          correct: true,
          system: true,
        },
      ]);
    };

    const systemHandler = (data: { message: string }) => {
      setMessages((prev) => [
        ...prev,
        { nickname: "SYSTEM", message: data.message, system: true },
      ]);
    };

    const roundEndedHandler = (data: { reason: string }) => {
      setMessages((prev) => [
        ...prev,
        { nickname: "SYSTEM", message: data.reason, system: true },
      ]);
    };

    const gameEndedHandler = (data: any) => {
      setMessages((prev) => [
        ...prev,
        {
          nickname: "SYSTEM",
          message: "게임이 종료되었습니다!",
          system: true,
        },
      ]);
    };

    socket.on("chat", chatHandler);
    socket.on("answerResult", answerHandler);
    socket.on("systemMessage", systemHandler);
    socket.on("roundEnded", roundEndedHandler);
    socket.on("gameEnded", gameEndedHandler);

    return () => {
      socket.off("chat", chatHandler);
      socket.off("answerResult", answerHandler);
      socket.off("systemMessage", systemHandler);
      socket.off("roundEnded", roundEndedHandler);
      socket.off("gameEnded", gameEndedHandler);
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("answer", { message: input.trim() });
    setInput("");
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "14px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: "6px",
          fontSize: "13px",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: "3px",
              color: msg.system
                ? "#777"
                : msg.correct
                ? "#d6004a"
                : "#333",
              fontWeight: msg.correct || msg.system ? 700 : 400,
            }}
          >
            <strong>{msg.nickname}:</strong> {msg.message}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "4px" }}>
        <input
          style={{
            flex: 1,
            border: "1px solid #eadfff",
            borderRadius: "999px",
            padding: "6px 10px",
            fontSize: "13px",
          }}
          placeholder="정답 또는 메시지 입력..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "6px 10px",
            borderRadius: "999px",
            background:
              "linear-gradient(135deg, #ffb3d1 0%, #ffc6ff 50%, #b5e8c3 100%)",
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "13px",
          }}
        >
          전송
        </button>
      </div>
    </div>
  );
}
