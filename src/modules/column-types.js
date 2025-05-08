import { Column } from "./column-base.js"
import { Display } from "./display.js"
import { Vec3 } from "./vector.js"
import { NType, RBMKDials, ControlAutoFunctions, InterpolationText } from "./constants.js"
import { NONE } from "./fuel-types.js"
import { createElement, clamp, quickMath } from "./utils.js"

/**
 * Fuel column
 */
export class Fuel extends Column {
  /**
   * Create a new Fuel column
   */
  constructor() {
    super(1, { enabled: true, text: "<b>FUEL</b>" })
    this.display = new Display(1, this)
    this.display.draw2 = function (x, y, rbmk) {
      // Skin heat
      const h = quickMath(this.column.skinHeat - 20, 8, this.column.maxSkinHeat)
      const h2 = quickMath(this.column.skinHeat - 20, 26, this.column.maxSkinHeat)
      rbmk.statsRenderer.draw("image", {
        img: rbmk.consoleImg,
        crop: true,

        x: x * 32 + 3,
        y: y * 32 + 3 + 26 - h2,
        w: 7,
        h: h2,

        sX: 11,
        sY: 183 + (8 - h),
        sW: 2,
        sH: h,
      })

      // Depletion
      const deplH = quickMath(100 - this.column.depletion, 8, 100)
      const deplH2 = quickMath(100 - this.column.depletion, 26, 100)
      rbmk.statsRenderer.draw("image", {
        img: rbmk.consoleImg,
        crop: true,

        x: x * 32 + 13,
        y: y * 32 + 3 + 26 - deplH2,
        w: 6,
        h: deplH2,

        sX: 14,
        sY: 183 + (8 - deplH),
        sW: 2,
        sH: deplH,
      })

      // Xenon Poisoning
      const xenonH = quickMath(this.column.xenonPoison, 8, 100)
      const xenonH2 = quickMath(this.column.xenonPoison, 26, 100)
      rbmk.statsRenderer.draw("image", {
        img: rbmk.consoleImg,
        crop: true,

        x: x * 32 + 22,
        y: y * 32 + 3 + 26 - xenonH2,
        w: 7,
        h: xenonH2,

        sX: 17,
        sY: 183 + (8 - xenonH),
        sW: 2,
        sH: xenonH,
      })
    }

    this.stream = NType.ANY
    this.fluxFast = 0
    this.fluxSlow = 0

    this.coreHeat = 20
    this.skinHeat = 20
    this.maxSkinHeat = 20
    this.depletion = 100
    this.xenonPoison = 0
    this.radioactivity = 0

    this.fuel = new NONE()
    this.fuel.column = this

    this.moderated = false
  }

  /**
   * Receive flux into the column
   * @param {string} type - The flux type
   * @param {number} flux - The flux amount
   */
  receiveFlux(type, flux) {
    switch (type) {
      case "FAST":
        this.fluxFast += flux
        break
      case "SLOW":
        this.fluxSlow += flux
        break
    }
  }

  /**
   * Get flux from type
   * @param {string} type - The type
   * @returns {number} - The flux
   */
  fluxFromType(type) {
    switch (type) {
      case "SLOW":
        return this.fluxFast * 0.5 + this.fluxSlow
      case "FAST":
        return this.fluxFast + this.fluxSlow * 0.3
      case "ANY":
        return this.fluxFast + this.fluxSlow
    }

    return 0.0
  }

  /**
   * Spread flux from the column
   * @param {string} type - The flux type
   * @param {number} fluxOut - The output flux
   * @param {Object} rbmk - The RBMK instance
   */
  spreadFlux(type, fluxOut, rbmk) {
    const range = RBMKDials.dialFluxRange

    this.dirs.forEach((dir) => {
      this.stream = type
      let flux = fluxOut

      for (let i = 1; i <= range; i++) {
        flux = this.runInteraction(
          rbmk.columns[this.x - dir.offsetX * i + rbmk.width * (this.y + dir.offsetY * i)],
          flux,
        )

        if (flux <= 0) break
      }
    })
  }

