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

  // -------------------------------------------------------------------------
  // 1. Build the Script Blocks
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // 2. Generate Plain Text (for Fountain/TXT export)
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // 3. Printing Logic (Mirrors strict CSS)
  // -------------------------------------------------------------------------
  const handlePrint = () => {
    const printWin = window.open("", "_blank", "width=900,height=900");
    if (!printWin) return;

    // Generate inner HTML
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
                ${ln.left?.character ? `<div class="character">${escapeHtml(ln.left.character)}</div>` : ""}
                ${ln.left?.parenthetical ? `<div class="parenthetical">(${escapeHtml(ln.left.parenthetical)})</div>` : ""}
                ${ln.left?.dialogue ? ln.left.dialogue.split("\n").map(d => `<div class="dialogue">${escapeHtml(d)}</div>`).join("") : ""}
              </div>
              <div class="dual-col">
                ${ln.right?.character ? `<div class="character">${escapeHtml(ln.right.character)}</div>` : ""}
                ${ln.right?.parenthetical ? `<div class="parenthetical">(${escapeHtml(ln.right.parenthetical)})</div>` : ""}
                ${ln.right?.dialogue ? ln.right.dialogue.split("\n").map(d => `<div class="dialogue">${escapeHtml(d)}</div>`).join("") : ""}
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

    // Strict Screenplay CSS for Print
    const style = `
      <style>
        @page {
          size: 8.5in 11in;
          margin: 1in 1in 1in 1.5in; /* Top, Right, Bottom, Left (binding) */
        }
        body {
          margin: 0;
          padding: 0;
          font-family: "Courier Prime", "Courier New", Courier, monospace;
          font-size: 12pt;
          line-height: 1;
        }
        .title-page {
          text-align: center;
          margin-top: 3.5in;
          margin-bottom: 2in;
          page-break-after: always;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        /* Elements relative to the content area (inside margins) */
        .scene-heading {
          font-weight: bold;
          margin-top: 1rem;
          margin-bottom: 1rem;
          text-transform: uppercase;
        }
        .action {
          margin-bottom: 1rem;
        }
        .character {
          margin-top: 1rem;
          margin-left: 2.0in; /* relative to margin */
          text-transform: uppercase;
        }
        .parenthetical {
          margin-left: 1.5in;
          font-style: italic;
        }
        .dialogue {
          margin-left: 1.0in;
          margin-right: 1.0in;
          margin-bottom: 1rem;
        }
        .transition {
          text-align: right;
          margin-bottom: 1rem;
        }
        .spacer {
          height: 1rem;
        }
        .dual-dialogue {
          display: flex;
          gap: 0.5in;
          margin-bottom: 1rem;
        }
        .dual-col { flex: 1; }
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
            <div style="font-size: 24pt; text-transform: uppercase; margin-bottom: 1rem;">${escapeHtml(titleText)}</div>
            <div style="margin-bottom: 2rem;">${escapeHtml(authorText)} ${writerName ? escapeHtml(writerName) : ""}</div>
            ${draftText ? `<div style="font-size: 10pt;">${escapeHtml(draftText)}</div>` : ""}
            ${contactText ? `<div style="position: absolute; bottom: 1in; left: 0; right: 0; font-size: 10pt;">${escapeHtml(contactText)}</div>` : ""}
          </div>
          ${blocksHtml}
        </body>
      </html>
    `);

    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 500); // Small delay to ensure styles load
  };

  if (!isOpen) return null;

  // -------------------------------------------------------------------------
  // 4. Styles for the Preview Window (Visual Consistency)
  // -------------------------------------------------------------------------
  
  // Standard Screenplay Dimensions (in px @ 96dpi)
  // 8.5in = 816px
  // 11in = 1056px
  const PAGE_WIDTH_PX = 816;
  
  // Padding inside the page to simulate margins
  // Left: 1.5in = 144px
  // Right: 1in = 96px
  // Top/Bottom: 1in = 96px
  const PAD_LEFT = 144;
  const PAD_RIGHT = 96;
  const PAD_Y = 96;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)", // Darker backdrop for focus
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* TOOLBAR */}
      <div
        style={{
          width: "100%",
          height: "50px",
          background: "#1e1e1e",
          borderBottom: "1px solid #333",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          flexShrink: 0,
        }}
      >
        <div style={{ color: "#fff", fontWeight: "bold", fontSize: "14px" }}>
          {project?.title || "Script Preview"}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
           {/* Zoom Controls */}
           <div style={{display:'flex', alignItems:'center', background:'#333', borderRadius:'4px', marginRight:'12px'}}>
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} style={{...toolbarBtn, border:'none', background:'transparent'}}>-</button>
              <span style={{color:'#fff', fontSize:'12px', minWidth:'40px', textAlign:'center'}}>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2.0, z + 0.1))} style={{...toolbarBtn, border:'none', background:'transparent'}}>+</button>
           </div>

          <button onClick={() => handleExport("txt")} style={toolbarBtn}>TXT</button>
          <button onClick={() => handleExport("fountain")} style={toolbarBtn}>Fountain</button>
          <button onClick={handlePrint} style={{...toolbarBtn, background:'#007bff', borderColor:'#0056b3'}}>🖨 Print / PDF</button>
          <button onClick={onClose} style={{...toolbarBtn, background:'#d32f2f', borderColor:'#b71c1c'}}>Close</button>
        </div>
      </div>

      {/* SCROLLABLE AREA */}
      <div
        style={{
          flex: 1,
          width: "100%",
          overflowY: "auto",
          overflowX: "hidden", // Prevent horizontal scroll on the wrapper
          padding: "40px 0",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start", // align top so page grows down
        }}
      >
        {/* THE PAGE (Scaled) */}
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            // We do not set width % here, we set exact pixel width of a page
            width: `${PAGE_WIDTH_PX}px`, 
            minHeight: "1056px", // 11in
            background: "white",
            boxShadow: "0 0 50px rgba(0,0,0,0.5)",
            padding: `${PAD_Y}px ${PAD_RIGHT}px ${PAD_Y}px ${PAD_LEFT}px`,
            color: "black",
            fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
            fontSize: "12pt", // Standard screenplay font size
            lineHeight: "1", // Tighter line height for screenplays
          }}
        >
            {/* Title Page (Simplified for preview) */}
            <div style={{textAlign:'center', marginBottom:'80px', marginTop:'150px'}}>
                <div style={{textTransform:'uppercase', textDecoration:'underline', marginBottom:'20px'}}>{titleText}</div>
                <div style={{fontSize:'12px'}}>by</div>
                <div style={{marginBottom:'10px'}}>{authorText} {writerName}</div>
            </div>

            {/* Script Content */}
            {blocks.map((ln, idx) => {
                const key = idx;
                
                // --- MARGIN LOGIC (Relative to the padded content area) ---
                // We use pixel values that approximate standard 12pt courier spacing
                
                if (ln.type === "scene-heading") {
                    return <div key={key} style={{ fontWeight: "bold", textTransform: "uppercase", marginTop: "24px", marginBottom: "12px" }}>{ln.text}</div>;
                }
                if (ln.type === "action") {
                    return <div key={key} style={{ marginBottom: "16px" }}>{ln.text}</div>;
                }
                if (ln.type === "character") {
                    return <div key={key} style={{ marginLeft: "192px", marginTop: "12px", textTransform: "uppercase" }}>{ln.text}</div>;
                }
                if (ln.type === "parenthetical") {
                    return <div key={key} style={{ marginLeft: "144px", fontStyle: "italic" }}>{ln.text}</div>;
                }
                if (ln.type === "dialogue") {
                    return <div key={key} style={{ marginLeft: "96px", marginRight: "96px", marginBottom: "16px" }}>{ln.text}</div>;
                }
                if (ln.type === "transition") {
                    return <div key={key} style={{ textAlign: "right", marginBottom: "16px" }}>{ln.text}</div>;
                }
                if (ln.type === "dual-dialogue") {
                    return (
                        <div key={key} style={{ display: "flex", gap: "24px", marginBottom: "16px" }}>
                            <div style={{ flex: 1 }}>
                                {ln.left?.character && <div style={{ textAlign: "center", textTransform: "uppercase" }}>{ln.left.character}</div>}
                                {ln.left?.dialogue && <div style={{ fontSize: "12pt" }}>{ln.left.dialogue}</div>}
                            </div>
                            <div style={{ flex: 1 }}>
                                {ln.right?.character && <div style={{ textAlign: "center", textTransform: "uppercase" }}>{ln.right.character}</div>}
                                {ln.right?.dialogue && <div style={{ fontSize: "12pt" }}>{ln.right.dialogue}</div>}
                            </div>
                        </div>
                    );
                }
                if (ln.type === "spacer") return <div key={key} style={{height:"16px"}} />;
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