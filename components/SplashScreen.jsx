"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { useProject } from "../context/ProjectContext";

export default function SplashScreen() {
  const router = useRouter();
  const {
    project,
    createNewProject,
    loadFromLocal,
    importFromText,
    loadFromObject,
  } = useProject();

  const fileInputRef = useRef(null);

  // NEW = truly blank (same as header now)
  const handleNew = () => {
    const id = createNewProject();
    router.push(`/project/${id}`);
  };

  // DEMO = you don't have one yet, so just reuse "loadFromObject" later.
  // for now we'll just create blank and you can replace this later.
  const handleDemo = () => {
    const id = createNewProject();
    router.push(`/project/${id}`);
  };

  // TUTORIAL = same deal for now
  const handleTutorial = () => {
    const id = createNewProject();
    router.push(`/project/${id}`);
  };

  // OPEN = same as header "open from local"
  const handleOpen = () => {
    const ok = loadFromLocal();
    if (ok) {
      const id = (project && project.id) || "project";
      router.push(`/project/${id}`);
    } else {
      alert("No saved Scene Chunks project found in this browser.");
    }
  };

  // IMPORT = same behavior as header: JSON → loadFromObject, text → importFromText
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChosen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lower = file.name.toLowerCase();

    // project file
    if (
      lower.endsWith(".json") ||
      lower.endsWith(".scenechunks.json") ||
      lower.endsWith(".scjson")
    ) {
      const ok = loadFromObject(JSON.parse(text));
      if (!ok) {
        alert("That file didn't look like a Scene Chunks project.");
        return;
      }
      const id =
        JSON.parse(text).project?.id || (project && project.id) || "project";
      router.push(`/project/${id}`);
    } else {
      // treat as screenplay text
      importFromText(text);
      const id = (project && project.id) || "project";
      router.push(`/project/${id}`);
    }
  };

  const handleMore = () => {
    window.open("https://natelacroix.com", "_blank");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #0f172a 0%, #020617 45%, #000 90%)",
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "3.1rem",
            fontWeight: 800,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            textShadow: "0 0 22px rgba(87,226,255,0.5)",
          }}
        >
          Scene Chunks
        </div>
        <div style={{ marginTop: 6, color: "rgba(255,255,255,0.55)" }}>
          modular screenwriting, 90s desktop energy
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          width: "340px",
          maxWidth: "90vw",
        }}
      >
        <SplashButton
          onClick={handleNew}
          color="linear-gradient(135deg, #22c55e 0%, #166534 100%)"
          glow="0 0 16px rgba(34,197,94,0.4)"
        >
          🆕 New Project
        </SplashButton>

        <SplashButton
          onClick={handleDemo}
          color="linear-gradient(135deg, #38bdf8 0%, #0f766e 100%)"
          glow="0 0 16px rgba(56,189,248,0.35)"
        >
          🎬 Demo Project
        </SplashButton>

        <SplashButton
          onClick={handleTutorial}
          color="linear-gradient(135deg, #f97316 0%, #c2410c 100%)"
          glow="0 0 16px rgba(249,115,22,0.35)"
        >
          📘 Tutorial Project
        </SplashButton>

        <SplashButton
          onClick={handleImportClick}
          color="linear-gradient(135deg, #a855f7 0%, #6d28d9 100%)"
          glow="0 0 16px rgba(168,85,247,0.35)"
        >
          📂 Import Project / Text
        </SplashButton>

        <SplashButton
          onClick={handleOpen}
          color="linear-gradient(135deg, #f43f5e 0%, #be123c 100%)"
          glow="0 0 16px rgba(244,63,94,0.3)"
        >
          📁 Open Saved
        </SplashButton>

        <SplashButton onClick={handleMore}>🔗 More…</SplashButton>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.scenechunks.json,.scjson,.txt,.md,.fountain,.rtf"
        style={{ display: "none" }}
        onChange={handleFileChosen}
      />
    </div>
  );
}

function SplashButton({ children, onClick, color, glow }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: color || "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px",
        padding: "12px 14px",
        color: "#fff",
        textAlign: "left",
        fontWeight: 600,
        fontSize: "0.82rem",
        cursor: "pointer",
        boxShadow: glow || "none",
        transition: "transform 0.12s ease-out",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      {children}
    </button>
  );
}