  /**
   * Run interaction with another column
   * @param {Object} column - The column to interact with
   * @param {number} flux - The flux
   * @returns {number} - The remaining flux
   */
  runInteraction(column, flux) {
    if (column instanceof Column) {
      if (column.moderated === true) {
        this.stream = NType.SLOW
      }
    }

    if (column instanceof Fuel) {
      if (column.fuel !== null) {
        column.receiveFlux(this.stream, flux)
        return 0
      } else {
        return flux
      }
    }

    if (column instanceof Outgasser) {
      // if rod cant process
      // return flux
    }

    if (column instanceof Control) {
      const mult = column.mult
      if (mult === 0) return 0

      flux *= mult

      return flux
    }

    if (column instanceof Moderator) {
      this.stream = NType.SLOW
      return flux
    }

    if (column instanceof Reflector) {
      this.receiveFlux(this.moderated ? NType.SLOW : this.stream, flux)
      return 0
    }

    if (column instanceof Absorber) {
      return 0
    }

    if (column instanceof Column) {
      return flux
    }

    const limit = RBMKDials.dialColumnHeight
    let hits = 0
    for (let h = 0; h <= limit; h++) {
      hits++
    }

    if (hits > 0) this.radioactivity += (flux * 0.05 * hits) / limit

    return 0
  }

  /**
   * Update the column
   * @param {number} ticks - The current tick
   * @param {Object} rbmk - The RBMK instance
   */
  update(ticks, rbmk) {
    this.radioactivity = 0

    // Fuel stuff
    if (this.fuel.constructor.name === "NONE") {
      this.depletion = 100
      this.coreHeat = 20
      this.skinHeat = 20
      this.maxSkinHeat = 20

      this.fluxFast = 0
      this.fluxSlow = 0

      super.update(ticks, rbmk)
    } else if (this.fuel.constructor.name !== "NONE") {
      this.depletion = this.fuel.calcDepletion()
      this.xenonPoison = this.fuel.xenon
      this.coreHeat = this.fuel.coreHeat
      this.skinHeat = this.fuel.skinHeat

      // ACTUAL flux stuff
      const fluxIn = this.fluxFromType(this.fuel.nType)
      const fluxOut = this.fuel.burn(fluxIn)
      const rType = this.fuel.rType

      this.fuel.updateHeat(1.0)
      this.heat += this.fuel.provideHeat(this.heat, 1.0)

      super.update(ticks, rbmk)

      if (this.heat > this.maxHeat && RBMKDials.dialDisableMeltdowns === false) {
        rbmk.meltdown()
        return
      }

      this.fluxFast = 0
      this.fluxSlow = 0

      this.spreadFlux(rType, fluxOut, rbmk)
    }
  }

  /**
   * Draw the column
   * @param {number} ticks - The current tick
   */
  draw(ticks) {
    const moderated = this.moderated ? `<p style="color: yellow; margin: 0px;">Moderated</p>` : ""

    this.tooltipText = `<b>FUEL</b><br><p style="color: yellow; margin: 0px;">Column temperature: ${this.heat.toFixed(1)}°C</p><p style="color: green; margin: 0px;">Depletion: ${this.depletion.toFixed(3)}%</p><p style="color: purple; margin: 0px;">Xenon poison: ${this.xenonPoison.toFixed(1)}%</p><p style="color: red; margin: 0px;">Core temperature: ${this.coreHeat.toFixed(1)}°C</p><p style="color: rgb(255, 63, 63); margin: 0px;">Skin temperature: ${this.skinHeat.toFixed(1)}°C / ${this.maxSkinHeat.toFixed(1)}°C</p>${moderated}`
  }

  /**
   * Reset the column
   */
  reset() {
    this.coreHeat = 20
    this.skinHeat = 20

    if (this.fuel.constructor.name === "NONE") {
      this.depletion = 100
      this.maxSkinHeat = 20
    } else if (this.fuel.constructor.name !== "NONE") {
      this.depletion = 0
      this.maxSkinHeat = this.fuel.meltingPoint
    }

    this.fuel.yieldd = this.fuel.defaultYield
    this.fuel.coreHeat = 20
    this.fuel.skinHeat = 20

    this.fluxFast = 0
    this.fluxSlow = 0

    this.xenonPoison = 0
    this.radioactivity = 0
  }

