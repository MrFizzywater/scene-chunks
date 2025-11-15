# Scene Chunks 🎬✂️

**Scene Chunks** is a writing tool for screenwriters who think in **beats**, **blocks**, and **visual chunks** instead of one endless wall of text.

It’s built to help you:
- break your script into manageable “chunks”
- map those chunks to a structure template (3-act, pilot, etc.)
- track characters, props, and locations
- eventually generate shot lists / production info from the same source

Right now it’s in active development and **not** a polished consumer app yet — more like a powerful prototype that’s growing up.

---

## ✨ Features

- 🧩 **Chunk-based writing**
  - Write scenes in small, modular “chunks”
  - Reorder and restructure without breaking the whole script

- 🧱 **Structure-aware**
  - Choose a story structure template
  - See where your chunks land on the structure timeline
  - Helpful labels like “Setup”, “Inciting Incident”, “Midpoint”, etc.

- 👥 **Character / Crew / Props panels**
  - Track who’s in the scene
  - Track what’s needed (locations, props, etc.)
  - Pop-up panels appear alongside your chunk editor

- 💾 **Project-based**
  - Each project is saved as a `.scenechunks.json` file
  - Contains chunks, structure, and panel data
  - Local-first: files live on your machine

- 💻 **Web + Desktop**
  - Run locally in the browser using Next.js
  - Or build a standalone desktop app via Electron

---

## 🧰 Tech Stack

- **Frontend:** Next.js (App Router)
- **Runtime:** React
- **State:** Custom React context (`ProjectContext`)
- **Styling:** Tailwind CSS 4
- **Desktop wrapper:** Electron + electron-builder

---

## 🚀 Getting Started (Dev)

### 1. Clone the repo

    git clone https://github.com/MrFizzywater/scene-chunks.git
    cd scene-chunks

### 2. Install dependencies

    npm install

If npm complains about optional platform binaries, you can also try:

    npm install --omit=optional

### 3. Run the dev server

    npm run dev

Then open your browser at:

    http://localhost:3000

You should see the Scene Chunks UI.

---

## 🧪 Useful Scripts

These may vary slightly depending on your local setup, but a typical `package.json` scripts section looks like:


"scripts": {
  "dev": "next dev",
  "build:web": "next build",
  "start:web": "next start -p 3678",
  "electron": "cross-env NODE_ENV=development electron .",
  "build": "npm run build:web",
  "dist:win": "npm run build:web && cross-env ELECTRON_BUILDER_DISABLE_REBUILD=1 electron-builder --win"
}


(If you don’t want to show JSON in the README, you can remove this fenced block and just describe the scripts in text.)

### Electron dev mode

Two terminals:

Terminal A:
npm run dev


Terminal B:
npm run electron

Electron will open and point at the dev server.

---

## 🧱 Building the Desktop App (Windows)

If you’ve set up `electron-builder` and (optionally) a `pack/` directory using Next’s standalone output, you can produce a Windows installer with:

npm run dist:win
This generates something like:

dist/
  Scene-Chunks Setup.exe


You can copy that `.exe` to any Windows machine and install Scene Chunks like a normal app.

> Note: Code signing and macOS builds are optional.
> For macOS, you’d typically run a similar `dist:mac` command on a Mac.

---

## 📂 Project Files

Scene Chunks uses custom JSON project files:

*.scenechunks.json

These contain:

* project metadata
* list of chunks
* structure mapping
* characters / crew / props / locations info

All stored locally.

---

## 📝 License

This project is licensed under the **MIT License**.

See the [`LICENSE`](./LICENSE) file for details.

---

## 🤝 Contributing / Feedback

If you:

* find a bug
* have ideas for new panels/features
* want to help flesh out structure templates

…feel free to open issues or send PRs.

---

## 💡 Roadmap (loose)

* More structure templates (pilots, shorts, TV)
* Better structure visualization
* Screenplay export
* Shot list & scheduling mode
* Autosave / backup / multi-project support

---

Made with ✂️, 🎬, and probably too much coffee.

