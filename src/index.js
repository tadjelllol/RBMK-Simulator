// Import Chart.js directly from the global variable
// Import modules
import { RBMKDials, SimulationDefaults, ViewModes } from "./modules/constants.js"
import { fuelNames } from "./modules/fuel-names.js"
import { fuels } from "./modules/fuel-types.js"
import { createRBMK } from "./modules/rbmk.js"
import { initUI, initConfigPanel, setupConfigMenuAction } from "./modules/ui.js"
import {
  initFluxVisualizer,
  updateFluxData,
  drawFluxVisualization,
  toggleFluxVisualization,
} from "./modules/flux-visualizer.js"
import { initTempVisualizer, drawTempVisualization } from "./modules/temperature-visualizer.js"

// Import styles
import "./styles/main.css"

// Make constants available globally
window.RBMKDials = RBMKDials
window.fuelNames = fuelNames
window.fuels = fuels

// Initialize the simulation
document.addEventListener("DOMContentLoaded", () => {
  // Create the RBMK instance
  const rbmk = createRBMK()
  window.rbmk = rbmk

  // Set up simulation options
  const options = { ...SimulationDefaults }
  window.options = options

  // Initialize UI components
  initUI(rbmk, options)
  initConfigPanel(rbmk, options)
  setupConfigMenuAction(rbmk, options)

  // Initialize visualizers
  const fluxViz = initFluxVisualizer(rbmk)
  const tempViz = initTempVisualizer(rbmk)

  // Make visualizers available globally for debugging
  window.fluxViz = fluxViz
  window.tempViz = tempViz

  // Create tooltip element
  const tooltip = document.createElement("div")
  tooltip.className = "tooltip"
  tooltip.style.visibility = "hidden"
  document.body.appendChild(tooltip)
  window.tooltip = tooltip

  // Track mouse position
  window.mPos = [0, 0]
  document.addEventListener("mousemove", (e) => {
    window.mPos[0] = e.clientX
    window.mPos[1] = e.clientY
  })

  // Add view mode toggle buttons
  addViewModeToggle(rbmk, options, fluxViz, tempViz)

  // Main simulation loop
  const simulationLoop = setInterval(() => {
    // Update tooltip visibility
    tooltip.style.visibility = "hidden"
    tooltip.style.left = window.mPos[0] + 15 + "px"
    tooltip.style.top = window.mPos[1] + window.scrollY + "px"

    const hoveringOn = document.elementFromPoint(window.mPos[0], window.mPos[1])
    if (hoveringOn && hoveringOn.getAttribute("tooltip")) {
      tooltip.innerHTML = hoveringOn.getAttribute("tooltip")
      tooltip.style.visibility = "visible"
    }

    // Run RBMK simulation
    if (options.simulating) {
      options.frames++
      rbmk.update(options.frames)

      // Update flux visualization data
      updateFluxData(rbmk, fluxViz)
    }

    // Draw RBMK
    rbmk.draw(options.frames)

    // Draw visualizations
    drawFluxVisualization(rbmk, fluxViz)
    drawTempVisualization(rbmk, tempViz)

    // Show/hide simulation controls
    const simulationButtons = document.getElementsByClassName("showInSim")
    for (let i = 0; i < simulationButtons.length; i++) {
      simulationButtons[i].style.display = options.simulating ? "unset" : "none"
    }

    const designButtons = document.getElementsByClassName("showInDesign")
    for (let i = 0; i < designButtons.length; i++) {
      designButtons[i].style.display = options.simulating ? "none" : "unset"
    }
  }, 20)

  // Initialize visualization graphs
  initGraphs(rbmk)

  // Add direct flux toggle button for testing
  const testButton = document.createElement("button")
  testButton.textContent = "Toggle Flux View"
  testButton.style.position = "fixed"
  testButton.style.bottom = "10px"
  testButton.style.right = "10px"
  testButton.style.zIndex = "1000"
  testButton.style.padding = "8px 12px"
  testButton.style.backgroundColor = "#333"
  testButton.style.color = "white"
  testButton.style.border = "1px solid #666"
  testButton.style.borderRadius = "4px"
  testButton.onclick = () => {
    toggleFluxVisualization(fluxViz)

    // If no flux data, show a helpful message
    if (fluxViz.visible && fluxViz.fluxData.length === 0) {
      alert(
        "No flux data available. Make sure you:\n1. Place fuel rods\n2. Start the simulation\n3. Wait a few seconds for flux to generate",
      )
    }
  }
  document.body.appendChild(testButton)
})