  /**
   * Get the configuration UI
   * @returns {HTMLElement} - The configuration element
   */
  getConfig() {
    const selfigniting =
      this.fuel.selfRate > 0 || this.fuel.function === "SIGMOID"
        ? `<p style="color: red; margin: 0px;">Self-igniting</p>`
        : ""

    const fuelTooltip = `<b>${window.fuelNames[this.fuel.fullName].rod}</b><br><p style="color: grey; margin: 0px;">${window.fuelNames[this.fuel.fullName].fullName}</p>${selfigniting}<p style="color: green; margin: 0px;">Depletion: ${this.fuel.calcDepletion().toFixed(3)}%</p><p style="color: purple; margin: 0px;">Xenon poison: ${(this.xenonPoison * 1000) / 1000}%</p><p style="color: blue; margin: 0px;">Splits with: ${this.fuel.nType}</p><p style="color: blue; margin: 0px;">Splits into: ${this.fuel.rType}</p><p style="color: yellow; margin: 0px;">Flux function: <span style="color: white;">${this.fuel.getFuncDescription()}</span></p><p style="color: yellow; margin: 0px;">Function type: ${this.fuel.displayFunc}</p><p style="color: yellow; margin: 0px;">Xenon gen function: <span style="color: white;">x * ${this.fuel.xGen}</span></p><p style="color: yellow; margin: 0px;">Xenon burn function: <span style="color: white;">x² * ${this.fuel.xBurn}</span></p><p style="color: gold; margin: 0px;">Heat per flux: ${this.fuel.heat}°C</p><p style="color: gold; margin: 0px;">Diffusion: ${this.fuel.diffusion}¹/²</p><p style="color: rgb(255, 63, 63); margin: 0px;">Skin temp: ${this.fuel.skinHeat.toFixed(1)}°C</p><p style="color: rgb(255, 63, 63); margin: 0px;">Core temp: ${this.fuel.coreHeat.toFixed(1)}°C</p><p style="color: red; margin: 0px;">Melting point: ${this.fuel.meltingPoint.toFixed(1)}°C</p>`

    const stuff = document.createElement("div")

    const element = createElement(
      "p",
      {
        className: "noMargin",
        style: { fontSize: "27px" },
      },
      "Fuel: ",
    )

    const element2 = createElement("img", {
      src: this.fuel.texture,
      tooltip: fuelTooltip,
    })

    element.appendChild(element2)
    stuff.appendChild(element)

    const moderationBtn = createElement(
      "button",
      {
        className: "textButton",
        style: { fontSize: "27px" },
        configmenuaction: "moderation",
        onclick: "configMenuAction()",
      },
      `Moderated: ${this.moderated}`,
    )

    stuff.appendChild(moderationBtn)

    return stuff
  }
}

/**
 * Fuel ReaSim column
 */
export class FuelReaSim extends Fuel {
  /**
   * Create a new FuelReaSim column
   */
  constructor() {
    super()
    this.tooltipText = "<b>FUEL_REASIM</b>"
  }

  /**
   * Spread flux from the column
   * @param {string} type - The flux type
   * @param {number} fluxOut - The output flux
   * @param {Object} rbmk - The RBMK instance
   */
  spreadFlux(type, fluxOut, rbmk) {
    const range = RBMKDials.dialFluxRange
    const count = RBMKDials.dialReasimCount
    const dir = new Vec3(1, 0, 0)

    for (let i = 0; i < count; i++) {
      this.stream = type
      let flux = fluxOut

      dir.rotateAroundY(Math.PI * 2 * Math.random())

      for (let j = 1; j <= range; j++) {
        const x = Math.floor(dir.xCoord * j)
        const z = Math.floor(dir.zCoord * j)
        const lastX = Math.floor(dir.xCoord * (j - 1))
        const lastZ = Math.floor(dir.zCoord * (j - 1))

        // Skip if the position is on the rod itself
        if (x === 0 && z === 0) continue

        // Skip if the current position is equal to the last position
        if (x === lastX && z === lastZ) continue

        flux = this.runInteraction(rbmk.columns[this.x + x * i + rbmk.width * (this.y + z * i)], flux)

        if (flux <= 0) break
      }
    }
  }

  /**
   * Draw the column
   * @param {number} ticks - The current tick
   */
  draw(ticks) {
    const moderated = this.moderated ? `<p style="color: yellow; margin: 0px;">Moderated</p>` : ""

    this.tooltipText = `<b>FUEL_REASIM</b><br><p style="color: yellow; margin: 0px;">Column temperature: ${this.heat.toFixed(1)}°C</p><p style="color: green; margin: 0px;">Depletion: ${this.depletion.toFixed(3)}%</p><p style="color: purple; margin: 0px;">Xenon poison: ${this.xenonPoison.toFixed(1)}%</p><p style="color: red; margin: 0px;">Core temperature: ${this.coreHeat.toFixed(1)}°C</p><p style="color: rgb(255, 63, 63); margin: 0px;">Skin temperature: ${this.skinHeat.toFixed(1)}°C / ${this.maxSkinHeat.toFixed(1)}°C</p>${moderated}`
  }
}

/**
 * Control rod column
 */
