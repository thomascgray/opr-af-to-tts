export const Tutorial = () => {
  return (
    <details className="dark:text-slate-200">
      <summary className="cursor-pointer">How-To / Tutorial</summary>
      <div className="p-2 bg-stone-100 dark:bg-slate-600 space-y-2">
        <ol className="list-decimal ml-4">
          <li>Build your army in OPR's Army Forge.</li>
          <li>
            Click the menu at the top right of that page and hit "Share as
            Link".
          </li>
          <li>Paste that link into the box above on this page.</li>
          <li>Click "Generate Definitions" above.</li>
          <li>
            This app will then build a model definition for each unit in your
            army.
          </li>
          <li>
            It's then up to you to then assign quantities of loadout items onto
            your model, as per your desired army:
          </li>
          <ul className="list-disc ml-4">
            <li>
              Change the quantity of a model's loadout items using the inputs on
              the left.
            </li>
            <li>
              Check the box next to a loadout item's quantity to have that item
              name be present in the model's TTS name.
            </li>
            <li>
              Duplicate any model definition using the "Duplicate this model
              definition" button.
            </li>
          </ul>
          <li>
            Once you're done, hit "Generate shareable link for TTS" at the
            bottom, and then paste that URL into{" "}
            <a
              target="_blank"
              className="text-blue-700 underline visited:text-purple-700"
              href="https://steamcommunity.com/sharedfiles/filedetails/?id=2969610810"
            >
              {" "}
              the TTS mod
            </a>
            .
          </li>
        </ol>
        <p>
          <span className="font-bold">Hint</span>
          <br />
          Check the "TTS Output Configuration" options below to adjust what is
          included in each model's name and description fields in TTS.
        </p>
        {/* <iframe
          className="mx-auto"
          width="560"
          height="315"
          src="https://www.youtube.com/embed/O7ERtMcB8NQ"
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        ></iframe> */}
      </div>
    </details>
  );
};
