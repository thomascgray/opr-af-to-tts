export const OutputFAQ = () => {
  return (
    <details className="dark:text-slate-200">
      <summary className="cursor-pointer">TTS Output Notes</summary>
      <div className="p-2 bg-stone-100 dark:bg-slate-600 space-y-2">
        <ul className="list-disc ml-4">
          <li>
            Special upgrades that apply specifically to entire units (such as
            Age of Fantasy "Musician" upgrades) are listed as individual loadout
            items here. While this isn't technically perfect, it's the best
            compromise, and still allows the most flexibility.
          </li>
        </ul>
      </div>
    </details>
  );
};
