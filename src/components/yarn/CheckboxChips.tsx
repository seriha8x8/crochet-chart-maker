"use client";

const chipClass =
  "flex items-center gap-1.5 rounded-full border border-stone-300 px-3 py-1.5 text-xs has-[:checked]:border-[#5BC8AC] has-[:checked]:bg-[#EAF7F2] has-[:checked]:text-[#2f6f61]";

export interface ChipOption {
  value: string;
  label: string;
}

/** Pill-style checkbox group: multiple boxes share `name` so a native <form> submits them
 *  all under the same key (FormData.getAll(name)) or the URL gets repeated `?name=` params.
 *  Plain strings are shorthand for options whose value and display label are the same. */
export function CheckboxChips({
  name,
  options,
  defaultValues,
}: {
  name: string;
  options: (string | ChipOption)[];
  defaultValues: string[];
}) {
  const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div className="flex flex-wrap gap-2">
      {normalized.map((option) => (
        <label key={option.value} className={chipClass}>
          <input
            type="checkbox"
            name={name}
            value={option.value}
            defaultChecked={defaultValues.includes(option.value)}
            className="accent-[#5BC8AC]"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
