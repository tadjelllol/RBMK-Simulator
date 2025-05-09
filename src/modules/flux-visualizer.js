/**
 * Flux Visualizer for the RBMK Simulator
 * Renders arrows showing neutron flux movement between columns
 */

import { RBMKDials, NType } from "./constants.js"

/**
 * Initialize the flux visualization layer
 * @param {Object} rbmk - The RBMK instance
 * @returns {Object} - The flux visualization context
 */
export function initFluxVisualizer(rbmk) {
  // Create a new canvas for flux visualization
  const fluxCanvas = document.createElement("canvas")
  fluxCanvas.id = "flux-viz"
  fluxCanvas.width = rbmk.width * 32
  fluxCanvas.height = rbmk.height * 32
  fluxCanvas.style.position = "absolute"
  fluxCanvas.style.top = "0"
  fluxCanvas.style.left = "0"
  fluxCanvas.style.zIndex = "3"
  fluxCanvas.style.pointerEvents = "none" // Allow clicks to pass through
  fluxCanvas.style.display = "none" // Hidden by default

  // Add the canvas to the reactor container
  const reactorContainer = document.querySelector(".panel div[style*='position: relative']")
  if (reactorContainer) {
    reactorContainer.appendChild(fluxCanvas)
    console.log("Flux canvas attached to reactor container")
  } else {
    console.error("Could not find reactor container")
  }

  const fluxCtx = fluxCanvas.getContext("2d")

  return {
    canvas: fluxCanvas,
    ctx: fluxCtx,
    visible: false,
    fluxData: [],
    lastUpdate: 0,
  }
}

/**
 * Update the flux visualization data
 * @param {Object} rbmk - The RBMK instance
 * @param {Object} fluxViz - The flux visualization object
 */
export function updateFluxData(rbmk, fluxViz) {
  // Only update every few ticks to avoid performance issues
  if (window.options.frames - fluxViz.lastUpdate < 5) return
  fluxViz.lastUpdate = window.options.frames

  // Clear previous flux data
  fluxViz.fluxData = []

  // Collect flux data from all fuel columns
  rbmk.columns.forEach((column, index) => {
    if (column && column.constructor.name === "Fuel" && column.fuel.constructor.name !== "NONE") {
      const x = index % rbmk.width
      const y = Math.floor(index / rbmk.width)

      // For each direction, trace the flux path
      column.dirs.forEach((dir, dirIndex) => {
        // Skip if no flux in this direction
        let fluxType = column.moderated ? NType.SLOW : column.fuel.rType
        let fluxStrength = fluxType === NType.SLOW ? column.fluxSlow : column.fluxFast

        // Skip if flux is too weak
        if (fluxStrength < 0.1) return

        // Calculate offset for arrows to be side by side
        const offset = 6 // Offset in pixels
        let offsetX = 0
        let offsetY = 0

        // Calculate offset based on direction to make arrows side by side
        if (dir.offsetX === 0) {
          // Vertical direction (up/down)
          offsetX = dirIndex % 2 === 0 ? -offset : offset
        } else {
          // Horizontal direction (left/right)
          offsetY = dirIndex % 2 === 0 ? -offset : offset
        }

        // Trace the flux path through the reactor
        let currentX = x
        let currentY = y
        let nextX, nextY
        let continueTracing = true
        let range = 0

        while (continueTracing && range < RBMKDials.dialFluxRange) {
          range++
          nextX = currentX + dir.offsetX
          nextY = currentY + dir.offsetY

          // Check if we're out of bounds
          if (nextX < 0 || nextX >= rbmk.width || nextY < 0 || nextY >= rbmk.height) {
            continueTracing = false
            break
          }

          const nextIndex = nextX + rbmk.width * nextY
          const nextColumn = rbmk.columns[nextIndex]

          // If there's no column, stop tracing
          if (!nextColumn) {
            continueTracing = false
            break
          }

          // For outgoing flux (from fuel rod), use the original offset
          // For incoming flux (to another fuel rod), use the opposite offset
          let arrowOffsetX = offsetX
          let arrowOffsetY = offsetY

          // If the next column is a fuel rod, reverse the offset for the incoming arrow
          if (nextColumn.constructor.name === "Fuel") {
            arrowOffsetX = -offsetX
            arrowOffsetY = -offsetY
          }

          // Add flux data for this segment
          fluxViz.fluxData.push({
            fromX: currentX,
            fromY: currentY,
            toX: nextX,
            toY: nextY,
            strength: fluxStrength,
            type: fluxType === NType.SLOW ? "slow" : "fast",
            offsetX: arrowOffsetX,
            offsetY: arrowOffsetY,
          })

          // Update current position
          currentX = nextX
          currentY = nextY

          // Check what happens to the flux based on the column type
          if (nextColumn.constructor.name === "Fuel") {
            // Fuel absorbs flux, stop tracing
            continueTracing = false
          } else if (nextColumn.constructor.name === "Control") {
            // Control rods reduce flux
            fluxStrength *= nextColumn.mult
            if (fluxStrength <= 0.1) {
              continueTracing = false
            }
          } else if (nextColumn.constructor.name === "Moderator") {
            // Moderator changes flux type to slow
            fluxType = NType.SLOW
          } else if (nextColumn.constructor.name === "Absorber") {
            // Absorber stops flux
            continueTracing = false
          } else if (nextColumn.constructor.name === "Reflector") {
            // Reflector bounces flux back, stop tracing
            continueTracing = false
          }
          // Other column types (like blank, boiler, etc.) let flux pass through
        }
      })
    }
  })
}