export class Control extends Column {
  /**
   * Create a new Control column
   */
  constructor() {
    super(2, { enabled: true, text: "<b>CONTROL</b>" })
    this.display = new Display(2, this)
    this.display.draw2 = function (x, y, rbmk) {
      // Rod Level
      const h = quickMath(100 - this.column.level * 100, 8, 100)
      const h2 = quickMath(100 - this.column.level * 100, 26, 100)
      rbmk.statsRenderer.draw("image", {
        img: rbmk.consoleImg,
        crop: true,

        x: x * 32 + 13,
        y: y * 32 + 3,
        w: 6,
        h: h2,

        sX: 24,
        sY: 183,
        sW: 2,
        sH: h,
      })
    }

    this.mult = 0
    this.level = 0
    this.lastLevel = 0
    this.speed = 0.00277
    this.targetLevel = 0
    this.startingLevel = 0
  }

  /**
   * Update the column
   * @param {number} ticks - The current tick
   * @param {Object} rbmk - The RBMK instance
   */
  update(ticks, rbmk) {
    // Remember last level
    this.lastLevel = this.level

    // Adjust level based on target
    if (this.level < this.targetLevel) {
      this.level += this.speed * RBMKDials.dialControlSpeed

      if (this.level > this.targetLevel) this.level = this.targetLevel
    }

    if (this.level > this.targetLevel) {
      this.level -= this.speed * RBMKDials.dialControlSpeed

      if (this.level < this.targetLevel) this.level = this.targetLevel
    }

    // Calculate mult and surge
    let surge = 0
    if (this.targetLevel < this.startingLevel && Math.abs(this.level - this.targetLevel) > 0.01) {
      surge =
        Math.sin(Math.pow(1 - this.level, 15) * Math.PI) *
        (this.startingLevel - this.targetLevel) *
        RBMKDials.dialControlSurgeMod
    }
    this.mult = this.level + surge

    super.update(ticks, rbmk)
  }

  /**
   * Draw the column
   * @param {number} ticks - The current tick
   */
  draw(ticks) {
    const moderated = this.moderated ? `<p style="color: yellow; margin: 0px;">Moderated</p>` : ""

    this.tooltipText = `<b>CONTROL</b><br><p style="color: yellow; margin: 0px;">Column temperature: ${this.heat.toFixed(1)}°C</p><p style="color: yellow; margin: 0px;">${Math.floor(this.level * 100)}%</p>${moderated}`
  }

  /**
   * Reset the column
   */
  reset() {
    this.level = 0
    this.targetLevel = 0
    this.lastLevel = 0
  }

  /**
   * Get the configuration UI
   * @returns {HTMLElement} - The configuration element
   */
  getConfig() {
    const stuff = document.createElement("div")

    const pullBtn = createElement(
      "button",
      {
        className: "textButton",
        style: { fontSize: "27px" },
        configmenuaction: "pull",
        onclick: "configMenuAction()",
      },
      "Insert control rod",
    )

    stuff.appendChild(pullBtn)

    const moderationBtn = createElement(
      "button",
      {
        className: "textButton",
        style: { fontSize: "27px" },
        configmenuaction: "moderation",
        onclick: "configMenuAction()",
      },
      `Moderated: ${this.moderated}`,
    )

    stuff.appendChild(moderationBtn)

    return stuff
  }
}

/**
 * Automatic control rod column
 */
export class ControlAuto extends Control {
  /**
   * Create a new ControlAuto column
   */
  constructor() {
    super()
    this.index = 3
    this.tooltipText = "<b>CONTROL_AUTO</b>"

    this.function = 0

    this.heatLower = 0
    this.heatUpper = 0
    this.levelLower = 0
    this.levelUpper = 0
  }

  /**
   * Update the column
   * @param {number} ticks - The current tick
   * @param {Object} rbmk - The RBMK instance
   */
  update(ticks, rbmk) {
    let fauxLevel = 0

    const lowerBound = Math.min(this.heatLower, this.heatUpper)
    const upperBound = Math.max(this.heatLower, this.heatUpper)

    if (this.heat < lowerBound) {
      fauxLevel = this.levelLower
    } else if (this.heat > upperBound) {
      fauxLevel = this.levelUpper
    } else {
      switch (ControlAutoFunctions[this.function]) {
        case "LINEAR":
          fauxLevel =
            (this.heat - this.heatLower) * ((this.levelUpper - this.levelLower) / (this.heatUpper - this.heatLower)) +
            this.levelLower
          break
        case "QUAD_UP":
          fauxLevel =
            Math.pow((this.heat - this.heatLower) / (this.heatUpper - this.heatLower), 2) *
              (this.levelUpper - this.levelLower) +
            this.levelLower
          break
        case "QUAD_DOWN":
          fauxLevel =
            Math.pow((this.heat - this.heatUpper) / (this.heatLower - this.heatUpper), 2) *
              (this.levelLower - this.levelUpper) +
            this.levelUpper
          break
      }
    }

    this.targetLevel = fauxLevel * 0.01
    this.targetLevel = clamp(this.targetLevel, 0, 1)

    super.update(ticks, rbmk)
  }

