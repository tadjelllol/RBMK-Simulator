import { EnumBurnFunc, EnumBurnFunc2, EnumDepleteFunc, NType } from "./constants.js"

/**
 * Base class for all RBMK fuel types
 */
export class RBMKFuel {
  /**
   * Create a new RBMKFuel
   */
  constructor() {
    this.column = null

    this.fullName = ""
    this.reactivity = 0
    this.selfRate = 0
    this.function = EnumBurnFunc.LOG_TEN
    this.displayFunc = EnumBurnFunc2.LOG_TEN
    this.depFunc = EnumDepleteFunc.GENTLE_SLOPE
    this.xGen = 0.5
    this.xBurn = 50
    this.heat = 1
    // This is yieldd because of Uncaught SyntaxError: yield is a reserved identifier
    this.yieldd = 0
    this.defaultYield = 0
    this.meltingPoint = 1000
    this.diffusion = 0.2
    this.nType = NType.SLOW
    this.rType = NType.FAST

    this.xenon = 0
    this.coreHeat = 20
    this.skinHeat = 20

    this.texture =
      "https://raw.githubusercontent.com/HbmMods/Hbm-s-Nuclear-Tech-GIT/master/src/main/resources/assets/hbm/textures/items/rbmk_fuel_empty.png"
  }

  /**
   * Set the yield of the fuel
   * @param {number} yieldd - The yield value
   */
  setYield(yieldd) {
    this.yieldd = yieldd
    this.defaultYield = yieldd
  }

  /**
   * Set the stats of the fuel
   * @param {number} funcEnd - The function end value
   * @param {number} selfRate - The self rate
   */
  setStats(funcEnd, selfRate) {
    this.reactivity = funcEnd
    this.selfRate = selfRate || 0
  }

  /**
   * Set the function of the fuel
   * @param {string} func - The function name
   */
  setFunction(func) {
    this.function = func
    this.displayFunc = EnumBurnFunc2[func]
  }

  /**
   * Set the depletion function of the fuel
   * @param {string} func - The depletion function
   */
  setDepletionFunction(func) {
    this.depFunc = func
  }

  /**
   * Set the xenon properties of the fuel
   * @param {number} xGen - The xenon generation value
   * @param {number} xBurn - The xenon burn value
   */
  setXenon(xGen, xBurn) {
    this.xGen = xGen
    this.xBurn = xBurn
  }

  /**
   * Set the diffusion of the fuel
   * @param {number} diffusion - The diffusion value
   */
  setDiffusion(diffusion) {
    this.diffusion = diffusion
  }

  /**
   * Set the heat of the fuel
   * @param {number} heat - The heat value
   */
  setHeat(heat) {
    this.heat = heat
  }

  /**
   * Set the melting point of the fuel
   * @param {number} meltingPoint - The melting point
   */
  setMeltingPoint(meltingPoint) {
    this.meltingPoint = meltingPoint
  }

  /**
   * Set the name of the fuel
   * @param {string} name - The name
   */
  setName(name) {
    this.fullName = name
  }

  /**
   * Set the texture of the fuel
   * @param {string} tex - The texture name
   */
  setTexture(tex) {
    // Load textures from the GitHub repo instead of shoving every single texture inside the site files
    this.texture = `https://raw.githubusercontent.com/HbmMods/Hbm-s-Nuclear-Tech-GIT/master/src/main/resources/assets/hbm/textures/items/${tex}.png`
  }

  /**
   * Set the neutron types of the fuel
   * @param {string} nType - The neutron type
   * @param {string} rType - The reaction type
   */
  setNeutronTypes(nType, rType) {
    this.nType = nType
    this.rType = rType || NType.FAST
  }

  /**
   * Calculate the depletion of the fuel
   * @returns {number} - The depletion percentage
   */
  calcDepletion() {
    return (((this.defaultYield - this.yieldd) / this.defaultYield) * 100000) / 1000
  }

  /**
   * Get the function description
   * @returns {string} - The function description
   */
  getFuncDescription() {
    let func = ""

    switch (this.function) {
      case "PASSIVE":
        func = `${this.selfRate}`
        break
      case "LOG_TEN":
        func = "log10(%1$s + 1) * 0.5 * %2$s"
        break
      case "PLATEU":
        func = "(1 - e^-%1$s / 25)) * %2$s"
        break
      case "ARCH":
        func = "(%1$s - %1$s² / 10000) / 100 * %2$s [0;∞]"
        break
      case "SIGMOID":
        func = "%2$s / (1 + e^(-(%1$s - 50) / 10)"
        break
      case "SQUARE_ROOT":
        func = "sqrt(%1$s) * %2$s / 10"
        break
      case "LINEAR":
        func = "%1$s / 100 * %2$s"
        break
      case "QUADRATIC":
        func = "%1$s² / 10000 * %2$s"
        break
      case "EXPERIMENTAL":
        func = "%1$s * (sin(%1$s) + 1) * %2$s"
        break
      default:
        func = "ERROR"
        break
    }

    const enrichment = this.getEnrichment()
    if (enrichment < 1) {
      const enrichmentMod = this.reactivityModByEnrichment(enrichment)
      const reactivity = `<span style="color: yellow;">${((this.reactivity * enrichmentMod * 1000) / 1000).toFixed(1)}</span>`
      const enrichmentPer = `<span style="color: gold;">${((enrichmentMod * 1000) / 10).toFixed(1)}%</span>`

      return func
        .replaceAll(
          "%1$s",
          this.selfRate > 0 ? `(x <span style="color: red;">+ ${this.selfRate.toFixed(1)}</span>)` : "x",
        )
        .replaceAll("%2$s", reactivity)
        .concat(enrichmentPer)
    }

    return func
      .replaceAll(
        "%1$s",
        this.selfRate > 0 ? `(x <span style="color: red;">+ ${this.selfRate.toFixed(1)}</span>)` : "x",
      )
      .replaceAll("%2$s", this.reactivity.toFixed(1))
  }

