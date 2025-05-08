import { Renderer } from "./renderer.js"
import { Assets } from "./constants.js"
import { Blank } from "./column-base.js"

/**
 * RBMK reactor class
 */
export class RBMK {
  /**
   * Create a new RBMK instance
   * @param {number} width - The width of the reactor
   * @param {number} height - The height of the reactor
   * @param {Renderer} renderer - The main renderer
   * @param {Renderer} statsRenderer - The stats renderer
   * @param {Array} columns - The reactor columns
   */
  constructor(width, height, renderer, statsRenderer, columns) {
    this.width = width
    this.height = height
    this.renderer = renderer
    this.statsRenderer = statsRenderer
    this.columns = columns

    // Update the consoleImg initialization to use the correct path in
    this.consoleImg = new Image()
    this.consoleImg.crossOrigin = "anonymous"
    this.consoleImg.src = "/assets/gui_rbmk_console.png"
    this.imageLoadFailed = false

    // Add error handling for image loading
    this.consoleImg.onerror = (e) => {
      console.warn("Failed to load RBMK console image, using fallback grid", e)
      this.imageLoadFailed = true
      this.draw(0)
    }

    // Wait for image to load before using it
    this.consoleImg.onload = () => {
      console.log("Successfully loaded RBMK console image")
      this.imageLoadFailed = false
      this.draw(0)
    }

    this.reaSim = false
    this.expSound = new Audio(Assets.explosionSound)
  }

  /**
   * Draw fallback grid pattern
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  drawFallbackGrid(x, y) {
    const ctx = this.renderer.canvas

    // Draw background
    ctx.fillStyle = "#2c3e50"
    ctx.fillRect(x * 32, y * 32, 32, 32)

    // Draw grid lines
    ctx.strokeStyle = "#34495e"
    ctx.lineWidth = 1
    for (let i = 0; i <= 3; i++) {
      for (let j = 0; j <= 3; j++) {
        ctx.strokeRect(x * 32 + i * 8, y * 32 + j * 8, 8, 8)
      }
    }
  }

  /**
   * Update the reactor
   * @param {number} ticks - The current tick
   */
  update(ticks) {
    this.columns.forEach((column) => {
      if (column !== null) {
        column.update(ticks, this)
      }
    })
  }

  /**
   * Trigger a meltdown
   */
  meltdown() {
    this.expSound.volume = 0.4
    this.expSound.pause()
    this.expSound.currentTime = 0
    this.expSound.play()
    window.options.simulating = false
    document.getElementById("explosionText").style.visibility = "visible"
  }

  /**
   * Update the canvas size
   */
  updateCanvasSize() {
    this.renderer.canvasObj.width = this.width * 32
    this.renderer.canvasObj.height = this.height * 32

    this.statsRenderer.canvasObj.width = this.width * 32
    this.statsRenderer.canvasObj.height = this.height * 32
  }

  /**
   * Draw the reactor
   * @param {number} ticks - The current tick
   */
  draw(ticks) {
    this.renderer.reset()
    this.statsRenderer.reset()

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const column = this.columns[x + this.width * y]

        if (this.imageLoadFailed) {
          this.drawFallbackGrid(x, y)
        } else if (this.consoleImg.complete && this.consoleImg.naturalWidth > 0) {
          // For sprite sheet stuff
          let columnX = 140
          const columnY = 172

          if (column !== null) {
            columnX = column.index * 10
            column.display.draw(x, y, this)

            const rect = this.renderer.canvasObj.getBoundingClientRect()
            if (
              window.mPos[0] - rect.x > x * 32 &&
              window.mPos[1] - rect.y > y * 32 &&
              window.mPos[0] - rect.x < x * 32 + 32 &&
              window.mPos[1] - rect.y < y * 32 + 32 &&
              column.tooltip === true
            ) {
              window.tooltip.innerHTML = column.tooltipText
              window.tooltip.style.visibility = "visible"
            }

            if (window.options.config.columnIndexSelected === x + this.width * y) {
              this.statsRenderer.draw("image", {
                img: this.consoleImg,
                crop: true,

                x: x * 32,
                y: y * 32,
                w: 32,
                h: 32,

                sX: 0,
                sY: 192,
                sW: 10,
                sH: 10,
              })
            }
          }

          this.renderer.draw("image", {
            img: this.consoleImg,
            crop: true,

            x: x * 32,
            y: y * 32,
            w: 32,
            h: 32,

            sX: columnX,
            sY: columnY,
            sW: 10,
            sH: 10,
          })
        }
      }
    }

    this.columns.forEach((column) => {
      if (column !== null) {
        column.draw(ticks)
      }
    })
  }

  /**
   * Stop the simulation
   */
  stopSimulation() {
    window.options.frames = 0
    document.getElementById("explosionText").style.visibility = "hidden"

    this.columns.forEach((column) => {
      if (column !== null) {
        column.heat = 20
        column.rs_steam = 0
        column.rs_water = 0

        column.reset()
      }
    })
  }
}

/**
 * Create a new RBMK instance
 * @param {number} width - The width of the reactor
 * @param {number} height - The height of the reactor
 * @returns {RBMK} - The RBMK instance
 */
export function createRBMK(width = 15, height = 15) {
  const rbmkCanvas = document.getElementById("rbmk")
  const statsCanvas = document.getElementById("stats")

  const renderer = new Renderer(rbmkCanvas)
  const statsRenderer = new Renderer(statsCanvas)

  const columns = new Array(width * height).fill(null)

  // Mark the center with a blank column
  const centerIndex = Math.floor((width * height) / 2)
  columns[centerIndex] = new Blank()
  columns[centerIndex].x = Math.floor(width / 2)
  columns[centerIndex].y = Math.floor(height / 2)

  const rbmk = new RBMK(width, height, renderer, statsRenderer, columns)

  return rbmk
}
