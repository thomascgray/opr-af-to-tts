export const i18n = {
  en: {
    tutorialHeader: "How-To / Tutorial",
    tutorialInstruction1: "Build your army in OPR's Army Forge.",
    tutorialInstruction2:
      'Click the menu at the top right of that page and hit "Share as Link".',
    tutorialInstruction3: "Paste that link into the box above on this page.",
    tutorialInstruction4: 'Click "Import Army & Generate Definitions" above.',
    tutorialInstruction5:
      "This app will then build a model definition for each unit in your army.",
    tutorialInstruction6:
      "It's then up to you to then assign quantities of loadout items onto your model, as per your desired army:",
    tutorialInstruction6a:
      "Change the quantity of a model's loadout items using the inputs on the left.",
    tutorialInstruction6b:
      "Check the box next to a loadout item's quantity to have that item name be present in the model's TTS name.",
    tutorialInstruction6c:
      'Duplicate any model definition using the "Duplicate this model definition" button.',
    tutorialInstruction7:
      'Once you\'re done, hit "Generate shareable link for TTS" at the bottom, and then paste that URL into the TTS mod.',
    hint: "Hint",
    hintInstruction1:
      'Check the "TTS Output Configuration" options below to adjust what is included in each model\'s name and description fields in TTS.',
    ttsOutputConfigurationHeader: "TTS Output Configuration",
    ttsOutputConfiguration1: {
      name: 'Include "Core" special rules in model description',
      label:
        'If enabled, the TTS "description" outputs will include the model\'s relevant core special rules.',
    },
    ttsOutputConfiguration2: {
      name: "Include the full text for core special rules",
      label:
        "If enabled, the TTS \"description\" outputs will include the model's relevant core special rules text in full. If disabled, only the special rule's name will be included.",
    },
    ttsOutputConfiguration3: {
      name: 'Include "Army" special rules in model description',
      label:
        "If enabled, the TTS \"description\" outputs will include the model's relevant rules from the army, and from that model's loadout.",
    },
    ttsOutputConfiguration4: {
      name: "Include the full text for army special rules",
      label:
        "If enabled, the TTS \"description\" outputs will include the model's relevant army special rules text in full. If disabled, only the special rule's name will be included.",
    },
    ttsOutputConfiguration5: {
      name: 'Include "Loadout List" in model name',
      label:
        "If enabled, the TTS \"name\" output will include a comma separated, colour coded list of the model's equipped loadout under the model's name.",
    },
    ttsOutputConfiguration6: {
      name: 'Include "Special Rules List" in model name',
      label:
        "If enabled, the TTS \"name\" output will include a comma separated, colour coded list of the model's relevant special rules under the model's name.",
    },
    ttsOutputConfiguration7: {
      name: "Swap custom name and original name ordering for units with multiple models in them",
      label:
        "If enabled, then a unit with a custom name and whose original model size is greater than 1 will have the custom name in the brackets in the output, instead of the original name. This often looks better and makes more semantic sense.",
    },
    ttsOutputConfiguration8: {
      name: "Completely replace original model names with any custom name",
      label:
        "If enabled, then a unit with a custom name will have that custom name completely replace the original, with the original not being in brackets or anywhere else on the model.",
    },
    ttsOutputConfiguration9: {
      name: "Disable small text",
      label:
        "If enabled, then none of the text in the name or description will be small. Enable this if you have trouble reading the small text in TTS.",
    },
    ttsOutputConfigQualityOutputColour: {
      name: "Model Quality Stat Output Colour",
      label: "HEX code for the model's quality value in the TTS output.",
    },
    ttsOutputConfigDefenseOutputColour: {
      name: "Model Defense Stat Output Colour",
      label: "HEX code for the model's defense value in the TTS output.",
    },
    ttsOutputConfigLoadoutOutputColour: {
      name: "Model Loadout Stat Output Colour",
      label: "HEX code for the model's loadouts details in the TTS output.",
    },
    ttsOutputConfigSpecialRulesOutputColour: {
      name: "Model Special Rules Output Colour",
      label:
        "HEX code for the model's special rules details in the TTS output.",
    },
    ttsOutputConfigToughOutputColour: {
      name: "Model Tough Special Rule Rating Output Colour",
      label:
        "HEX code for the model's Tough rating, if it has one, in the TTS output.",
    },
    saveAndLoadTtsOutputConfigHeader: "Save & Load TTS Output Configs",
    saveAndLoadTtsOutputConfigsLabel:
      "Save All of the above configuration into the local storage of your browser by hitting the button below. You can then quickly load different configs by hitting the load buttons below.",
    saveCurrentConfigButton: "Save Current Config",
    loadAppDefaultConfigButton: "Load app default config",
    loadCustomConfigHeader: "Load Custom Configs",
    loadCustomConfigPlaceholder: "You have no saved TTS output configs",
  },
  de: {
    // data here
  },
};
