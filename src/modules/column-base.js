import { Display } from './display.js';
import { RBMKDials } from './constants.js';

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
    this.index = index;
    this.display = null;

    this.moderated = false;
    this.heat = 20;
    this.maxHeat = 1500;
    this.heatCache = [];

    // ReaSim
    this.rs_steam = 0;
    this.rs_water = 0;
    this.rs_maxSteam = 16000;
    this.rs_maxWater = 16000;

    // Tooltip
    this.tooltip = tp.enabled;
    this.tooltipText = tp.text;

    // Other
    this.x = 0;
    this.y = 0;

    this.dirs = [
      {offsetX: 0, offsetY: -1},
      {offsetX: -1, offsetY: 0},
      {offsetX: 0, offsetY: 1},
      {offsetX: 1, offsetY: 0},
    ];
  }

  /**
   * Update the column
   * @param {number} ticks - The current tick
   * @param {Object} rbmk - The RBMK instance
   */
  update(ticks, rbmk) {
    this.moveHeat(rbmk);
    if (RBMKDials.dialReasimBoilers === true) {
      this.boilWater();
    }
    this.coolPassively();

    if (this.rs_water > this.rs_maxWater)
      this.rs_water = this.rs_maxWater;
  }

  /**
   * Boil water in the column
   */
  boilWater() {
    if (this.heat < 100)
      return;

    const heatConsumption = RBMKDials.dialBoilerHeatConsumption;
    const availableHeat = (this.heat - 100) / heatConsumption;
    const availableWater = this.rs_water;
    const availableSpace = this.rs_maxSteam - this.rs_steam;

    const processedWater = Math.floor(Math.min(availableHeat, Math.min(availableWater, availableSpace)) * RBMKDials.dialReasimBoilerSpeed);

    this.rs_water -= processedWater;
    this.rs_steam += processedWater;
    this.heat -= processedWater * heatConsumption;
  }

  /**
   * Move heat between columns
   * @param {Object} rbmk - The RBMK instance
   */
  moveHeat(rbmk) {
    const rec = [this];

    let heatTot = this.heat;
    let waterTot = this.water || 0;
    let steamTot = this.steam || 0;

    let index = 0;
    this.dirs.forEach(dir => {
      if (this.heatCache[index] != null)
        this.heatCache[index] = null;

      if (this.heatCache[index] == null) {
        const column = rbmk.columns[(this.x - dir.offsetX) + rbmk.width * (this.y + dir.offsetY)];
        if (column instanceof Column) {
          this.heatCache[index] = column;
        }
      }

      index++;
    });

    this.heatCache.forEach(base => {
      if (base != null) {
        rec.push(base);
        heatTot += base.heat;
        waterTot += base.water || 0;
        steamTot += base.steam || 0;
      }
    });

    const members = rec.length;
    const stepSize = RBMKDials.dialColumnHeatFlow;

    if (members > 1) {
      const targetHeat = heatTot / members;

      const tWater = waterTot / members;
      const rWater = waterTot % members;
      const tSteam = steamTot / members;
      const rSteam = steamTot % members;

      rec.forEach(base => {
        const delta = targetHeat - base.heat;
        base.heat += delta * stepSize;

        if (typeof base.rs_water !== 'undefined') {
          base.rs_water = tWater;
        }
        if (typeof base.rs_steam !== 'undefined') {
          base.rs_steam = tSteam;
        }
      });

      this.rs_water += rWater;
      this.rs_steam += rSteam;
    }
  }

  /**
   * Cool the column passively
   */
  coolPassively() {
    this.heat -= RBMKDials.dialPassiveCooling;

    if (this.heat < 20)
      this.heat = 20;
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
    return `<p class="noMargin">Not configurable</p>`;
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
    super(0, {enabled: true, text: "<b>BLANK</b>"});
    this.display = new Display(15, this);
  }

  /**
   * Draw the column
   * @param {number} ticks - The current tick
   */
  draw(ticks) {
    this.tooltipText = `<b>BLANK</b><br><p style="color: yellow; margin: 0px;">Column temperature: ${this.heat.toFixed(1)}°C</p>`;
  }
}