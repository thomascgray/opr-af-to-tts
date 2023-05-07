export const VersionHistory = () => {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer">Version History / Whats New</summary>
      <div className="p-2 bg-stone-100 space-y-2">
        <p className="font-bold text-lg">v 1.2</p>
        <ul className="list-disc ml-6">
          <li>
            more scripting in the TTS mod itself! Now you can right click a
            model and see "Activated". As the name implies, this will toggle an
            activated state against <em>all</em> models in the given model's
            unit, and draws some shapes around the model to make it nice and
            easily skimmable of which models are activated. Maybe it'll prove
            useful!
          </li>
        </ul>
        <details>
          <summary className="cursor-pointer">v 1.1</summary>
          <ul className="list-disc ml-6">
            <li>
              support for custom names, and a handful of TTS output config
              options to go with it
            </li>
            <li>
              TTS output config option to disable small text. Will remove ALL
              the [sup] fields from the BB code.
            </li>
            <li>
              doing the TTS assignment will now give models some scripting! I
              hope to keep expanding this. The first thing is "Measuring
              Circles". Right click a model and keep clicking "Measuring Circle"
              to put a circle around that model. Should help you for any
              abilities like "all models within 9''", stuff like that. The TTS
              mod is already updated, so just reload it and the new scripting
              should be there!
            </li>
            <li>tiny styling changes to this webapp.</li>
          </ul>
        </details>
      </div>
    </details>
  );
};