/**
 * Add view mode toggle buttons
 * @param {Object} rbmk - The RBMK instance
 * @param {Object} options - The simulation options
 * @param {Object} fluxViz - The flux visualization object
 * @param {Object} tempViz - The temperature visualization object
 */
function addViewModeToggle(rbmk, options, fluxViz, tempViz) {
  // Create view mode toggle container
  const viewToggle = document.createElement("div")
  viewToggle.className = "view-toggle"

  // Normal view button
  const normalViewBtn = document.createElement("button")
  normalViewBtn.className = "view-toggle-btn active"
  normalViewBtn.textContent = "Normal View"
  normalViewBtn.onclick = () => {
    setViewMode(ViewModes.NORMAL)
    updateViewButtons()
  }

  // Flux view button
  const fluxViewBtn = document.createElement("button")
  fluxViewBtn.className = "view-toggle-btn"
  fluxViewBtn.textContent = "Flux View"
  fluxViewBtn.onclick = () => {
    setViewMode(ViewModes.FLUX)
    updateViewButtons()
  }

  // Temperature view button
  const tempViewBtn = document.createElement("button")
  tempViewBtn.className = "view-toggle-btn"
  tempViewBtn.textContent = "Temperature View"
  tempViewBtn.onclick = () => {
    setViewMode(ViewModes.TEMPERATURE)
    updateViewButtons()
  }

  // Add buttons to container
  viewToggle.appendChild(normalViewBtn)
  viewToggle.appendChild(fluxViewBtn)
  viewToggle.appendChild(tempViewBtn)

  // Add container before the reactor panel
  const reactorPanel = document.querySelector(".panel")
  if (reactorPanel) {
    reactorPanel.parentNode.insertBefore(viewToggle, reactorPanel)
  }

  // Function to set view mode
  function setViewMode(mode) {
    options.viewMode = mode

    // Toggle visualizations based on mode
    if (mode === ViewModes.FLUX) {
      fluxViz.visible = true
      fluxViz.canvas.style.display = "block"
      tempViz.visible = false
      tempViz.canvas.style.display = "none"
      console.log("Flux view enabled")
    } else if (mode === ViewModes.TEMPERATURE) {
      fluxViz.visible = false
      fluxViz.canvas.style.display = "none"
      tempViz.visible = true
      tempViz.canvas.style.display = "block"
      console.log("Temperature view enabled")
    } else {
      fluxViz.visible = false
      fluxViz.canvas.style.display = "none"
      tempViz.visible = false
      tempViz.canvas.style.display = "none"
      console.log("Normal view enabled")
    }
  }

  // Function to update button states
  function updateViewButtons() {
    normalViewBtn.classList.toggle("active", options.viewMode === ViewModes.NORMAL)
    fluxViewBtn.classList.toggle("active", options.viewMode === ViewModes.FLUX)
    tempViewBtn.classList.toggle("active", options.viewMode === ViewModes.TEMPERATURE)
  }
}

/**
 * Initialize visualization graphs
 * @param {Object} rbmk - The RBMK instance
 */
function initGraphs(rbmk) {
  // Add graph container to the right panel
  const rightPanel = document.getElementById("right-panel")
  rightPanel.innerHTML = "" // Clear any existing content

  const graphsContainer = document.createElement("div")
  graphsContainer.id = "graphs-container"
  rightPanel.appendChild(graphsContainer)

  // Create temperature graph
  const tempGraphBox = document.createElement("div")
  tempGraphBox.className = "graph-box panel"
  tempGraphBox.innerHTML = "<div class='panel-header'><h2 class='panel-title'>Temperature Distribution</h2></div>"

  const tempCanvas = document.createElement("canvas")
  tempCanvas.id = "temp-graph"
  tempGraphBox.appendChild(tempCanvas)
  graphsContainer.appendChild(tempGraphBox)

  // Create flux graph
  const fluxGraphBox = document.createElement("div")
  fluxGraphBox.className = "graph-box panel"
  fluxGraphBox.innerHTML = "<div class='panel-header'><h2 class='panel-title'>Neutron Flux</h2></div>"

  const fluxCanvas = document.createElement("canvas")
  fluxCanvas.id = "flux-graph"
  fluxGraphBox.appendChild(fluxCanvas)
  graphsContainer.appendChild(fluxGraphBox)

  // Create power output graph
  const powerGraphBox = document.createElement("div")
  powerGraphBox.className = "graph-box panel"
  powerGraphBox.innerHTML = "<div class='panel-header'><h2 class='panel-title'>Power Output</h2></div>"

  const powerCanvas = document.createElement("canvas")
  powerCanvas.id = "power-graph"
  powerGraphBox.appendChild(powerCanvas)
  graphsContainer.appendChild(powerGraphBox)

  // Initialize charts
  initCharts(rbmk)
}

