export const Tutorial = () => {
  return (
    <details className="">
      <summary className="cursor-pointer">How-To / Tutorial</summary>
      <div className="p-2 bg-stone-100 space-y-2">
        <ol className="list-decimal ml-4">
          <li>Build your army in OPR's Army Forge.</li>
          <li>
            Click the menu at the top right of that page and hit "Share as
            Link".
          </li>
          <li>Paste that link into the box above on this page.</li>
          <li>Click "Generate Definitions".</li>
          <li>
            This app will then build a model definition for each unit in your
            army.
          </li>
          <li>
            It's then up to you to then assign quantities of loudout items onto
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
            Once you're done, manually copy and paste the BBC code (supplied on
            the right of each model definition) onto your TTS models
          </li>
        </ol>
        <p className="font-bold">COMING SOON!</p>
        <p>
          At the bottom of the page you'll see a "Generare shareable link for
          TTS" button. Right now, this builds you a link with a bunch of JSON
          that there isn't much use for. In the near future, I'm hoping to have
          a TTS Workshop mod to help you load models in.
        </p>
      </div>
    </details>
  );
};