  /**
   * Draw the column
   * @param {number} ticks - The current tick
   */
  draw(ticks) {
    this.tooltipText = `<b>CONTROL_AUTO</b><br><p style="color: yellow; margin: 0px;">Column temperature: ${this.heat.toFixed(1)}°C</p><p style="color: yellow; margin: 0px;">${this.level}%</p>`
  }

  /**
   * Reset the column
   */
  reset() {
    this.level = 0
  }

  /**
   * Get the configuration UI
   * @returns {HTMLElement} - The configuration element
   */
  getConfig() {
    const stuff = document.createElement("div")

    // Moderation button
    const moderationBtn = createElement(
      "button",
      {
        className: "textButton",
        style: { fontSize: "27px" },
        configmenuaction: "moderation",
        onclick: "configMenuAction()",
      },
      `Moderated: ${this.moderated}`,
    )
    stuff.appendChild(moderationBtn)

    // Interpolation button
    const interpolationBtn = createElement(
      "button",
      {
        className: "textButton",
        style: { fontSize: "27px" },
        configmenuaction: "cauto_interpolation",
        onclick: "configMenuAction()",
      },
      `Interpolation: ${InterpolationText[this.function]}`,
    )
    stuff.appendChild(interpolationBtn)

    // Level at max heat button
    const levelUpperBtn = createElement(
      "button",
      {
        className: "textButton",
        style: { fontSize: "27px" },
        configmenuaction: "cauto_levelUpper",
        tooltip: "Should be smaller than level at min heat",
        onclick: "configMenuAction()",
      },
      `Level at max heat: ${this.levelUpper}`,
    )
    stuff.appendChild(levelUpperBtn)

    // Level at min heat button
    const levelLowerBtn = createElement(
      "button",
      {
        className: "textButton",
        style: { fontSize: "27px" },
        configmenuaction: "cauto_levelLower",
        tooltip: "Should be larger than level at min heat",
        onclick: "configMenuAction()",
      },
      `Level at min heat: ${this.levelLower}`,
    )
    stuff.appendChild(levelLowerBtn)

    // Max heat button
    const heatUpperBtn = createElement(
      "button",
      {
        className: "textButton",
        style: { fontSize: "27px" },
        configmenuaction: "cauto_heatUpper",
        tooltip: "Must be larger than min heat",
        onclick: "configMenuAction()",
      },
      `Max heat: ${this.heatUpper}`,
    )
    stuff.appendChild(heatUpperBtn)

    // Min heat button
    const heatLowerBtn = createElement(
      "button",
      {
        className: "textButton",
        style: { fontSize: "27px" },
        configmenuaction: "cauto_heatLower",
        tooltip: "Must be smaller than max heat",
        onclick: "configMenuAction()",
      },
      `Min heat: ${this.heatLower}`,
    )
    stuff.appendChild(heatLowerBtn)

    return stuff
  }
}

/**
 * Boiler column
 */
export class Boiler extends Column {
  /**
   * Create a new Boiler column
   */
  constructor() {
    super(4, { enabled: true, text: "<b>BOILER</b>" })
    this.display = new Display(4, this)
    this.display.draw2 = function (x, y, rbmk) {
      // Feedwater
      const h = quickMath(this.column.feedwater, 8, this.column.feedwaterMax)
      const h2 = quickMath(this.column.feedwater, 26, this.column.feedwaterMax)
      rbmk.statsRenderer.draw("image", {
        img: rbmk.consoleImg,
        crop: true,

        x: x * 32 + 3,
        y: y * 32 + 3 + 26 - h2,
        w: 10,
        h: h2,

        sX: 41,
        sY: 183 + (8 - h),
        sW: 3,
        sH: h,
      })

      // Compressor
      rbmk.statsRenderer.draw("image", {
        img: rbmk.consoleImg,
        crop: true,

        x: x * 32 + 13,
        y: y * 32 + 3 + 6.6 * this.column.steamType,
        w: 6,
        h: 6,

        sX: 44,
        sY: 183 + 2 * this.column.steamType,
        sW: 2,
        sH: 2,
      })

      // Steam
      const steamH = quickMath(this.column.steam, 8, this.column.steamMax)
      const steamH2 = quickMath(this.column.steam, 26, this.column.steamMax)
      rbmk.statsRenderer.draw("image", {
        img: rbmk.consoleImg,
        crop: true,

        x: x * 32 + 19,
        y: y * 32 + 3 + 26 - steamH2,
        w: 10,
        h: steamH2,

        sX: 46,
        sY: 183 + (8 - steamH),
        sW: 3,
        sH: steamH,
      })
    }

    this.feedwater = 10000 // Start with max feedwater
    this.feedwaterMax = 10000

    this.steam = 0
    this.steamMax = 1000000

    this.steamType = 0
    this.compressors = ["Steam", "Dense Steam", "Super Dense Steam", "Ultra Dense Steam"]

    // These other variables are for boiler output rate
    this.steam2 = 0
    this.steamMax2 = 512000

    this.spentSteam = 0
    this.spentSteamMax = 10240000

    this.producedPower = 0
    this.producedMW = 0 // New realistic power unit in Megawatts
  }