/**
 * Draw the flux visualization
 * @param {Object} rbmk - The RBMK instance
 * @param {Object} fluxViz - The flux visualization object
 */
export function drawFluxVisualization(rbmk, fluxViz) {
  if (!fluxViz.visible) return

  const ctx = fluxViz.ctx
  ctx.clearRect(0, 0, fluxViz.canvas.width, fluxViz.canvas.height)

  // Debug - draw a test arrow if no flux data
  if (fluxViz.fluxData.length === 0) {
    ctx.strokeStyle = "rgba(255, 0, 0, 0.8)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(100, 100)
    ctx.lineTo(200, 200)
    ctx.stroke()

    // Draw arrow head
    const headLength = 10
    const angle = Math.PI / 4 // 45 degrees for our test arrow
    ctx.beginPath()
    ctx.moveTo(200, 200)
    ctx.lineTo(200 - headLength * Math.cos(angle - 0.5), 200 - headLength * Math.sin(angle - 0.5))
    ctx.lineTo(200 - headLength * Math.cos(angle + 0.5), 200 - headLength * Math.sin(angle + 0.5))
    ctx.closePath()
    ctx.fillStyle = "rgba(255, 0, 0, 0.8)"
    ctx.fill()

    // Add text to explain the issue
    ctx.font = "12px monospace"
    ctx.fillStyle = "white"
    ctx.fillText("No flux data - place fuel rods and run simulation", 50, 230)
    return
  }

  // Draw flux arrows
  fluxViz.fluxData.forEach((flux) => {
    // Calculate arrow positions with offset to avoid overlapping
    const fromX = flux.fromX * 32 + 16 + flux.offsetX
    const fromY = flux.fromY * 32 + 16 + flux.offsetY
    const toX = flux.toX * 32 + 16 + flux.offsetX
    const toY = flux.toY * 32 + 16 + flux.offsetY

    // Calculate arrow direction
    const dx = toX - fromX
    const dy = toY - fromY
    const angle = Math.atan2(dy, dx)

    // Set arrow color and width based on flux type and strength
    if (flux.type === "fast") {
      ctx.strokeStyle = `rgba(255, 50, 50, ${Math.min(0.9, flux.strength / 10)})`
    } else {
      ctx.strokeStyle = `rgba(50, 255, 50, ${Math.min(0.9, flux.strength / 10)})`
    }

    // Line width based on flux strength
    ctx.lineWidth = Math.min(3, 1 + flux.strength / 20)

    // Draw arrow line
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.lineTo(toX, toY)
    ctx.stroke()

    // Draw arrow head
    const headLength = 8
    const headAngle = 0.5

    ctx.beginPath()
    ctx.moveTo(toX, toY)
    ctx.lineTo(toX - headLength * Math.cos(angle - headAngle), toY - headLength * Math.sin(angle - headAngle))
    ctx.lineTo(toX - headLength * Math.cos(angle + headAngle), toY - headLength * Math.sin(angle + headAngle))
    ctx.closePath()
    ctx.fillStyle = ctx.strokeStyle
    ctx.fill()
  })
}

/**
 * Toggle flux visualization
 * @param {Object} fluxViz - The flux visualization object
 * @returns {boolean} - The new visibility state
 */
export function toggleFluxVisualization(fluxViz) {
  fluxViz.visible = !fluxViz.visible
  fluxViz.canvas.style.display = fluxViz.visible ? "block" : "none"
  console.log("Flux visualization toggled:", fluxViz.visible)
  return fluxViz.visible
}
