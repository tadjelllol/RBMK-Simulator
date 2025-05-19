// Constants for the RBMK Simulator

// Game dialects
export const RBMKDials = {
  dialPassiveCooling: 1,
  dialColumnHeatFlow: 0.2,
  dialDiffusionMod: 1,
  dialHeatProvision: 0.2,
  dialColumnHeight: 4,
  dialBoilerHeatConsumption: 0.1, // Heat extracted per liter of water
  dialControlSpeed: 1,
  dialReactivityMod: 1,
  dialOutgasserSpeedMod: 1,
  dialControlSurgeMod: 1,
  dialFluxRange: 5,
  dialDisableMeltdowns: false,
  dialReasimBoilers: false,
  dialReasimCount: 8,
  // Add new settings for large reactors
  dialLargeReactorMode: false, // Set to true for RBMKP-2400 style reactors
  dialPowerScalingFactor: 1.0, // Adjust this for different reactor sizes
}

// Enums
export const NType = {
  SLOW: "SLOW",
  FAST: "FAST",
  ANY: "ANY",
}

export const EnumBurnFunc = {
  PASSIVE: "PASSIVE",
  LOG_TEN: "LOG_TEN",
  PLATEU: "PLATEU",
  ARCH: "ARCH",
  SIGMOID: "SIGMOID",
  SQUARE_ROOT: "SQUARE_ROOT",
  LINEAR: "LINEAR",
  QUADRATIC: "QUADRATIC",
  EXPERIMENTAL: "EXPERIMENTAL",
}

export const EnumBurnFunc2 = {
  PASSIVE: `<span style="color: green; margin: 0px;">SAFE / PASSIVE</span>`,
  LOG_TEN: `<span style="color: yellow; margin: 0px;">MEDIUM / LOGARITHMIC</span>`,
  PLATEU: `<span style="color: green; margin: 0px;">SAFE / EULER</span>`,
  ARCH: `<span style="color: red; margin: 0px;">DANGEROUS / NEGATIVE-QUADRATIC</span>`,
  SIGMOID: `<span style="color: green; margin: 0px;">SAFE / SIGMOID</span>`,
  SQUARE_ROOT: `<span style="color: yellow; margin: 0px;">MEDIUM / SQUARE ROOT</span>`,
  LINEAR: `<span style="color: red; margin: 0px;">DANGEROUS / LINEAR</span>`,
  QUADRATIC: `<span style="color: red; margin: 0px;">DANGEROUS / QUADRATIC</span>`,
  EXPERIMENTAL: `<span style="color: red; margin: 0px;">EXPERIMENTAL / SINE SLOPE</span>`,
}

export const EnumDepleteFunc = {
  LINEAR: "LINEAR",
  RAISING_SLOPE: "RAISING_SLOPE",
  BOOSTED_SLOPE: "BOOSTED_SLOPE",
  GENTLE_SLOPE: "GENTLE_SLOPE",
  STATIC: "STATIC",
}

export const ControlAutoFunctions = {
  LINEAR: "LINEAR",
  QUAD_UP: "QUAD_UP",
  QUAD_DOWN: "QUAD_DOWN",
}

export const InterpolationText = ["Linear", "Quadratic", "Inverse Quadratic"]

// View modes
export const ViewModes = {
  NORMAL: "normal",
  FLUX: "flux",
  TEMPERATURE: "temperature",
}

// Simulation options
export const SimulationDefaults = {
  az5: false,
  simulating: false,
  frames: 0,
  version: "0.2.2", // Updated version number
  viewMode: ViewModes.NORMAL,
  rbmkStuff: {
    // These are now fixed values, not configurable
    boilerInputRate: 100,
    boilerOutputRate: 100,
  },
  place: {
    placing: true,
    selected: "blank",
    blocks: [
      { select: "blank", index: 0 },
      { select: "fuel", index: 1 },
      { select: "control", index: 2 },
      { select: "control_auto", index: 3 },
      { select: "boiler", index: 4 },
      { select: "moderator", index: 5 },
      { select: "absorber", index: 6 },
      { select: "reflector", index: 7 },
      { select: "storage", index: 11 },
      { select: "cooler", index: 12 },
      { select: "nothing", index: 14 },
    ],
  },
  config: {
    columnIndexSelected: -1,
    prevColumn: 0,
  },
}

// Asset paths
export const Assets = {
  consoleImg: "/assets/gui_rbmk_console.png",
  az5Sound: "/assets/sounds/shutdown.ogg",
  explosionSound: "/assets/sounds/rbmk_explosion.ogg",
  baseTexturePath: "/assets/fuels/",
}
