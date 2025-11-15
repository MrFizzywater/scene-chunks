// app/project/[projectId]/page.jsx
"use client";

import React, { useState } from "react";
import { ProjectProvider } from "../../../context/ProjectContext";

import ProjectHeaderBar from "../../../components/ProjectHeaderBar";
import ChunkListSidebar from "../../../components/ChunkListSidebar";
import ChunkEditor from "../../../components/ChunkEditor";
import ChunkDetailsPanel from "../../../components/ChunkDetailsPanel";
import BottomBar from "../../../components/BottomBar";
import ScriptPreviewModal from "../../../components/ScriptPreviewModal";
import ImportTextWizard from "../../../components/ImportTextWizard";

const HEADER_HEIGHT = 48;
const FOOTER_HEIGHT = 48;

export default function ProjectPage() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const openPreview = () => setIsPreviewOpen(true);
  const closePreview = () => setIsPreviewOpen(false);

  return (
    <ProjectProvider>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          background: "#000",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ height: HEADER_HEIGHT }}>
          <ProjectHeaderBar />
        </div>
        <ImportTextWizard />

        {/* Main content row */}
        <div
          style={{
            display: "flex",
            height: "100vh",
            minHeight: 0,
            borderTop: "1px solid #444",
            borderBottom: "1px solid #444",
            overflow: "hidden",
          }}
        >
          {/* LEFT SIDEBAR */}
          <div
            style={{
              position: "sticky",
              top: HEADER_HEIGHT,
              height: "100vh",
              flexShrink: 0,
              zIndex: 10,
            }}
          >
            {/* no firebase props needed anymore */}
            <ChunkListSidebar />
          </div>

          {/* MAIN EDITOR */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              overflowY: "auto",
              background: "#0b0b0b",
            }}
          >
            <ChunkEditor />
          </div>

          {/* RIGHT DETAILS PANEL */}
          <div
            style={{
              position: "sticky",
              top: HEADER_HEIGHT,
              height: `calc(100vh - ${HEADER_HEIGHT}px - ${FOOTER_HEIGHT}px)`,
              width: "320px",
              flexShrink: 0,
              background: "#0a0a0a",
              borderLeft: "1px solid #333",
              overflowY: "auto",
              zIndex: 10,
            }}
          >
            <ChunkDetailsPanel />
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ height: FOOTER_HEIGHT }}>
          <BottomBar onOpenPreview={openPreview} />
        </div>

        <ScriptPreviewModal isOpen={isPreviewOpen} onClose={closePreview} />
      </div>
    </ProjectProvider>
  );
}
