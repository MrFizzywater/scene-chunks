// components/structureTemplates.js

// central place to add story structures
export const STRUCTURE_TEMPLATES = {
  "3-act": {
    id: "3-act",
    label: "3-Act (Film)",
    acts: [
      { from: 0, to: 25, label: "Act I" },
      { from: 25, to: 75, label: "Act II" },
      { from: 75, to: 100, label: "Act III" },
    ],
    beats: [
      { id: "opening-image", label: "Opening Image", pct: 0 },
      { id: "setup", label: "Set-up", pct: 5 },
      { id: "inciting-incident", label: "Inciting Incident", pct: 12 },
      { id: "break-into-2", label: "Break into Act II", pct: 25 },
      { id: "fun-and-games", label: "Promise of the Premise", pct: 35 },
      { id: "midpoint", label: "Midpoint", pct: 50 },
      { id: "bad-guys-close-in", label: "Bad Guys Close In", pct: 62 },
      { id: "all-is-lost", label: "All Is Lost", pct: 75 },
      { id: "break-into-3", label: "Break into Act III", pct: 85 },
      { id: "finale", label: "Finale", pct: 95 },
    ],
  },

  "save-the-cat": {
    id: "save-the-cat",
    label: "Save the Cat",
    acts: [
      { from: 0, to: 25, label: "Act I" },
      { from: 25, to: 85, label: "Act II" },
      { from: 85, to: 100, label: "Act III" },
    ],
    beats: [
      { id: "opening-image", label: "Opening Image", pct: 0 },
      { id: "theme-stated", label: "Theme Stated", pct: 5 },
      { id: "setup", label: "Set-up", pct: 10 },
      { id: "catalyst", label: "Catalyst", pct: 12 },
      { id: "debate", label: "Debate", pct: 20 },
      { id: "break-into-2", label: "Break into 2", pct: 25 },
      { id: "b-story", label: "B Story", pct: 30 },
      { id: "fun-and-games", label: "Fun & Games", pct: 35 },
      { id: "midpoint", label: "Midpoint", pct: 50 },
      { id: "bad-guys-close-in", label: "Bad Guys Close In", pct: 62 },
      { id: "all-is-lost", label: "All Is Lost", pct: 75 },
      { id: "dark-night", label: "Dark Night of the Soul", pct: 80 },
      { id: "break-into-3", label: "Break into 3", pct: 85 },
      { id: "finale", label: "Finale", pct: 92 },
      { id: "final-image", label: "Final Image", pct: 100 },
    ],
  },

  // Dan Harmon style story circle
  "story-circle": {
    id: "story-circle",
    label: "Story Circle (Harmon)",
    acts: [
      { from: 0, to: 50, label: "Descent" },
      { from: 50, to: 100, label: "Return" },
    ],
    beats: [
      { id: "1-you", label: "1. You (comfort)", pct: 0 },
      { id: "2-need", label: "2. Need", pct: 12 },
      { id: "3-go", label: "3. Go", pct: 25 },
      { id: "4-search", label: "4. Search", pct: 37 },
      { id: "5-find", label: "5. Find", pct: 50 },
      { id: "6-take", label: "6. Take (pay price)", pct: 62 },
      { id: "7-return", label: "7. Return", pct: 75 },
      { id: "8-change", label: "8. Change", pct: 90 },
    ],
  },

  // hour-long-ish TV with act-outs
  "tv-hour": {
    id: "tv-hour",
    label: "TV Hour (Act-outs)",
    acts: [
      { from: 0, to: 10, label: "Teaser" },
      { from: 10, to: 30, label: "Act I" },
      { from: 30, to: 50, label: "Act II" },
      { from: 50, to: 70, label: "Act III" },
      { from: 70, to: 90, label: "Act IV" },
      { from: 90, to: 100, label: "Tag" },
    ],
    beats: [
      { id: "teaser", label: "Teaser / Hook", pct: 0 },
      { id: "act-out-1", label: "Act-out 1", pct: 30 },
      { id: "act-out-2", label: "Act-out 2", pct: 50 },
      { id: "act-out-3", label: "Act-out 3", pct: 70 },
      { id: "act-out-4", label: "Act-out 4", pct: 90 },
    ],
  },

  // short film flow
  "short-film": {
    id: "short-film",
    label: "Short Film (5-beat)",
    acts: [
      { from: 0, to: 20, label: "Setup" },
      { from: 20, to: 80, label: "Development" },
      { from: 80, to: 100, label: "Payoff" },
    ],
    beats: [
      { id: "hook", label: "Hook / Image", pct: 0 },
      { id: "problem", label: "Problem / Disruption", pct: 15 },
      { id: "complication", label: "Complication / Escalate", pct: 40 },
      { id: "turn", label: "Turn / Reveal", pct: 65 },
      { id: "resolution", label: "Resolution", pct: 90 },
    ],
  },
    // Hero’s Journey (Campbell/Vogler)
  "heros-journey": {
    id: "heros-journey",
    label: "Hero’s Journey (Campbell/Vogler)",
    acts: [
      { from: 0, to: 33, label: "Departure" },
      { from: 33, to: 66, label: "Initiation" },
      { from: 66, to: 100, label: "Return" },
    ],
    beats: [
      { id: "ordinary-world", label: "Ordinary World", pct: 0 },
      { id: "call-to-adventure", label: "Call to Adventure", pct: 10 },
      { id: "refusal", label: "Refusal of the Call", pct: 15 },
      { id: "mentor", label: "Meeting the Mentor", pct: 20 },
      { id: "crossing", label: "Crossing the Threshold", pct: 25 },
      { id: "tests-allies-enemies", label: "Tests, Allies, Enemies", pct: 40 },
      { id: "approach", label: "Approach to the Inmost Cave", pct: 55 },
      { id: "ordeal", label: "Ordeal / Death & Rebirth", pct: 65 },
      { id: "reward", label: "Reward (Seizing the Sword)", pct: 75 },
      { id: "road-back", label: "The Road Back", pct: 85 },
      { id: "resurrection", label: "Resurrection", pct: 92 },
      { id: "return-elixir", label: "Return with the Elixir", pct: 100 },
    ],
  },

  // 5-act (Shakespearean)
  "5-act": {
    id: "5-act",
    label: "5-Act (Shakespearean)",
    acts: [
      { from: 0, to: 20, label: "Act I – Exposition" },
      { from: 20, to: 40, label: "Act II – Rising Action" },
      { from: 40, to: 60, label: "Act III – Climax" },
      { from: 60, to: 80, label: "Act IV – Falling Action" },
      { from: 80, to: 100, label: "Act V – Denouement" },
    ],
    beats: [
      { id: "introduction", label: "Introduction", pct: 5 },
      { id: "inciting", label: "Inciting Incident", pct: 15 },
      { id: "rising", label: "Rising Complications", pct: 35 },
      { id: "climax", label: "Climax", pct: 50 },
      { id: "falling", label: "Falling Action", pct: 70 },
      { id: "resolution", label: "Resolution", pct: 90 },
    ],
  },

  // Mini-movie method (Vogler + Snyder mash)
  "mini-movie": {
    id: "mini-movie",
    label: "Mini-Movie (8 Sequence Film)",
    acts: [
      { from: 0, to: 25, label: "Act I" },
      { from: 25, to: 75, label: "Act II" },
      { from: 75, to: 100, label: "Act III" },
    ],
    beats: [
      { id: "seq1", label: "Sequence 1: Setup", pct: 0 },
      { id: "seq2", label: "Sequence 2: Predicament", pct: 12 },
      { id: "seq3", label: "Sequence 3: First Obstacle", pct: 25 },
      { id: "seq4", label: "Sequence 4: Midpoint Shift", pct: 37 },
      { id: "seq5", label: "Sequence 5: Pressure Mounts", pct: 50 },
      { id: "seq6", label: "Sequence 6: Disaster", pct: 62 },
      { id: "seq7", label: "Sequence 7: Climax Build", pct: 80 },
      { id: "seq8", label: "Sequence 8: Resolution", pct: 95 },
    ],
  },

  // Web Series / Serialized Arc
  "web-series": {
    id: "web-series",
    label: "Web Series (Serialized Arc)",
    acts: [
      { from: 0, to: 33, label: "Episode 1–3: Setup" },
      { from: 33, to: 66, label: "Episode 4–7: Escalation" },
      { from: 66, to: 100, label: "Episode 8–10: Payoff" },
    ],
    beats: [
      { id: "pilot-hook", label: "Pilot Hook", pct: 0 },
      { id: "inciting", label: "Inciting Incident", pct: 10 },
      { id: "first-turn", label: "First Turn / Reveal", pct: 30 },
      { id: "mid-arc", label: "Mid-Season Shift", pct: 50 },
      { id: "dark-turn", label: "Dark Turn / Betrayal", pct: 70 },
      { id: "cliffhanger", label: "Finale / Cliffhanger", pct: 90 },
    ],
  },

  // Experimental (Abstract/Art film)
  "experimental": {
    id: "experimental",
    label: "Experimental (Abstract Flow)",
    acts: [
      { from: 0, to: 50, label: "Exploration" },
      { from: 50, to: 100, label: "Transformation" },
    ],
    beats: [
      { id: "image", label: "Image or Tone Introduction", pct: 0 },
      { id: "gesture", label: "First Gesture / Motif", pct: 20 },
      { id: "shift", label: "Emotional / Visual Shift", pct: 45 },
      { id: "rupture", label: "Rupture / Climax", pct: 70 },
      { id: "echo", label: "Echo / Recontextualization", pct: 90 },
    ],
  },

};

// tiny helper
export function getTemplateById(id) {
  return STRUCTURE_TEMPLATES[id] || STRUCTURE_TEMPLATES["3-act"];
}
