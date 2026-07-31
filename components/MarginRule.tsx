export function MarginRule() {
  return (
    <div className="flex h-full w-2 shrink-0 items-stretch gap-[3px] bg-paper">
      <div className="w-[2px] bg-margin" />
      <div className="w-px bg-margin-soft" />
    </div>
  );
}
