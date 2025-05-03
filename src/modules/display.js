import { quickMath } from './utils.js';

/**
 * Display class for rendering column data
 */
export class Display {
  /**
   * Create a new Display
   * @param {number} displayIndex - The display index
   * @param {Object} column - The column to display
   */
  constructor(displayIndex, column) {
    this.displayIndex = displayIndex * 10;
    this.column = column;
  }

  /**
   * Draw the display
   * @param {number} x - The x position
   * @param {number} y - The y position
   * @param {Object} rbmk - The RBMK instance
   */
  draw(x, y, rbmk) {
    // The heat will always render
    const h = quickMath(this.column.heat - 20, 10, this.column.maxHeat);
    const h2 = quickMath(this.column.heat - 20, 32, this.column.maxHeat);
    
    rbmk.statsRenderer.draw("image", {
      img: rbmk.consoleImg,
      crop: true,

      x: x * 32,
      y: y * 32 + 32 - h2,
      w: 32,
      h: h2,

      sX: 0,
      sY: 182 + (10 - h),
      sW: 10,
      sH: h,
    });

    // Other
    this.draw2(x, y, rbmk);
  }

  /**
   * Draw additional display elements
   * @param {number} x - The x position
   * @param {number} y - The y position
   * @param {Object} rbmk - The RBMK instance
   */
  draw2(x, y, rbmk) {
    rbmk.statsRenderer.draw("image", {
      img: rbmk.consoleImg,
      crop: true,

      x: x * 32,
      y: y * 32,
      w: 32,
      h: 32,

      sX: this.displayIndex,
      sY: 182,
      sW: 10,
      sH: 10,
    });
  }
}