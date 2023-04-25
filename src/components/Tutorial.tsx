export const Tutorial = () => {
  return (
    <details className="">
      <summary className="cursor-pointer">How-To / Tutorial</summary>
      <div className="p-2 bg-stone-100 space-y-2">
        <p>
          Army list definitions from Army Forge keep track of the whole "pool"
          of equipment associated with an entire unit - <em>not</em> which bits
          of equipment are associated with which individual, distinct models.
        </p>
        <p>
          Therefore, we need to define <em>which</em> distinct models have{" "}
          <em>which</em> equipment, so that we can generate the correct object
          "names" and "descriptions" for TTS.
        </p>
        <p>
          Paste your Army Forge "Share a link" URL into the box above and click
          "Generate Definitions". This will generate, for each unit in your
          army, a "model definition" which assumes that one single model has one
          of each of the equipment for that unit.
        </p>
        <p>
          From there, you can use the widgets on the left to change quantities
          of items and create duplicates of the model, allowing you to create a
          single entry for each <em>distinct</em> model in your army.
        </p>
        <p>
          The right column then prints out 2 paragraphs of text for each
          distinct model - these go in the TTS objects "name" and "description"
          field, respectively.
        </p>
      </div>
    </details>
  );
};
