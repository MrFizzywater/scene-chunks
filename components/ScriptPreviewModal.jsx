"use client";

import React, { useMemo, useState } from "react";
import { useProject } from "../context/ProjectContext";

const toolbarBtn = {
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "12px",
  padding: "4px 8px",
  cursor: "pointer",
  fontFamily: "inherit",
};

export default function ScriptPreviewModal({ isOpen, onClose }) {
  const { getActiveScript, chunksById, project } = useProject();
  const [zoom, setZoom] = useState(1);

  const script = getActiveScript();
  const orderedIds = script?.chunkOrder || [];

  // basic meta
  const titleMeta = project?.meta || project?.details || {};
  const titleText = project?.title || titleMeta.title || "UNTITLED SCREENPLAY";
  const authorText =
    titleMeta.author ||
    titleMeta.writtenBy ||
    project?.author ||
    "Written by";
  const writerName =
    titleMeta.writer ||
    titleMeta.by ||
    project?.authorName ||
    project?.author ||
    "";
  const contactText =
    titleMeta.contact ||
    titleMeta.email ||
    titleMeta.company ||
    titleMeta.phone ||
    "";
  const draftText = titleMeta.draft || titleMeta.version || "";

  // build a flowing script – no pagination, just blocks
  const blocks = useMemo(() => {
    const out = [];

    orderedIds.forEach((sceneId) => {
      const scene = chunksById[sceneId];
      if (!scene) return;

      // scene heading
      out.push({
        type: "scene-heading",
        text: (scene.title || "INT. UNKNOWN - DAY").toUpperCase(),
      });

      // scene body
      (scene.body || []).forEach((block) => {
        if (!block) return;

        if (block.type === "dualDialogue") {
          out.push({
            type: "dual-dialogue",
            left: block.left || null,
            right: block.right || null,
          });
          return;
        }

        switch (block.type) {
          case "action": {
            const lines = (block.text || "").split("\n");
            lines.forEach((ln) => {
              out.push({ type: "action", text: ln });
            });
            break;
          }
          case "dialogueBlock": {
            const char = (block.character || "").toUpperCase();
            if (char) {
              out.push({ type: "character", text: char });
            }
            if (block.parenthetical && block.parenthetical.trim() !== "") {
              out.push({
                type: "parenthetical",
                text: "(" + block.parenthetical.trim() + ")",
              });
            }
            const dLines = (block.dialogue || "").split("\n");
            dLines.forEach((ln) => {
              out.push({ type: "dialogue", text: ln });
            });
            break;
          }
          case "transition": {
            out.push({
              type: "transition",
              text: (block.text || "").toUpperCase(),
            });
            break;
          }
          default: {
            if (block.text && block.text.trim() !== "") {
              out.push({ type: "action", text: block.text });
            }
            break;
          }
        }
      });

      // spacer between scenes
      out.push({ type: "spacer" });
    });

    return out;
  }, [orderedIds, chunksById]);

  // plain text export stays simple
  const asPlainText = useMemo(() => {
    const all = [];

    all.push(titleText.toUpperCase());
    all.push("");
    all.push(authorText);
    if (writerName) all.push(writerName);
    if (draftText) {
      all.push("");
      all.push(draftText);
    }
    if (contactText) {
      all.push("");
      all.push(contactText);
    }
    all.push("");
    all.push("-----");
    all.push("");

    blocks.forEach((b) => {
      switch (b.type) {
        case "scene-heading":
          all.push(b.text);
          break;
        case "action":
          all.push(b.text);
          break;
        case "character":
          all.push("               " + b.text);
          break;
        case "parenthetical":
          all.push("             " + b.text);
          break;
        case "dialogue":
          all.push("           " + b.text);
          break;
        case "transition":
          all.push("                               " + b.text);
          break;
        case "dual-dialogue":
          all.push("[DUAL DIALOGUE]");
          if (b.left?.character) all.push("  " + b.left.character);
          if (b.left?.dialogue) all.push("    " + b.left.dialogue);
          if (b.right?.character) all.push("  " + b.right.character);
          if (b.right?.dialogue) all.push("    " + b.right.dialogue);
          break;
        case "spacer":
          all.push("");
          break;
        default:
          all.push("");
      }
    });

    return all.join("\n");
  }, [
    blocks,
    titleText,
    authorText,
    writerName,
    contactText,
    draftText,
  ]);

  const downloadFile = (filename, content, type = "text/plain") => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = (format) => {
    const baseName = (project?.title || "scene-chunks-script")
      .replace(/\s+/g, "-")
      .toLowerCase();

    switch (format) {
      case "txt":
        downloadFile(baseName + ".txt", asPlainText, "text/plain");
        break;
      case "fountain":
        downloadFile(baseName + ".fountain", asPlainText, "text/plain");
        break;
      case "md":
        downloadFile(
          baseName + ".md",
          "```text\n" + asPlainText + "\n```",
          "text/markdown"
        );
        break;
      case "json":
        downloadFile(
          baseName + ".json",
          JSON.stringify({ title: project?.title, blocks }, null, 2),
          "application/json"
        );
        break;
      default:
        break;
    }
  };

  // NEW: print the script in a clean window, but using your current CSS spacing
  const handlePrint = () => {
    const printWin = window.open("", "_blank", "width=900,height=900");
    if (!printWin) return;

    // build script HTML from our blocks using YOUR indents (84px, 205px, etc.)
    const blocksHtml = blocks
      .map((ln) => {
        if (ln.type === "scene-heading") {
          return `<div class="scene-heading">${escapeHtml(ln.text)}</div>`;
        }
        if (ln.type === "action") {
          return `<div class="action">${escapeHtml(ln.text)}</div>`;
        }
        if (ln.type === "character") {
          return `<div class="character">${escapeHtml(ln.text)}</div>`;
        }
        if (ln.type === "parenthetical") {
          return `<div class="parenthetical">${escapeHtml(ln.text)}</div>`;
        }
        if (ln.type === "dialogue") {
          return `<div class="dialogue">${escapeHtml(ln.text)}</div>`;
        }
        if (ln.type === "transition") {
          return `<div class="transition">${escapeHtml(ln.text)}</div>`;
        }
        if (ln.type === "dual-dialogue") {
          return `
            <div class="dual-dialogue">
              <div class="dual-col">
                ${
                  ln.left?.character
                    ? `<div class="character">${escapeHtml(
                        ln.left.character
                      )}</div>`
                    : ""
                }
                ${
                  ln.left?.parenthetical
                    ? `<div class="parenthetical">(${escapeHtml(
                        ln.left.parenthetical
                      )})</div>`
                    : ""
                }
                ${
                  ln.left?.dialogue
                    ? ln.left.dialogue
                        .split("\n")
                        .map(
                          (d) => `<div class="dialogue">${escapeHtml(d)}</div>`
                        )
                        .join("")
                    : ""
                }
              </div>
              <div class="dual-col">
                ${
                  ln.right?.character
                    ? `<div class="character">${escapeHtml(
                        ln.right.character
                      )}</div>`
                    : ""
                }
                ${
                  ln.right?.parenthetical
                    ? `<div class="parenthetical">(${escapeHtml(
                        ln.right.parenthetical
                      )})</div>`
                    : ""
                }
                ${
                  ln.right?.dialogue
                    ? ln.right.dialogue
                        .split("\n")
                        .map(
                          (d) => `<div class="dialogue">${escapeHtml(d)}</div>`
                        )
                        .join("")
                    : ""
                }
              </div>
            </div>
          `;
        }
        if (ln.type === "spacer") {
          return `<div class="spacer"></div>`;
        }
        return "";
      })
      .join("\n");

    const style = `
      <style>
        @page {
          size: 8.5in 11in;
          margin: 1in;
        }
        body {
          margin: 0;
          padding: 0;
          background: #fff;
          font-family: Courier, "Courier New", monospace;
          font-size: 12.5px;
          line-height: 1.4;
        }
        .title-page {
          text-align: center;
          margin-top: 3in;
          margin-bottom: 2in;
          height: 65vh;
        }
        .title-page .title {
          text-transform: uppercase;
          font-size: 20px;
          margin-bottom: 16px;
        }
        /* use your in-app indents */
        .scene-heading {
          text-transform: uppercase;
          margin-bottom: 26px;
          margin-left: 84px;
          margin-right: 48px;
        }
        .action {
          margin-left: 84px;
          margin-right: 48px;
          margin-bottom: 26px;
        }
        .character {
          margin-left: 280px;
          margin-bottom: 3px;
          text-transform: uppercase;
        }
        .parenthetical {
          margin-left: 255px;
          margin-bottom: 3px;
          font-style: italic;
        }
        .dialogue {
          margin-left: 165px;
          margin-right: 132px;
          margin-bottom: 26px;
        }
        .transition {
          text-align: right;
          margin-right: 40px;
          margin-bottom: 8px;
        }
        .spacer {
          height: 14px;
        }
        .dual-dialogue {
          display: flex;
          gap: 16px;
          margin-bottom: 28px;
        }
        .dual-col {
          flex: 1;
        }
      </style>
    `;

    printWin.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(titleText)}</title>
          ${style}
        </head>
        <body>
          <div class="title-page">
            <div class="title">${escapeHtml(titleText)}</div>
            <div>${escapeHtml(authorText)}</div>
            ${writerName ? `<div>${escapeHtml(writerName)}</div>` : ""}
            ${draftText ? `<div>${escapeHtml(draftText)}</div>` : ""}
            ${contactText ? `<div style="margin-top:24px">${escapeHtml(
              contactText
            )}</div>` : ""}
          </div>
          ${blocksHtml}
        </body>
      </html>
    `);

    printWin.document.close();
    printWin.focus();
    printWin.print();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "32px 24px 24px",
      }}
    >
      {/* top bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "42px",
          background: "rgba(30,30,30,0.9)",
          color: "#fff",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 10000,
          backdropFilter: "blur(6px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <strong style={{ fontSize: "13px", color: "#fff" }}>
            {project?.title || "Untitled Project"}
          </strong>
          <span style={{ fontSize: "11px", color: "#aaa", }}>
            {blocks.length} blocks
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button onClick={() => handleExport("txt")} style={toolbarBtn}>
            ⬇ TXT
          </button>
          <button onClick={() => handleExport("fountain")} style={toolbarBtn}>
            ⬇ Fountain
          </button>
          <button onClick={() => handleExport("md")} style={toolbarBtn}>
            ⬇ MD
          </button>
          <button onClick={() => handleExport("json")} style={toolbarBtn}>
            ⬇ JSON
          </button>
          <button onClick={handlePrint} style={toolbarBtn}>
            🖨 Print
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <button
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
              style={toolbarBtn}
            >
              –
            </button>
            <span style={{ fontSize: "11px" }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
              style={toolbarBtn}
            >
              +
            </button>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#ff4444",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontSize: "13px",
              padding: "5px 12px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* flowing preview */}
      <div
        style={{
          background: "#fff",
          color: "#000",
          width: "min(820px, 100%)",
          maxHeight: "85vh",
          overflowY: "auto",
          borderRadius: "6px",
          boxShadow: "0 10px 34px rgba(0,0,0,0.35)",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            padding: "56px 60px 50px",
            fontFamily: "Courier, 'Courier New', monospace",
            fontSize: "12.5px",
            lineHeight: "1.4",
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            width: `${100 / zoom}%`,
            background: "#fff",
          }}
        >
          {/* title page-ish */}
          <div
            style={{
              minHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "48px",
            }}
          >
            <div style={{ textTransform: "uppercase", marginBottom: "16px" }}>
              {titleText}
            </div>
            <div style={{ marginBottom: "4px" }}>{authorText}</div>
            {writerName ? (
              <div style={{ marginBottom: "28px" }}>{writerName}</div>
            ) : (
              <div style={{ marginBottom: "28px" }} />
            )}
            {draftText ? (
              <div style={{ marginBottom: "8px", fontSize: "11px" }}>
                {draftText}
              </div>
            ) : null}
            {contactText ? (
              <div style={{ marginTop: "42px", fontSize: "11px" }}>
                Contact: {contactText}
              </div>
            ) : null}
          </div>

          {/* flowing script */}
          {blocks.map((ln, idx) => {
            if (ln.type === "scene-heading") {
              return (
                <div
                  key={idx}
                  style={{
                    textTransform: "uppercase",
                    marginBottom: "26px",
                    marginLeft: "84px",
                    marginRight: "48px",
                  }}
                >
                  {ln.text}
                </div>
              );
            }
            if (ln.type === "action") {
              return (
                <div
                  key={idx}
                  style={{
                    marginLeft: "84px",
                    marginRight: "48px",
                    marginBottom: "26px",
                  }}
                >
                  {ln.text}
                </div>
              );
            }
            if (ln.type === "character") {
              return (
                <div
                  key={idx}
                  style={{
                    marginLeft: "280px",
                    marginBottom: "3px",
                    textTransform: "uppercase",
                  }}
                >
                  {ln.text}
                </div>
              );
            }
            if (ln.type === "parenthetical") {
              return (
                <div
                  key={idx}
                  style={{
                    marginLeft: "255px",
                    marginBottom: "3px",
                    fontStyle: "italic",
                  }}
                >
                  {ln.text}
                </div>
              );
            }
            if (ln.type === "dialogue") {
              return (
                <div
                  key={idx}
                  style={{
                    marginLeft: "205px",
                    marginRight: "172px",
                    marginBottom: "26px",
                  }}
                >
                  {ln.text}
                </div>
              );
            }
            if (ln.type === "transition") {
              return (
                <div
                  key={idx}
                  style={{
                    textAlign: "right",
                    marginRight: "40px",
                    marginBottom: "8px",
                  }}
                >
                  {ln.text}
                </div>
              );
            }
            if (ln.type === "dual-dialogue") {
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    gap: "16px",
                    marginBottom: "28px",
                  }}
                >
                  {/* LEFT */}
                  <div style={{ flex: 1 }}>
                    {ln.left?.character ? (
                      <div
                        style={{
                          textTransform: "uppercase",
                          marginLeft: "72px",
                          marginBottom: "3px",
                        }}
                      >
                        {ln.left.character}
                      </div>
                    ) : null}
                    {ln.left?.parenthetical ? (
                      <div
                        style={{
                          marginLeft: "60px",
                          marginBottom: "3px",
                          fontStyle: "italic",
                        }}
                      >
                        ({ln.left.parenthetical})
                      </div>
                    ) : null}
                    {ln.left?.dialogue
                      ? ln.left.dialogue.split("\n").map((d, i) => (
                          <div
                            key={i}
                            style={{
                              marginLeft: "48px",
                              marginRight: "10px",
                              marginBottom: "3px",
                            }}
                          >
                            {d}
                          </div>
                        ))
                      : null}
                  </div>

                  {/* RIGHT */}
                  <div style={{ flex: 1 }}>
                    {ln.right?.character ? (
                      <div
                        style={{
                          textTransform: "uppercase",
                          marginLeft: "10px",
                          marginBottom: "3px",
                        }}
                      >
                        {ln.right.character}
                      </div>
                    ) : null}
                    {ln.right?.parenthetical ? (
                      <div
                        style={{
                          marginLeft: "0px",
                          marginBottom: "3px",
                          fontStyle: "italic",
                        }}
                      >
                        ({ln.right.parenthetical})
                      </div>
                    ) : null}
                    {ln.right?.dialogue
                      ? ln.right.dialogue.split("\n").map((d, i) => (
                          <div
                            key={i}
                            style={{
                              marginLeft: "0px",
                              marginRight: "20px",
                              marginBottom: "3px",
                            }}
                          >
                            {d}
                          </div>
                        ))
                      : null}
                  </div>
                </div>
              );
            }
            if (ln.type === "spacer") {
              return <div key={idx} style={{ height: "14px" }} />;
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}

// helper
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
