// Import Chart.js directly from the global variable
// Import modules
import { RBMKDials, SimulationDefaults } from "./modules/constants.js"
import { fuelNames } from "./modules/fuel-names.js"
import { fuels } from "./modules/fuel-types.js"
import { createRBMK } from "./modules/rbmk.js"
import { initUI, initConfigPanel, setupConfigMenuAction } from "./modules/ui.js"

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
    }

    // Draw RBMK
    rbmk.draw(options.frames)

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
})

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

/**
 * Initialize charts
 * @param {Object} rbmk - The RBMK instance
 */
function initCharts(rbmk) {
  // Fix the graph scaling issues
  // Modify the chart options to make them less zoomed in

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
      // In the initCharts function, update the chart options for better scaling
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
          borderColor: "rgba(54, 162, 235, 1)",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Slow Neutron Flux",
          data: Array(30).fill(0),
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
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
      // For the flux chart:
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
      // For the power chart:
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
}