  /**
   * Update the column
   * @param {number} ticks - The current tick
   * @param {Object} rbmk - The RBMK instance
   */
  update(ticks, rbmk) {
    // Keep values within limits
    if (this.feedwater > this.feedwaterMax) this.feedwater = this.feedwaterMax

    // Boiling - temperature-based steam production with caps for each steam type
    const minTemp = 100 // Minimum temperature for steam production

    // Define temperature ranges for each steam type
    const tempRanges = [
      { min: 100, max: 180 }, // Normal steam: 100-180°C
      { min: 180, max: 350 }, // Dense steam: 180-350°C
      { min: 350, max: 600 }, // Super dense steam: 350-600°C
      { min: 600, max: 1000 }, // Ultra dense steam: 600-1000°C
    ]

    // Current steam type's temperature range
    const currentRange = tempRanges[this.steamType]

    // Only produce steam if temperature is above minimum for the current steam type
    if (this.heat >= currentRange.min) {
      const HEAT_PER_MB_WATER = 0.1 // Heat extracted per mb of water
      const steamFactor = this.getFactorFromSteam()

      // Calculate effective temperature (capped at max for current steam type)
      const effectiveTemp = Math.min(this.heat, currentRange.max)

      // Calculate temperature factor (0-1 range based on where we are in the temperature range)
      const tempFactor = (effectiveTemp - currentRange.min) / (currentRange.max - currentRange.min)

      // Calculate steam production based on temperature
      const maxWaterInput = 100 // Fixed maximum water input rate
      const baseProduction = maxWaterInput * (0.2 + 0.8 * tempFactor)

      // Ensure we have enough feedwater
      const waterUsed = Math.min(baseProduction, this.feedwater)
      const steamProduced = Math.floor((waterUsed * 100) / steamFactor)

      // Extract heat from the system - this is the cooling effect
      const heatExtracted = waterUsed * HEAT_PER_MB_WATER * (1 + this.steamType * 0.5)
      this.heat -= heatExtracted

      // Update feedwater and steam
      this.feedwater -= waterUsed
      this.steam += steamProduced

      if (this.steam > this.steamMax) this.steam = this.steamMax
    }

    super.update(ticks, rbmk)

    // Process steam through turbines
    const maxOutputRate = 100 // Fixed maximum output rate

    // Only process steam if we have steam
    if (this.steam > 0) {
      // Calculate how much steam to process (limited by available steam and output rate)
      const steamToProcess = Math.min(this.steam, maxOutputRate)
      this.steam -= steamToProcess

      // Calculate power output directly from processed steam
      const trait = this.getTraitFromSteam()

      // Calculate power based on steam type efficiency and energy content
      // Significantly reduced power output for more realism
      this.producedPower = (steamToProcess * trait.efficiency * trait.heatEnergy) / 1000

      // Convert to MW with appropriate scaling for steam type
      // Reduced multiplier for more realistic power generation
      const steamTypeMultiplier = Math.pow(2, this.steamType) // 1, 2, 4, 8 for steam types 0-3
      this.producedMW = (this.producedPower * steamTypeMultiplier) / 100
    } else {
      // No steam
      this.producedPower = 0
      this.producedMW = 0
    }

    // Auto-refill feedwater to keep system running
    if (this.feedwater < this.feedwaterMax * 0.5) {
      this.feedwater = this.feedwaterMax
    }
  }

