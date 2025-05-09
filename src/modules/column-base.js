import { Display } from "./display.js"
import { RBMKDials } from "./constants.js"

/**
 * Base class for all RBMK columns
 */
export class Column {
  /**
   * Create a new Column
   * @param {number} index - The column index
   * @param {Object} tp - The tooltip configuration
   */
  constructor(index, tp = { enabled: true, text: "<b>BLANK</b>" }) {
    this.index = index
    this.display = null

    this.moderated = false
    this.heat = 20
    this.maxHeat = 1500
    this.heatCache = []

    // Tooltip
    this.tooltip = tp.enabled
    this.tooltipText = tp.text

    // Other
    this.x = 0
    this.y = 0

    // Make sure directions are correct - these were reversed in the original code
    this.dirs = [
      { offsetX: 0, offsetY: -1 }, // Up
      { offsetX: 1, offsetY: 0 }, // Right
      { offsetX: 0, offsetY: 1 }, // Down
      { offsetX: -1, offsetY: 0 }, // Left
    ]
  }

  /**
   * Update the column
   * @param {number} ticks - The current tick
   * @param {Object} rbmk - The RBMK instance
   */
  update(ticks, rbmk) {
    this.moveHeat(rbmk)
    this.coolPassively()
  }

  /**
   * Move heat between columns
   * @param {Object} rbmk - The RBMK instance
   */
  moveHeat(rbmk) {
    const rec = [this]

    let heatTot = this.heat

    let index = 0
    this.dirs.forEach((dir) => {
      if (this.heatCache[index] != null) this.heatCache[index] = null

      if (this.heatCache[index] == null) {
        const column = rbmk.columns[this.x - dir.offsetX + rbmk.width * (this.y + dir.offsetY)]
        if (column instanceof Column) {
          this.heatCache[index] = column
        }
      }

      index++
    })

    this.heatCache.forEach((base) => {
      if (base != null) {
        rec.push(base)
        heatTot += base.heat
      }
    })

    const members = rec.length
    const stepSize = RBMKDials.dialColumnHeatFlow

    if (members > 1) {
      const targetHeat = heatTot / members

      rec.forEach((base) => {
        const delta = targetHeat - base.heat
        base.heat += delta * stepSize
      })
    }
  }

  /**
   * Cool the column passively
   */
  coolPassively() {
    this.heat -= RBMKDials.dialPassiveCooling

    if (this.heat < 20) this.heat = 20
  }

  /**
   * Draw the column
   * @param {number} ticks - The current tick
   */
  draw(ticks) {}

  /**
   * Reset the column
   */
  reset() {}

  /**
   * Get the configuration of the column
   * @returns {string|HTMLElement} - The configuration
   */
  getConfig() {
    return `<p class="noMargin">Not configurable</p>`
  }
}

/**
 * Blank column
 */
export class Blank extends Column {
  /**
   * Create a new Blank column
   */
  constructor() {
    super(0, { enabled: true, text: "<b>BLANK</b>" })
    this.display = new Display(15, this)
  }

  /**
   * Draw the column
   * @param {number} ticks - The current tick
   */
  draw(ticks) {
    this.tooltipText = `<b>BLANK</b><br><p style="color: yellow; margin: 0px;">Column temperature: ${this.heat.toFixed(1)}°C</p>`
  }
}
