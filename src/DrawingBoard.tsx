import { useEffect, useRef, useState } from "react";
import { socket } from "./Socket";

type Props = {
  roomId: string;
  isDrawer: boolean;
};

const COLORS = [
  "#ff9ebb",
  "#ffd1dc",
  "#fff4b8",
  "#b5e8c3",
  "#aee4ff",
  "#d1c2ff",
  "#ffc6ff",
  "#ffebc6",
];

const LINE_WIDTHS = [2, 4, 6];

export default function DrawingBoard({ roomId, isDrawer }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const [color, setColor] = useState<string>("#333333");
  const [lineWidth, setLineWidth] = useState<number>(3);

  const drawLineLocal = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    c?: string,
    w?: number
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = c ?? color;
    ctx.lineWidth = w ?? lineWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };

  const clearLocalCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const drawHandler = (data: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      color?: string;
      lineWidth?: number;
    }) => {
      drawLineLocal(
        data.x0,
        data.y0,
        data.x1,
        data.y1,
        data.color,
        data.lineWidth
      );
    };

    const clearHandler = () => clearLocalCanvas();

    socket.on("draw", drawHandler);
    socket.on("clearCanvas", clearHandler);

    return () => {
      socket.off("draw", drawHandler);
      socket.off("clearCanvas", clearHandler);
    };
  }, [color, lineWidth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer) {
      lastPosRef.current = null;
      return;
    }
    if (e.buttons !== 1) {
      lastPosRef.current = null;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (lastPosRef.current) {
      const { x: x0, y: y0 } = lastPosRef.current;
      drawLineLocal(x0, y0, x, y);
      socket.emit("draw", {
        roomId,
        x0,
        y0,
        x1: x,
        y1: y,
        color,
        lineWidth,
      });
    }

    lastPosRef.current = { x, y };
  };

  const handleClear = () => {
    if (!isDrawer) return;
    clearLocalCanvas();
    socket.emit("clearCanvas", { roomId });
  };

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: "12px",
        }}
      >
        <span style={{ fontSize: "13px" }}>🎨 펜</span>
        <div style={{ display: "flex", gap: 4 }}>
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => isDrawer && setColor(c)}
              style={{
                width: 18,
                height: 18,
                borderRadius: "999px",
                border: c === color ? "2px solid #333" : "1px solid #ccc",
                background: c,
                cursor: isDrawer ? "pointer" : "default",
              }}
            />
          ))}
        </div>
        <span style={{ marginLeft: 6 }}>굵기</span>
        <div style={{ display: "flex", gap: 4 }}>
          {LINE_WIDTHS.map((w) => (
            <button
              key={w}
              onClick={() => isDrawer && setLineWidth(w)}
              style={{
                padding: "2px 6px",
                borderRadius: "999px",
                border:
                  w === lineWidth ? "1px solid #333" : "1px solid #ddd",
                fontSize: "11px",
                cursor: isDrawer ? "pointer" : "default",
                background: "#fff",
              }}
            >
              {w === 2 ? "얇게" : w === 4 ? "보통" : "굵게"}
            </button>
          ))}
        </div>
        {isDrawer && (
          <button
            onClick={handleClear}
            style={{
              marginLeft: "auto",
              padding: "4px 10px",
              borderRadius: "999px",
              border: "none",
              background: "#ffb3d1",
              fontSize: "11px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            지우기 🧽
          </button>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          style={{
            width: "100%",
            height: "100%",
            background: "#ffffff",
            borderRadius: "18px",
            boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
            opacity: isDrawer ? 1 : 0.4,
            cursor: isDrawer ? "crosshair" : "not-allowed",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
