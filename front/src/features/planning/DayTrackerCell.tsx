import { useState, useRef, useEffect } from "react";
import { HABIT_OPTIONS } from "./trackingHooks";
import { formatDuration } from "@/lib/duration";
import { formatDateShort, toDateStr } from "@/lib/dates";

function HabitPicker({
  date,
  habits,
  onToggle,
}: {
  date: string;
  habits: string[];
  onToggle: (date: string, emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="flex items-center gap-0.5 mt-0.5 flex-wrap" ref={ref}>
      {habits.length > 0 && (
        <span className="text-xs leading-none">
          {habits.map((emoji) => (
            <button
              key={emoji}
              onClick={(e) => {
                e.stopPropagation();
                onToggle(date, emoji);
              }}
              className="cursor-pointer hover:opacity-60"
              title="Remove"
            >
              {emoji}
            </button>
          ))}
        </span>
      )}
      <div className="relative inline-block">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          className="text-[10px] text-gray-300 hover:text-blue-400 cursor-pointer leading-none"
          title="Log habit"
        >
          +
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-md shadow-sm flex gap-0.5 p-1">
            {HABIT_OPTIONS.map(({ emoji, label }) => {
              const active = habits.includes(emoji);
              return (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(date, emoji);
                  }}
                  className={`text-sm cursor-pointer rounded px-1 py-0.5 hover:bg-gray-100 ${active ? "opacity-40" : ""}`}
                  title={label}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Date column cell: day label, total estimation, pomodoro counter, habit log. */
export function DayTrackerCell({
  date,
  estimation,
  pomodoroCount,
  habits,
  onAddPomodoro,
  onRemovePomodoro,
  onToggleHabit,
}: {
  date: string;
  estimation: number;
  pomodoroCount: number;
  habits: string[];
  onAddPomodoro: (date: string) => void;
  onRemovePomodoro: (date: string) => void;
  onToggleHabit: (date: string, emoji: string) => void;
}) {
  const isToday = date === toDateStr(new Date());
  return (
    <div className={`px-2 py-1 ${isToday ? "text-blue-600" : "text-gray-500"}`}>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xs font-medium">{formatDateShort(date)}</span>
        {estimation > 0 && (
          <span className="text-[10px] text-gray-400 font-normal">
            {formatDuration(estimation)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-0.5 mt-0.5">
        {pomodoroCount > 0 && (
          <span className="text-xs leading-none">
            {Array.from({ length: Math.min(pomodoroCount, 10) }).map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePomodoro(date);
                }}
                className="cursor-pointer hover:opacity-60"
                title="Remove pomodoro"
              >
                🍅
              </button>
            ))}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddPomodoro(date);
          }}
          className="text-[10px] text-gray-300 hover:text-red-400 cursor-pointer leading-none"
          title="Add pomodoro"
        >
          +
        </button>
      </div>
      <HabitPicker date={date} habits={habits} onToggle={onToggleHabit} />
    </div>
  );
}
