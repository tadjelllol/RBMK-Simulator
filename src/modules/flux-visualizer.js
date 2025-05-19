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

// Update the updateFluxData function to better capture flux movement
export function updateFluxData(rbmk, fluxViz) {
  // Only update every few ticks to avoid performance issues
  if (window.options.frames - fluxViz.lastUpdate < 3) return
  fluxViz.lastUpdate = window.options.frames

  // Clear previous flux data
  fluxViz.fluxData = []

  // Collect flux data from all fuel columns
  rbmk.columns.forEach((column, index) => {
    if (column && column.constructor.name === "Fuel" && column.fuel.constructor.name !== "NONE") {
      const x = index % rbmk.width
      const y = Math.floor(index / rbmk.width)

      // For each direction, trace the flux path
      column.dirs.forEach((dir) => {
        // Skip if no flux in this direction
        let fluxType = column.moderated ? "SLOW" : column.fuel.rType
        let fluxStrength = fluxType === "SLOW" ? column.fluxSlow : column.fluxFast

        // Skip if flux is too weak
        if (fluxStrength < 0.1) return

        // Trace the flux path through the reactor
        let currentX = x
        let currentY = y
        let nextX, nextY
        let continueTracing = true
        let range = 0

        while (continueTracing && range < window.RBMKDials.dialFluxRange) {
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

          // Add flux data for this segment
          fluxViz.fluxData.push({
            fromX: currentX,
            fromY: currentY,
            toX: nextX,
            toY: nextY,
            strength: fluxStrength,
            type: fluxType === "SLOW" ? "slow" : "fast",
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
            fluxType = "SLOW"
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

// Update the drawFluxVisualization function to properly render flux arrows
export function drawFluxVisualization(rbmk, fluxViz) {
  if (!fluxViz.visible) return

  const ctx = fluxViz.ctx
  ctx.clearRect(0, 0, fluxViz.canvas.width, fluxViz.canvas.height)

  // If no flux data, show a helpful message
  if (fluxViz.fluxData.length === 0) {
    ctx.font = "12px monospace"
    ctx.fillStyle = "white"
    ctx.fillText("No flux data - place fuel rods and run simulation", 50, 230)
    return
  }

  // Draw flux arrows
  fluxViz.fluxData.forEach((flux) => {
    // Calculate cell centers
    const fromCenterX = flux.fromX * 32 + 16
    const fromCenterY = flux.fromY * 32 + 16
    const toCenterX = flux.toX * 32 + 16
    const toCenterY = flux.toY * 32 + 16

    // Calculate arrow direction
    const dx = toCenterX - fromCenterX
    const dy = toCenterY - fromCenterY
    const angle = Math.atan2(dy, dx)

    // Calculate arrow length (shorter than full distance)
    const distance = Math.sqrt(dx * dx + dy * dy)
    const arrowLength = distance * 0.8

    // Calculate arrow end point
    const endX = fromCenterX + Math.cos(angle) * arrowLength
    const endY = fromCenterY + Math.sin(angle) * arrowLength

    // Set arrow color and width based on flux type and strength
    if (flux.type === "fast") {
      ctx.strokeStyle = `rgba(255, 50, 50, ${Math.min(0.9, flux.strength / 5)})`
      ctx.fillStyle = `rgba(255, 50, 50, ${Math.min(0.9, flux.strength / 5)})`
    } else {
      ctx.strokeStyle = `rgba(50, 255, 50, ${Math.min(0.9, flux.strength / 5)})`
      ctx.fillStyle = `rgba(50, 255, 50, ${Math.min(0.9, flux.strength / 5)})`
    }

    // Line width based on flux strength (min 2px, max 5px)
    ctx.lineWidth = Math.max(2, Math.min(5, 1 + flux.strength / 10))

    // Draw arrow line
    ctx.beginPath()
    ctx.moveTo(fromCenterX, fromCenterY)
    ctx.lineTo(endX, endY)
    ctx.stroke()

    // Draw arrow head
    const headLength = 10
    const headAngle = 0.5

    ctx.beginPath()
    ctx.moveTo(endX, endY)
    ctx.lineTo(endX - headLength * Math.cos(angle - headAngle), endY - headLength * Math.sin(angle - headAngle))
    ctx.lineTo(endX - headLength * Math.cos(angle + headAngle), endY - headLength * Math.sin(angle + headAngle))
    ctx.closePath()
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

  // Generate test flux data if needed
  if (fluxViz.visible && fluxViz.fluxData.length === 0 && window.options.simulating) {
    // Find all fuel rods and update their flux
    const rbmk = window.rbmk
    if (rbmk) {
      updateFluxData(rbmk, fluxViz)
    }
  }

  console.log("Flux visualization toggled:", fluxViz.visible)
  return fluxViz.visible
}