// Fix the chart initialization to ensure power output graph works
function initCharts(rbmk) {
  // Use the global Chart object from the CDN
  const Chart = window.Chart

  // Temperature chart
  const tempCtx = document.getElementById("temp-graph").getContext("2d")
  const tempChart = new Chart(tempCtx, {
    type: "line",
    data: {
      labels: Array(30).fill(""),
      datasets: [
        {
          label: "Average Column Temperature",
          data: Array(30).fill(20),
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Maximum Temperature",
          data: Array(30).fill(20),
          borderColor: "rgba(255, 159, 64, 1)",
          backgroundColor: "rgba(255, 159, 64, 0.2)",
          borderDash: [5, 5],
          tension: 0.4,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      animation: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "white",
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 0,
          max: 1000,
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: "white",
          },
        },
        x: {
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: "white",
          },
        },
      },
      maintainAspectRatio: false,
      aspectRatio: 2.5,
    },
  })

  // Flux chart
  const fluxCtx = document.getElementById("flux-graph").getContext("2d")
  const fluxChart = new Chart(fluxCtx, {
    type: "line",
    data: {
      labels: Array(30).fill(""),
      datasets: [
        {
          label: "Fast Neutron Flux",
          data: Array(30).fill(0),
          borderColor: "rgba(255, 50, 50, 1)",
          backgroundColor: "rgba(255, 50, 50, 0.2)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Slow Neutron Flux",
          data: Array(30).fill(0),
          borderColor: "rgba(50, 255, 50, 1)",
          backgroundColor: "rgba(50, 255, 50, 0.2)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      animation: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "white",
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: 10,
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: "white",
          },
        },
        x: {
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: "white",
          },
        },
      },
      maintainAspectRatio: false,
      aspectRatio: 2.5,
    },
  })

  // Power output chart
  const powerCtx = document.getElementById("power-graph").getContext("2d")
  const powerChart = new Chart(powerCtx, {
    type: "line",
    data: {
      labels: Array(30).fill(""),
      datasets: [
        {
          label: "Power Output (MW)",
          data: Array(30).fill(0),
          borderColor: "rgba(153, 102, 255, 1)",
          backgroundColor: "rgba(153, 102, 255, 0.2)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      animation: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "white",
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: 10,
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: "white",
          },
        },
        x: {
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: "white",
          },
        },
      },
      maintainAspectRatio: false,
      aspectRatio: 2.5,
    },
  })

  // Update charts periodically
  setInterval(() => {
    // Skip updates if not simulating
    if (!window.options.simulating) return

    // Collect data
    const columnTemps = []
    let fastFlux = 0
    let slowFlux = 0
    let totalPower = 0
    let maxTemp = 20

    rbmk.columns.forEach((column) => {
      if (column !== null) {
        columnTemps.push(column.heat)
        if (column.heat > maxTemp) maxTemp = column.heat

        if (column.constructor.name === "Fuel") {
          fastFlux += column.fluxFast
          slowFlux += column.fluxSlow
        }

        if (column.constructor.name === "Boiler") {
          totalPower += column.producedMW || 0
        }
      }
    })

    // Calculate averages
    const avgTemp = columnTemps.reduce((a, b) => a + b, 0) / columnTemps.length || 0

    // Update temperature chart
    tempChart.data.datasets[0].data.push(avgTemp)
    tempChart.data.datasets[0].data.shift()
    tempChart.data.datasets[1].data.push(maxTemp)
    tempChart.data.datasets[1].data.shift()

    // Adjust y-axis scale based on current max temperature
    if (maxTemp > tempChart.options.scales.y.max * 0.8) {
      tempChart.options.scales.y.max = Math.ceil((maxTemp * 1.2) / 100) * 100
    }

    tempChart.update()

    // Update flux chart
    fluxChart.data.datasets[0].data.push(fastFlux)
    fluxChart.data.datasets[0].data.shift()
    fluxChart.data.datasets[1].data.push(slowFlux)
    fluxChart.data.datasets[1].data.shift()

    // Adjust y-axis scale based on current flux
    const maxFlux = Math.max(Math.max(...fluxChart.data.datasets[0].data), Math.max(...fluxChart.data.datasets[1].data))
    if (maxFlux > fluxChart.options.scales.y.max * 0.8) {
      fluxChart.options.scales.y.max = Math.ceil(maxFlux * 1.2)
    }

    fluxChart.update()

    // Update power chart
    powerChart.data.datasets[0].data.push(totalPower)
    powerChart.data.datasets[0].data.shift()

    // Adjust y-axis scale based on current power output
    const maxPower = Math.max(...powerChart.data.datasets[0].data)
    if (maxPower > powerChart.options.scales.y.max * 0.8) {
      powerChart.options.scales.y.max = Math.ceil(maxPower * 1.2)
    } else if (maxPower < powerChart.options.scales.y.max * 0.3 && maxPower > 0) {
      // Scale down if we're using much less than the current scale
      powerChart.options.scales.y.max = Math.max(10, Math.ceil(maxPower * 2))
    }

    powerChart.update()

    // Update time labels (show last 5 minutes with timestamps)
    const now = new Date()
    const timeLabel = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`

    tempChart.data.labels.push(timeLabel)
    tempChart.data.labels.shift()
    fluxChart.data.labels.push(timeLabel)
    fluxChart.data.labels.shift()
    powerChart.data.labels.push(timeLabel)
    powerChart.data.labels.shift()
  }, 1000)

  // Store charts in window for debugging
  window.charts = {
    tempChart,
    fluxChart,
    powerChart,
  }
}

// Add a function to manually generate flux for testing
window.generateTestFlux = () => {
  console.log("Generating test flux data")

  // Find all fuel rods
  const rbmk = window.rbmk
  const fluxViz = window.fluxViz

  if (!rbmk || !fluxViz) {
    console.error("RBMK or fluxViz not found")
    return
  }

  // Clear existing flux data
  fluxViz.fluxData = []

  // For each fuel rod, generate some test flux
  rbmk.columns.forEach((column, index) => {
    if (column && column.constructor.name === "Fuel") {
      const x = index % rbmk.width
      const y = Math.floor(index / rbmk.width)

      // Generate flux in all four directions
      ;[
        { dx: 0, dy: -1 }, // Up
        { dx: 1, dy: 0 }, // Right
        { dx: 0, dy: 1 }, // Down
        { dx: -1, dy: 0 }, // Left
      ].forEach((dir) => {
        const targetX = x + dir.dx
        const targetY = y + dir.dy

        // Skip if out of bounds
        if (targetX < 0 || targetX >= rbmk.width || targetY < 0 || targetY >= rbmk.height) return

        // Add test flux data
        fluxViz.fluxData.push({
          fromX: x,
          fromY: y,
          toX: targetX,
          toY: targetY,
          strength: 5, // Medium strength
          type: Math.random() > 0.5 ? "fast" : "slow", // Random type
          offsetX: 0,
          offsetY: 0,
        })
      })
    }
  })

  console.log(`Generated ${fluxViz.fluxData.length} test flux arrows`)

  // Make sure flux visualization is visible
  fluxViz.visible = true
  fluxViz.canvas.style.display = "block"

  // Update view mode
  window.options.viewMode = "flux"

  // Update buttons if possible
  const fluxBtn = document.querySelector(".view-toggle-btn:nth-child(2)")
  if (fluxBtn) {
    fluxBtn.classList.add("active")
    document.querySelector(".view-toggle-btn:nth-child(1)").classList.remove("active")
    document.querySelector(".view-toggle-btn:nth-child(3)").classList.remove("active")
  }
}

// Modify the debug button to use the test flux generator
const testButton = document.querySelector('button[style*="position: fixed"]')
if (testButton) {
  testButton.onclick = window.generateTestFlux
}
