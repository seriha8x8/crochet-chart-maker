"use client";

import { YARN_COLOR_SWATCHES } from "@/lib/yarn/constants";

/** Color picker styled as actual color swatches (not plain checkboxes) so the right chip is
 *  recognizable at a glance. Selecting one keeps it visually "raised" the same way hovering
 *  does, via has-[:checked] mirroring the hover classes — no JS state needed. */
export function ColorSwatchChips({
  name,
  options,
  defaultValues,
}: {
  name: string;
  options: readonly string[];
  defaultValues: string[];
}) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-2">
      {options.map((color) => {
        const swatch = YARN_COLOR_SWATCHES[color as keyof typeof YARN_COLOR_SWATCHES] as
          | { background: string; text: "dark" | "light" }
          | undefined;
        const isGradient = swatch?.background.startsWith("linear-gradient");

        return (
          <label key={color} className="flex w-20 flex-col items-center gap-1 text-center text-[11px] text-stone-600">
            <span
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 shadow-sm transition-transform hover:scale-110 has-[:checked]:scale-110 has-[:checked]:ring-2 has-[:checked]:ring-[#5BC8AC] has-[:checked]:ring-offset-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#5BC8AC] has-[:focus-visible]:ring-offset-2"
              style={
                isGradient
                  ? { backgroundImage: swatch?.background }
                  : { backgroundColor: swatch?.background ?? "#EDEDED" }
              }
            >
              <input
                type="checkbox"
                name={name}
                value={color}
                defaultChecked={defaultValues.includes(color)}
                className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <CheckIcon
                className={`pointer-events-none opacity-0 transition-opacity peer-checked:opacity-100 ${
                  swatch?.text === "light" ? "text-white" : "text-stone-800"
                }`}
              />
            </span>
            {color}
          </label>
        );
      })}
    </div>
  );
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