  /**
   * Draw the column
   * @param {number} ticks - The current tick
   */
  draw(ticks) {
    // Get temperature range for current steam type
    const tempRanges = [
      { min: 100, max: 180 }, // Normal steam: 100-180°C
      { min: 180, max: 350 }, // Dense steam: 180-350°C
      { min: 350, max: 600 }, // Super dense steam: 350-600°C
      { min: 600, max: 1000 }, // Ultra dense steam: 600-1000°C
    ]
    const currentRange = tempRanges[this.steamType]

    // Calculate efficiency based on temperature
    let efficiencyText = ""
    if (this.heat < currentRange.min) {
      efficiencyText = `<span style="color: red;">Too cold (min: ${currentRange.min}°C)</span>`
    } else if (this.heat > currentRange.max) {
      efficiencyText = `<span style="color: orange;">Too hot (max: ${currentRange.max}°C)</span>`
    } else {
      const efficiency = Math.floor(((this.heat - currentRange.min) / (currentRange.max - currentRange.min)) * 100)
      efficiencyText = `<span style="color: green;">${efficiency}% efficient</span>`
    }

    this.tooltipText = `<b>BOILER</b><br>
      <p style="color: yellow; margin: 0px;">Column temperature: ${this.heat.toFixed(1)}°C</p>
      <p style="color: blue; margin: 0px;">Feedwater: ${this.feedwater} / ${this.feedwaterMax}</p>
      <p style="color: white; margin: 0px;">Steam: ${this.steam} / ${this.steamMax}</p>
      <p style="color: yellow; margin: 0px;">Steam Type: ${this.compressors[this.steamType]}</p>
      <p style="color: cyan; margin: 0px;">Temperature Range: ${currentRange.min}-${currentRange.max}°C</p>
      <p style="color: white; margin: 0px;">Efficiency: ${efficiencyText}</p>
      <p style="color: green; margin: 0px;">Power output: ${this.producedMW.toFixed(2)} MW</p>
      <p style="color: blue; margin: 0px;">Water input rate: 100 (Maximum)</p>
      <p style="color: cyan; margin: 0px;">Steam output rate: 100 (Maximum)</p>
      <p style="color: orange; margin: 0px;">Heat extraction: ${(0.1 * (1 + this.steamType * 0.5)).toFixed(2)}°C per unit</p>`
  }

  /**
   * Get the configuration UI
   * @returns {HTMLElement} - The configuration element
   */
  getConfig() {
    const stuff = document.createElement("div")

    // Add compression button
    const compressionBtn = createElement(
      "button",
      {
        className: "textButton",
        style: { fontSize: "27px" },
        configmenuaction: "compression",
        onclick: "configMenuAction()",
      },
      `Steam Type: ${this.compressors[this.steamType]}`,
    )

    stuff.appendChild(compressionBtn)

    return stuff
  }
}

/**
 * Moderator column
 */
export class Moderator extends Column {
  /**
   * Create a new Moderator column
   */
  constructor() {
    super(5, { enabled: true, text: "<b>MODERATOR</b>" })
    this.display = new Display(5, this)
  }

  /**
   * Draw the column
   * @param {number} ticks - The current tick
   */
  draw(ticks) {
    this.tooltipText = `<b>MODERATOR</b><br><p style="color: yellow; margin: 0px;">Column temperature: ${this.heat.toFixed(1)}°C</p>`
  }
}

/**
 * Absorber column
 */
export class Absorber extends Column {
  /**
   * Create a new Absorber column
   */
  constructor() {
    super(6, { enabled: true, text: "<b>ABSORBER</b>" })
    this.display = new Display(6, this)
  }

  /**
   * Draw the column
   * @param {number} ticks - The current tick
   */
  draw(ticks) {
    this.tooltipText = `<b>ABSORBER</b><br><p style="color: yellow; margin: 0px;">Column temperature: ${this.heat.toFixed(1)}°C</p>`
  }
}

/**
 * Reflector column
 */
export class Reflector extends Column {
  /**
   * Create a new Reflector column
   */
  constructor() {
    super(7, { enabled: true, text: "<b>REFLECTOR</b>" })
    this.display = new Display(7, this)
  }

  /**
   * Draw the column
   * @param {number} ticks - The current tick
   */
  draw(ticks) {
    this.tooltipText = `<b>REFLECTOR</b><br><p style="color: yellow; margin: 0px;">Column temperature: ${this.heat.toFixed(1)}°C</p>`
  }
}

/**
 * Outgasser column
 */
