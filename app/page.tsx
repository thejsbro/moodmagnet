"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type MoodColor = {
  name: string;
  hex: string;
};

// ─── Data ────────────────────────────────────────────────────────────────────

const MOOD_COLORS: MoodColor[] = [
  { name: "Pink",   hex: "#E8365D" },
  { name: "Teal",   hex: "#3DBFA0" },
  { name: "Coral",  hex: "#F07840" },
  { name: "Rose",   hex: "#E0426A" },
  { name: "Amber",  hex: "#F0C040" },
  { name: "Purple", hex: "#9B59B6" },
  { name: "Blue",   hex: "#5B9BD5" },
  { name: "Green",  hex: "#4DC47A" },
];

const MIND_STATES    = ["Confused", "Calm", "Empty", "Noisy"];
const BODY_SENSATIONS = ["Heavy", "Light", "Tense", "Restless"];
const SOCIAL_DESIRES = ["Isolated", "Cozy-alone", "Open", "Craving connection"];
const TIME_PERCEPTIONS = ["Stuck", "Slow", "Flowing", "Rushing"];
const EMOTIONAL_WEATHERS = ["Stormy", "Cloudy", "Clearing", "Sunny"];

// ─── Color cluster layout (relative positions) ───────────────────────────────
// Arranged in a roughly circular cluster matching the Figma design
const COLOR_POSITIONS: { name: string; x: number; y: number }[] = [
  { name: "Pink",   x: 90,  y: 0   },
  { name: "Teal",   x: 35,  y: 30  },
  { name: "Coral",  x: 145, y: 30  },
  { name: "Rose",   x: 10,  y: 85  },
  { name: "Amber",  x: 170, y: 85  },
  { name: "Purple", x: 35,  y: 140 },
  { name: "Blue",   x: 90,  y: 160 },
  { name: "Green",  x: 145, y: 140 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toGrid(items: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push([items[i], items[i + 1]]);
  }
  return pairs;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold tracking-widest text-zinc-500 uppercase">
      {children}
    </p>
  );
}

function ToggleButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-full border py-3 text-sm font-semibold transition-colors ${
        selected
          ? "border-white bg-white text-black"
          : "border-zinc-700 bg-transparent text-white hover:border-zinc-500"
      }`}
    >
      {label}
    </button>
  );
}

function ToggleGrid({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {toGrid(options).map(([a, b]) => (
        <div key={a} className="flex gap-2">
          <ToggleButton label={a} selected={selected.includes(a)} onClick={() => onToggle(a)} />
          {b && (
            <ToggleButton label={b} selected={selected.includes(b)} onClick={() => onToggle(b)} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function Home() {
  const [mindStates, setMindStates]           = useState<string[]>([]);
  const [moodColor, setMoodColor]             = useState<string>("Pink");
  const [energyLevel, setEnergyLevel]         = useState<number>(50);
  const [bodySensations, setBodySensations]   = useState<string[]>([]);
  const [socialDesires, setSocialDesires]     = useState<string[]>([]);
  const [timePerceptions, setTimePerceptions] = useState<string[]>([]);
  const [emotionalWeathers, setEmotionalWeathers] = useState<string[]>([]);

  const activeColor = MOOD_COLORS.find((c) => c.name === moodColor)?.hex ?? "#E8365D";

  function toggle(arr: string[], setArr: (v: string[]) => void, value: string) {
    setArr(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <div className="mx-auto max-w-[400px] px-6 pb-28 pt-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold">How are you feeling?</h1>
          <p className="text-sm text-zinc-400">Take a moment to check in with yourself</p>
        </div>

        {/* Mind State */}
        <section className="mb-8">
          <SectionLabel>Mind State</SectionLabel>
          <ToggleGrid
            options={MIND_STATES}
            selected={mindStates}
            onToggle={(v) => toggle(mindStates, setMindStates, v)}
          />
        </section>

        {/* Mood Color */}
        <section className="mb-8">
          <SectionLabel>Mood Color</SectionLabel>
          <div className="relative mx-auto" style={{ width: 210, height: 200 }}>
            {COLOR_POSITIONS.map(({ name, x, y }) => {
              const color = MOOD_COLORS.find((c) => c.name === name)!;
              const isSelected = moodColor === name;
              return (
                <button
                  key={name}
                  onClick={() => setMoodColor(name)}
                  className="absolute flex flex-col items-center gap-1"
                  style={{ left: x, top: y, zIndex: isSelected ? 10 : 1 }}
                >
                  <div
                    className="rounded-full transition-all flex items-center justify-center"
                    style={{
                      width: isSelected ? 48 : 38,
                      height: isSelected ? 48 : 38,
                      backgroundColor: color.hex,
                      outline: isSelected ? `3px solid white` : "none",
                      outlineOffset: 2,
                    }}
                  >
                    {isSelected && (
                      <span className="text-[14px] font-semibold text-white drop-shadow leading-none text-center px-0.5">
                        {name}
                      </span>
                    )}
                  </div>
                  {!isSelected && (
                    <span className="text-[14px] text-zinc-400">{name}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Energy Level */}
        <section className="mb-8">
          <SectionLabel>Energy Level</SectionLabel>
          <p className="mb-2 text-center text-sm font-semibold" style={{ color: activeColor }}>
            {energyLevel}%
          </p>
          <input
            type="range"
            min={0}
            max={100}
            value={energyLevel}
            onChange={(e) => setEnergyLevel(Number(e.target.value))}
            className="energy-slider w-full cursor-pointer appearance-none rounded-full"
            style={
              {
                "--active-color": activeColor,
                "--fill-pct": `${energyLevel}%`,
              } as React.CSSProperties
            }
          />
          <div className="mt-1 flex justify-between text-xs text-zinc-500">
            <span>Drained</span>
            <span>Wired</span>
          </div>
        </section>

        {/* Body Sensation */}
        <section className="mb-8">
          <SectionLabel>Body Sensation</SectionLabel>
          <ToggleGrid
            options={BODY_SENSATIONS}
            selected={bodySensations}
            onToggle={(v) => toggle(bodySensations, setBodySensations, v)}
          />
        </section>

        {/* Social Desire */}
        <section className="mb-8">
          <SectionLabel>Social Desire</SectionLabel>
          <ToggleGrid
            options={SOCIAL_DESIRES}
            selected={socialDesires}
            onToggle={(v) => toggle(socialDesires, setSocialDesires, v)}
          />
        </section>

        {/* Time Perception */}
        <section className="mb-8">
          <SectionLabel>Time Perception</SectionLabel>
          <ToggleGrid
            options={TIME_PERCEPTIONS}
            selected={timePerceptions}
            onToggle={(v) => toggle(timePerceptions, setTimePerceptions, v)}
          />
        </section>

        {/* Emotional Weather */}
        <section className="mb-8">
          <SectionLabel>Emotional Weather</SectionLabel>
          <ToggleGrid
            options={EMOTIONAL_WEATHERS}
            selected={emotionalWeathers}
            onToggle={(v) => toggle(emotionalWeathers, setEmotionalWeathers, v)}
          />
        </section>
      </div>

      {/* Sticky Save button */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-6 pt-3">
        <button
          className="w-full rounded-full py-4 text-base font-semibold text-white transition-colors"
          style={{ backgroundColor: activeColor, maxWidth: 400, display: "block", margin: "0 auto" }}
        >
          Save my mood
        </button>
      </div>
    </div>
  );
}