  /**
   * Burn the fuel
   * @param {number} inFlux - The input flux
   * @returns {number} - The output flux
   */
  burn(inFlux) {
    inFlux += this.selfRate

    let xenon = this.xenon
    xenon -= this.xenonBurnFunc(inFlux)

    inFlux *= 1 - this.getPoisonLevel()

    xenon += this.xenonGenFunc(inFlux)

    if (xenon < 0) xenon = 0
    if (xenon > 100) xenon = 100

    this.xenon = xenon

    const outFlux = this.reactivityFunc(inFlux, this.getEnrichment() * window.RBMKDials.dialReactivityMod)
    let y = this.yieldd
    y -= inFlux

    if (y < 0) y = 0

    this.yieldd = y

    let coreHeat = this.coreHeat
    coreHeat += outFlux * this.heat

    this.coreHeat = this.rectify(coreHeat)

    return outFlux
  }

  /**
   * Update the heat of the fuel
   * @param {number} mod - The heat modifier
   */
  updateHeat(mod) {
    let coreHeat = this.coreHeat
    let hullHeat = this.skinHeat

    if (coreHeat > hullHeat) {
      const mid = (coreHeat - hullHeat) / 2

      coreHeat -= mid * this.diffusion * window.RBMKDials.dialDiffusionMod * mod
      hullHeat += mid * this.diffusion * window.RBMKDials.dialDiffusionMod * mod

      this.coreHeat = this.rectify(coreHeat)
      this.skinHeat = this.rectify(hullHeat)
    }
  }

  /**
   * Provide heat to the fuel
   * @param {number} heat - The heat
   * @param {number} mod - The heat modifier
   * @returns {number} - The heat provided
   */
  provideHeat(heat, mod) {
    let hullHeat = this.skinHeat

    if (hullHeat > this.meltingPoint) {
      const coreHeat = this.coreHeat
      const avg = (heat + hullHeat + coreHeat) / 3
      this.coreHeat = avg
      this.skinHeat = avg
      return avg - heat
    }

    if (hullHeat <= heat) return 0

    let ret = (hullHeat - heat) / 2
    ret *= window.RBMKDials.dialHeatProvision * mod

    hullHeat -= ret
    this.skinHeat = hullHeat

    return ret
  }

  /**
   * Calculate the reactivity
   * @param {number} inFlux - The input flux
   * @param {number} enrichment - The enrichment
   * @returns {number} - The reactivity
   */
  reactivityFunc(inFlux, enrichment) {
    const flux = inFlux * this.reactivityModByEnrichment(enrichment)

    switch (this.function) {
      case "PASSIVE":
        return this.selfRate * enrichment
      case "LOG_TEN":
        return Math.log10(flux + 1) * 0.5 * this.reactivity
      case "PLATEU":
        return (1 - Math.pow(Math.E, -flux / 25)) * this.reactivity
      case "ARCH":
        return Math.max(((flux - (flux * flux) / 10000) / 100) * this.reactivity, 0)
      case "SIGMOID":
        return this.reactivity / (1 + Math.pow(Math.E, -(flux - 50) / 10))
      case "SQUARE_ROOT":
        return (Math.sqrt(flux) * this.reactivity) / 10
      case "LINEAR":
        return (flux / 100) * this.reactivity
      case "QUADRATIC":
        return ((flux * flux) / 10000) * this.reactivity
      case "EXPERIMENTAL":
        return flux * (Math.sin(flux) + 1) * this.reactivity
    }

    return 0
  }

  /**
   * Calculate the reactivity modifier by enrichment
   * @param {number} enrichment - The enrichment
   * @returns {number} - The modifier
   */
  reactivityModByEnrichment(enrichment) {
    switch (this.depFunc) {
      default:
      case "LINEAR":
        return enrichment
      case "STATIC":
        return 1
      case "BOOSTED_SLOPE":
        return enrichment + Math.sin((enrichment - 1) * (enrichment - 1) * Math.PI)
      case "RAISING_SLOPE":
        return enrichment + Math.sin(enrichment * Math.PI) / 2
      case "GENTLE_SLOPE":
        return enrichment + Math.sin(enrichment * Math.PI) / 3
    }
  }

  /**
   * Calculate the xenon generation
   * @param {number} flux - The flux
   * @returns {number} - The xenon generation
   */
  xenonGenFunc(flux) {
    return flux * this.xGen
  }

  /**
   * Calculate the xenon burn
   * @param {number} flux - The flux
   * @returns {number} - The xenon burn
   */
  xenonBurnFunc(flux) {
    return (flux * flux) / this.xBurn
  }

  /**
   * Get the poison level
   * @returns {number} - The poison level
   */
  getPoisonLevel() {
    return this.xenon / 100
  }

  /**
   * Get the enrichment
   * @returns {number} - The enrichment
   */
  getEnrichment() {
    return this.yieldd / this.defaultYield
  }

  /**
   * Rectify a number
   * @param {number} num - The number to rectify
   * @returns {number} - The rectified number
   */
  rectify(num) {
    if (num > 1_000_000) num = 1_000_000
    if (num < 20 || isNaN(num)) num = 20

    return num
  }
}
