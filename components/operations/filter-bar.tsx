import { SelectInput, TextInput } from "@/components/operations/field";

type FilterOption = {
  readonly value: string;
  readonly label: string;
};

type FilterDefinition = {
  readonly name: string;
  readonly label: string;
  readonly value?: string;
  readonly options: readonly FilterOption[];
};

type FilterBarProps = {
  readonly search?: string;
  readonly searchLabel?: string;
  readonly searchPlaceholder?: string;
  readonly filters: readonly FilterDefinition[];
  readonly resetHref: string;
};

export function FilterBar({
  search = "",
  searchLabel = "Search",
  searchPlaceholder = "Search records",
  filters,
  resetHref,
}: FilterBarProps) {
  return (
    <form
      method="get"
      className="grid gap-4 border border-white/15 bg-surface p-5 lg:grid-cols-[minmax(12rem,1fr)_repeat(3,minmax(9rem,0.55fr))_auto]"
    >
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
          {searchLabel}
        </span>
        <TextInput
          type="search"
          name="q"
          defaultValue={search}
          placeholder={searchPlaceholder}
          className="mt-2"
        />
      </label>
      {filters.map((filter) => (
        <label key={filter.name} className="block">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
            {filter.label}
          </span>
          <SelectInput
            name={filter.name}
            defaultValue={filter.value ?? ""}
            className="mt-2"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </label>
      ))}
      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center bg-accent px-4 text-xs font-bold uppercase tracking-[0.1em] text-canvas transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Apply
        </button>
        <a
          href={resetHref}
          className="inline-flex min-h-12 items-center justify-center border border-white/20 px-4 text-xs font-bold uppercase tracking-[0.1em] text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Reset
        </a>
      </div>
    </form>
  );
}
