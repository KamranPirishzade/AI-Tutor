/** The literal "sahə xətti" — the red double margin rule from Azerbaijani
 * school exercise books, reused here as the actual divider between the
 * slide viewer and the chat panel (the panel is styled as the margin
 * column itself, see ChatPanel.tsx). */
export function MarginRule() {
  return (
    <div className="flex h-full w-2 shrink-0 items-stretch gap-[3px] bg-paper">
      <div className="w-[2px] bg-margin" />
      <div className="w-px bg-margin-soft" />
    </div>
  );
}
