/**
 * Temperature Visualizer for the RBMK Simulator
 * Renders a heat map overlay showing temperature distribution
 */

/**
 * Initialize the temperature visualization layer
 * @param {Object} rbmk - The RBMK instance
 * @returns {Object} - The temperature visualization context
 */
export function initTempVisualizer(rbmk) {
  // Create a new canvas for temperature visualization
  const tempCanvas = document.createElement("canvas")
  tempCanvas.id = "temp-viz"
  tempCanvas.width = rbmk.width * 32
  tempCanvas.height = rbmk.height * 32
  tempCanvas.style.position = "absolute"
  tempCanvas.style.top = "0"
  tempCanvas.style.left = "0"
  tempCanvas.style.zIndex = "3"
  tempCanvas.style.pointerEvents = "none" // Allow clicks to pass through
  tempCanvas.style.display = "none" // Hidden by default

  // Add the canvas to the reactor container
  const reactorContainer = document.querySelector(".panel div[style*='position: relative']")
  if (reactorContainer) {
    reactorContainer.appendChild(tempCanvas)
  }

  const tempCtx = tempCanvas.getContext("2d")

  return {
    canvas: tempCanvas,
    ctx: tempCtx,
    visible: false,
  }
}

/**
 * Draw the temperature visualization
 * @param {Object} rbmk - The RBMK instance
 * @param {Object} tempViz - The temperature visualization object
 */
export function drawTempVisualization(rbmk, tempViz) {
  if (!tempViz.visible) return

  const ctx = tempViz.ctx
  ctx.clearRect(0, 0, tempViz.canvas.width, tempViz.canvas.height)

  // Find the maximum temperature for scaling
  let maxTemp = 20
  rbmk.columns.forEach((column) => {
    if (column && column.heat > maxTemp) {
      maxTemp = column.heat
    }
  })

  // Draw temperature cells
  rbmk.columns.forEach((column, index) => {
    if (column) {
      const x = index % rbmk.width
      const y = Math.floor(index / rbmk.width)

      // Calculate temperature color
      const normalizedTemp = Math.min(1, (column.heat - 20) / (maxTemp - 20))

      // Color gradient: blue (cold) -> green -> yellow -> red (hot)
      let r, g, b, a

      if (normalizedTemp < 0.25) {
        // Blue to cyan
        r = 0
        g = Math.floor(255 * (normalizedTemp * 4))
        b = 255
      } else if (normalizedTemp < 0.5) {
        // Cyan to green
        r = 0
        g = 255
        b = Math.floor(255 * (1 - (normalizedTemp - 0.25) * 4))
      } else if (normalizedTemp < 0.75) {
        // Green to yellow
        r = Math.floor(255 * ((normalizedTemp - 0.5) * 4))
        g = 255
        b = 0
      } else {
        // Yellow to red
        r = 255
        g = Math.floor(255 * (1 - (normalizedTemp - 0.75) * 4))
        b = 0
      }

      // Set alpha based on temperature (hotter = more opaque)
      a = 0.3 + normalizedTemp * 0.5

      // Draw temperature cell
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
      ctx.fillRect(x * 32, y * 32, 32, 32)

      // Add temperature text for hot cells
      if (normalizedTemp > 0.5) {
        ctx.fillStyle = "white"
        ctx.font = "10px monospace"
        ctx.textAlign = "center"
        ctx.fillText(`${Math.round(column.heat)}°C`, x * 32 + 16, y * 32 + 20)
      }
    }
  })
}

/**
 * Toggle temperature visualization
 * @param {Object} tempViz - The temperature visualization object
 * @returns {boolean} - The new visibility state
 */
export function toggleTempVisualization(tempViz) {
  tempViz.visible = !tempViz.visible
  tempViz.canvas.style.display = tempViz.visible ? "block" : "none"
  return tempViz.visible
}
