"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type MoodColor = {
  key: string;
  hex: string;
};

// ─── Data ────────────────────────────────────────────────────────────────────

const MOOD_COLORS: MoodColor[] = [
  { key: "pink",   hex: "#E8365D" },
  { key: "teal",   hex: "#3DBFA0" },
  { key: "coral",  hex: "#F07840" },
  { key: "rose",   hex: "#E0426A" },
  { key: "amber",  hex: "#F0C040" },
  { key: "purple", hex: "#9B59B6" },
  { key: "blue",   hex: "#5B9BD5" },
  { key: "green",  hex: "#4DC47A" },
];

const MIND_STATE_KEYS     = ["confused", "calm", "empty", "noisy"] as const;
const BODY_SENSATION_KEYS = ["heavy", "light", "tense", "restless"] as const;
const SOCIAL_DESIRE_KEYS  = ["isolated", "cozyAlone", "open", "cravingConnection"] as const;
const TIME_PERCEPTION_KEYS = ["stuck", "slow", "flowing", "rushing"] as const;
const EMOTIONAL_WEATHER_KEYS = ["stormy", "cloudy", "clearing", "sunny"] as const;

// ─── Color cluster layout (relative positions) ───────────────────────────────
// Arranged in a roughly circular cluster matching the Figma design
const COLOR_POSITIONS: { key: string; x: number; y: number }[] = [
  { key: "pink",   x: 90,  y: 0   },
  { key: "teal",   x: 35,  y: 30  },
  { key: "coral",  x: 145, y: 30  },
  { key: "rose",   x: 10,  y: 85  },
  { key: "amber",  x: 170, y: 85  },
  { key: "purple", x: 35,  y: 140 },
  { key: "blue",   x: 90,  y: 160 },
  { key: "green",  x: 145, y: 140 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toGrid<T>(items: T[]): [T, T | undefined][] {
  const pairs: [T, T | undefined][] = [];
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
  options: { key: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {toGrid(options).map(([a, b]) => (
        <div key={a.key} className="flex gap-2">
          <ToggleButton
            label={a.label}
            selected={selected.includes(a.key)}
            onClick={() => onToggle(a.key)}
          />
          {b && (
            <ToggleButton
              label={b.label}
              selected={selected.includes(b.key)}
              onClick={() => onToggle(b.key)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function Home() {
  const t = useTranslations();

  const [mindStates, setMindStates]               = useState<string[]>([]);
  const [moodColor, setMoodColor]                 = useState<string>("pink");
  const [energyLevel, setEnergyLevel]             = useState<number>(50);
  const [bodySensations, setBodySensations]       = useState<string[]>([]);
  const [socialDesires, setSocialDesires]         = useState<string[]>([]);
  const [timePerceptions, setTimePerceptions]     = useState<string[]>([]);
  const [emotionalWeathers, setEmotionalWeathers] = useState<string[]>([]);

  const activeColor = MOOD_COLORS.find((c) => c.key === moodColor)?.hex ?? "#E8365D";

  function toggle(arr: string[], setArr: (v: string[]) => void, value: string) {
    setArr(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  }

  const mindStateOptions = MIND_STATE_KEYS.map((key) => ({
    key,
    label: t(`mindStates.${key}`),
  }));
  const bodySensationOptions = BODY_SENSATION_KEYS.map((key) => ({
    key,
    label: t(`bodySensations.${key}`),
  }));
  const socialDesireOptions = SOCIAL_DESIRE_KEYS.map((key) => ({
    key,
    label: t(`socialDesires.${key}`),
  }));
  const timePerceptionOptions = TIME_PERCEPTION_KEYS.map((key) => ({
    key,
    label: t(`timePerceptions.${key}`),
  }));
  const emotionalWeatherOptions = EMOTIONAL_WEATHER_KEYS.map((key) => ({
    key,
    label: t(`emotionalWeathers.${key}`),
  }));

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <div className="mx-auto max-w-[400px] px-6 pb-28 pt-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold">{t("heading")}</h1>
          <p className="text-sm text-zinc-400">{t("subtitle")}</p>
        </div>

        {/* Mind State */}
        <section className="mb-8">
          <SectionLabel>{t("sections.mindState")}</SectionLabel>
          <ToggleGrid
            options={mindStateOptions}
            selected={mindStates}
            onToggle={(v) => toggle(mindStates, setMindStates, v)}
          />
        </section>

        {/* Mood Color */}
        <section className="mb-8">
          <SectionLabel>{t("sections.moodColor")}</SectionLabel>
          <div className="relative mx-auto" style={{ width: 210, height: 200 }}>
            {COLOR_POSITIONS.map(({ key, x, y }) => {
              const color = MOOD_COLORS.find((c) => c.key === key)!;
              const isSelected = moodColor === key;
              return (
                <button
                  key={key}
                  onClick={() => setMoodColor(key)}
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
                        {t(`moodColors.${key}`)}
                      </span>
                    )}
                  </div>
                  {!isSelected && (
                    <span className="text-[14px] text-zinc-400">
                      {t(`moodColors.${key}`)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Energy Level */}
        <section className="mb-8">
          <SectionLabel>{t("sections.energyLevel")}</SectionLabel>
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
            <span>{t("energy.drained")}</span>
            <span>{t("energy.wired")}</span>
          </div>
        </section>

        {/* Body Sensation */}
        <section className="mb-8">
          <SectionLabel>{t("sections.bodySensation")}</SectionLabel>
          <ToggleGrid
            options={bodySensationOptions}
            selected={bodySensations}
            onToggle={(v) => toggle(bodySensations, setBodySensations, v)}
          />
        </section>

        {/* Social Desire */}
        <section className="mb-8">
          <SectionLabel>{t("sections.socialDesire")}</SectionLabel>
          <ToggleGrid
            options={socialDesireOptions}
            selected={socialDesires}
            onToggle={(v) => toggle(socialDesires, setSocialDesires, v)}
          />
        </section>

        {/* Time Perception */}
        <section className="mb-8">
          <SectionLabel>{t("sections.timePerception")}</SectionLabel>
          <ToggleGrid
            options={timePerceptionOptions}
            selected={timePerceptions}
            onToggle={(v) => toggle(timePerceptions, setTimePerceptions, v)}
          />
        </section>

        {/* Emotional Weather */}
        <section className="mb-8">
          <SectionLabel>{t("sections.emotionalWeather")}</SectionLabel>
          <ToggleGrid
            options={emotionalWeatherOptions}
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
          {t("saveMood")}
        </button>
      </div>
    </div>
  );
}