export class Outgasser extends Column {
  /**
   * Create a new Outgasser column
   */
  constructor() {
    super(8, { enabled: true, text: "<b>OUTGASSER</b>" })
    this.display = new Display(8, this)

    this.gas = 0
    this.gasMax = 0
    this.gasType = 9
    this.progress = 0
  }

  /**
   * Draw the column
   * @param {number} ticks - The current tick
   */
  draw(ticks) {
    this.tooltipText = `<b>OUTGASSER</b><br><p style="color: yellow; margin: 0px;">Column temperature: ${this.heat.toFixed(1)}°C</p>`
  }

  /**
   * Reset the column
   */
  reset() {
    this.gas = 0
    this.progress = 0
  }
}

/**
 * Storage column
 */
export class Storage extends Column {
  /**
   * Create a new Storage column
   */
  constructor() {
    super(11, { enabled: true, text: "<b>STORAGE</b>" })
    this.display = new Display(11, this)
  }

  /**
   * Draw the column
   * @param {number} ticks - The current tick
   */
  draw(ticks) {
    this.tooltipText = `<b>STORAGE</b><br><p style="color: yellow; margin: 0px;">Column temperature: ${this.heat.toFixed(1)}°C</p>`
  }
}

/**
 * Cooler column
 */
export class Cooler extends Column {
  /**
   * Create a new Cooler column
   */
  constructor() {
    super(12, { enabled: true, text: "<b>COOLER</b>" })
    this.display = new Display(12, this)

    this.cooled = 0
    this.cryo = 0
    this.cryoMax = 8000
    this.cryoType = 37
  }

  /**
   * Update the column
   * @param {number} ticks - The current tick
   * @param {Object} rbmk - The RBMK instance
   */
  update(ticks, rbmk) {
    if (this.cryo > this.cryoMax) this.cryo = this.cryoMax

    if (this.heat > 750) {
      const heatProvided = this.heat - 750
      const cooling = Math.min(heatProvided, this.cryo)

      this.heat -= cooling
      this.cryo -= cooling
    }

    super.update(ticks, rbmk)
  }

  /**
   * Draw the column
   * @param {number} ticks - The current tick
   */
  draw(ticks) {
    this.tooltipText = `<b>COOLER</b><br><p style="color: yellow; margin: 0px;">Column temperature: ${this.heat.toFixed(1)}°C</p>`
  }

  /**
   * Reset the column
   */
  reset() {
    this.cooled = 0
    this.cryo = 0
  }
}

/**
 * Heat exchanger column
 */
export class Heatex extends Column {
  /**
   * Create a new Heatex column
   */
  constructor() {
    super(13, { enabled: true, text: "<b>HEATEX</b>" })
    this.display = new Display(13, this)
    this.display.draw2 = function (x, y, rbmk) {
      // Coolant
      const h = quickMath(this.column.coolant, 8, this.column.coolantMax)
      const h2 = quickMath(this.column.coolant, 26, this.column.coolantMax)
      rbmk.statsRenderer.draw("image", {
        img: rbmk.consoleImg,
        crop: true,

        x: x * 32 + 3,
        y: y * 32 + 3 + 26 - h2,
        w: 10,
        h: h2,

        sX: 131,
        sY: 184 + (8 - h),
        sW: 3,
        sH: h,
      })

      // Hot Coolant
      const hotH = quickMath(this.column.hotcoolant, 8, this.column.hotcoolantMax)
      const hotH2 = quickMath(this.column.hotcoolant, 26, this.column.hotcoolantMax)
      rbmk.statsRenderer.draw("image", {
        img: rbmk.consoleImg,
        crop: true,

        x: x * 32 + 19,
        y: y * 32 + 3 + 26 - hotH2,
        w: 10,
        h: hotH2,

        sX: 136,
        sY: 183 + (8 - hotH),
        sW: 3,
        sH: hotH,
      })
    }

    this.coolant = 0
    this.coolantMax = 16000

    this.hotcoolant = 0
    this.hotcoolantMax = 16000
  }

  /**
   * Draw the column
   * @param {number} ticks - The current tick
   */
  draw(ticks) {
    this.tooltipText = `<b>HEATEX</b><br><p style="color: yellow; margin: 0px;">Column temperature: ${this.heat.toFixed(1)}°C</p><p style="color: blue; margin: 0px;">Coolant: ${this.coolant} / ${this.coolantMax}</p><p style="color: red; margin: 0px;">Hot Coolant: ${this.hotcoolant} / ${this.hotcoolantMax}</p>`
  }

  /**
   * Reset the column
   */
  reset() {
    this.coolant = 0
    this.hotcoolant = 0
  }
}
