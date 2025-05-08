import { createElement, averageCalc } from "./utils.js"
import { fuels } from "./fuel-types.js"
import { fuelNames } from "./fuel-names.js"
import { SimulationDefaults } from "./constants.js"
import { Renderer } from "./renderer.js"
import { Column, Blank } from "./column-base.js"
import {
  Fuel,
  Control,
  ControlAuto,
  Boiler,
  Moderator,
  Absorber,
  Reflector,
  Outgasser,
  Storage,
  Cooler,
  Heatex,
} from "./column-types.js"

/**
 * Initialize the UI
 * @param {Object} rbmk - The RBMK instance
 * @param {Object} options - The simulation options
 */
export function initUI(rbmk, options) {
  // Setup tooltip
  const tooltip = createElement("div", {
    className: "tooltip",
  })
  document.body.appendChild(tooltip)
  window.tooltip = tooltip

  // Setup mouse position tracking
  const mPos = [0, 0]
  window.mPos = mPos

  document.body.addEventListener("mousemove", (e) => {
    mPos[0] = e.clientX
    mPos[1] = e.clientY
  })

  // Initialize fuel panel
  initFuelPanel(rbmk, options)

  // Initialize statistics panel
  initStatsPanel(rbmk, options)

  // Initialize button listeners
  initButtonListeners(rbmk, options)

  // Initialize reactor interaction
  initReactorInteraction(rbmk, options)
}

/**
 * Initialize the fuel panel
 * @param {Object} rbmk - The RBMK instance
 * @param {Object} options - The simulation options
 */
function initFuelPanel(rbmk, options) {
  const fuelsContainer = document.getElementById("fuels")

  fuels.forEach((fuel, index) => {
    const test = new fuel()

    const selfigniting =
      test.selfRate > 0 || test.function === "SIGMOID" ? `<p style="color: red; margin: 0px;">Self-igniting</p>` : ""

    const element = createElement("img", {
      src: test.texture,
      className: "fuel-item",
      onclick: "fuelClick()",
      dataset: {
        fuelname: index,
      },
      tooltip: `<b>${fuelNames[test.fullName].rod}</b><br><p style="color: grey; margin: 0px;">${fuelNames[test.fullName].fullName}</p>${selfigniting}<p style="color: blue; margin: 0px;">Splits with: ${test.nType}</p><p style="color: blue; margin: 0px;">Splits into: ${test.rType}</p><p style="color: yellow; margin: 0px;">Flux function: <span style="color: white;">${test.getFuncDescription()}</span></p><p style="color: yellow; margin: 0px;">Function type: ${test.displayFunc}</p><p style="color: yellow; margin: 0px;">Xenon gen function: <span style="color: white;">x * ${test.xGen}</span></p><p style="color: yellow; margin: 0px;">Xenon burn function: <span style="color: white;">x² * ${test.xBurn}</span></p><p style="color: gold; margin: 0px;">Heat per flux: ${test.heat}°C</p><p style="color: gold; margin: 0px;">Diffusion: ${test.diffusion}¹/²</p><p style="color: red; margin: 0px;">Melting point: ${test.meltingPoint.toFixed(1)}°C</p>`,
    })

    fuelsContainer.appendChild(element)
  })
}

// Update the statistics panel to show power in MW

function initStatsPanel(rbmk, options) {
  const averageStats = document.getElementById("averageStats")

  // Create stat elements
  const stats = [
    { id: "columnTemp", title: "Column Temp", value: "20°C", tooltip: "Average temperature of all columns" },
    { id: "controlRodLevel", title: "Control Rod Level", value: "0%", tooltip: "Average position of all control rods" },
    { id: "fuelDepletion", title: "Fuel Depletion", value: "0%", tooltip: "Average depletion level of all fuel rods" },
    {
      id: "xenonPoisonLevel",
      title: "Xenon Poisoning",
      value: "0%",
      tooltip: "Average xenon poisoning of all fuel rods",
    },
    { id: "coreTempFuel", title: "Fuel Temp", value: "20°C", tooltip: "Average temperature of all fuel cores" },
    {
      id: "powerProduced",
      title: "Power Output",
      value: "0 MW",
      tooltip: "Total power produced by the reactor in Megawatts",
    },
    { id: "rads", title: "Radiation Leaked", value: "0 RADs", tooltip: "Total radiation leaked from the reactor" },
  ]

  stats.forEach((stat) => {
    const statBox = createElement("div", { className: "stat-box", id: stat.id })

    const title = createElement(
      "div",
      {
        className: "stat-title",
        tooltip: stat.tooltip,
      },
      stat.title,
    )

    const value = createElement("div", { className: "stat-value" }, stat.value)

    statBox.appendChild(title)
    statBox.appendChild(value)
    averageStats.appendChild(statBox)
  })

  // Update stats periodically
  setInterval(() => {
    updateStats(rbmk, options)
  }, 200)
}

/**
 * Update the statistics panel
 * @param {Object} rbmk - The RBMK instance
 * @param {Object} options - The simulation options
 */
function updateStats(rbmk, options) {
  // Variables to collect data
  const columnTemps = []
  const controlRodLevels = []
  const fuelDepletions = []
  const xenonPoisons = []
  const coreTempFuels = []
  const powerProducedd = []
  const radsLeaked = []

  // Get all variables
  rbmk.columns.forEach((column) => {
    if (column !== null) {
      columnTemps.push(column.heat)

      if (column instanceof Control) {
        controlRodLevels.push(column.level * 100)
      }
      if (column instanceof Fuel) {
        fuelDepletions.push(column.depletion)
        xenonPoisons.push(column.xenonPoison)
        coreTempFuels.push(column.coreHeat)
        radsLeaked.push(column.radioactivity)
      }
      if (column instanceof Boiler) {
        powerProducedd.push(column.producedMW || 0)
      }
    }
  })

  // Update stat displays
  document.querySelector("#columnTemp .stat-value").textContent = `${averageCalc(columnTemps).toFixed(1)}°C`
  document.querySelector("#controlRodLevel .stat-value").textContent = `${averageCalc(controlRodLevels).toFixed(1)}%`
  document.querySelector("#fuelDepletion .stat-value").textContent = `${averageCalc(fuelDepletions).toFixed(3)}%`
  document.querySelector("#xenonPoisonLevel .stat-value").textContent = `${averageCalc(xenonPoisons).toFixed(1)}%`
  document.querySelector("#coreTempFuel .stat-value").textContent = `${averageCalc(coreTempFuels).toFixed(1)}°C`
  document.querySelector("#powerProduced .stat-value").textContent = `${averageCalc(powerProducedd).toFixed(2)} MW`
  document.querySelector("#rads .stat-value").textContent = `${Math.floor(averageCalc(radsLeaked))} RADs`
}

/**
 * Initialize button listeners
 * @param {Object} rbmk - The RBMK instance
 * @param {Object} options - The simulation options
 */
function initButtonListeners(rbmk, options) {
  const buttonActions = {
    new: (btn) => {
      if (confirm("Create new RBMK or just remove the columns while keeping the width and height?")) {
        const res = prompt(`Are you sure? Type "rbmk" if you are really sure`)
        if (res === "rbmk") {
          // Ask for dimensions
          let width = Number.parseInt(prompt("RBMK width") || "15", 10)
          let height = Number.parseInt(prompt("RBMK height") || "15", 10)

          // Validate dimensions
          width = isNaN(width) || width < 1 ? 15 : width
          height = isNaN(height) || height < 1 ? 15 : height

          // Update RBMK dimensions
          rbmk.width = width
          rbmk.height = height
          rbmk.columns = new Array(width * height).fill(null)
          rbmk.columns[Math.floor((width * height) / 2)] = new Column()

          // Update canvas size
          rbmk.updateCanvasSize()
        }
      } else {
        const res = prompt(`Are you sure? Type "rbmk" if you are really sure`)
        if (res === "rbmk") {
          rbmk.columns = new Array(rbmk.width * rbmk.height).fill(null)
          rbmk.columns[Math.floor((rbmk.width * rbmk.height) / 2)] = new Column()
        }
      }
    },

    run: (btn) => {
      if (!options.simulating) {
        if (btn.textContent === "Stop") {
          rbmk.stopSimulation()
          btn.textContent = "Run"
        } else {
          options.az5 = false
          rbmk.stopSimulation() // Reset properties
          options.simulating = true
          btn.textContent = "Stop"
        }
      } else {
        options.simulating = false
        rbmk.stopSimulation()
        btn.textContent = "Run"
      }
    },

    placeconfig: (btn) => {
      if (!options.place.placing) {
        options.place.placing = true
        btn.textContent = "Place"
        options.config.columnIndexSelected = -1
      } else {
        options.place.placing = false
        btn.textContent = "Config"
      }
    },

    changelog: () => {
      document.getElementById("changelog").className = "changelog"
    },

    pullcrs: () => {
      const res = prompt("Target level")

      // Parse level
      let num = Number.parseInt(res, 10)

      // Validate and normalize
      if (isNaN(num)) num = 0
      num = Math.min(100, Math.max(0, num)) / 100

      // Apply to all control rods
      rbmk.columns.forEach((column) => {
        if (column instanceof Control) {
          column.targetLevel = num
        }
      })
    },

    az5: () => {
      if (!options.az5) {
        options.az5 = true

        // Play AZ-5 sound
        const az5Sound = new Audio(SimulationDefaults.az5Sound)
        az5Sound.volume = 0.4
        az5Sound.pause()
        az5Sound.currentTime = 0
        az5Sound.play()

        // Insert all control rods
        rbmk.columns.forEach((column) => {
          if (column instanceof Control) {
            column.startingLevel = column.level
            column.targetLevel = 0
          }
        })
      }
    },

    reasimBoilers: () => {
      window.RBMKDials.dialReasimBoilers = !window.RBMKDials.dialReasimBoilers
    },
  }

  // Add click listener for buttons
  document.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON" && e.target.getAttribute("action")) {
      const action = e.target.getAttribute("action")
      if (buttonActions[action]) {
        buttonActions[action](e.target)
      }
    }
  })

  // Setup view toggle
  const viewToggle = document.querySelector(".view-toggle")
  if (viewToggle) {
    const view2DBtn = viewToggle.querySelector('[data-view="2d"]')
    const view3DBtn = viewToggle.querySelector('[data-view="3d"]')

    view2DBtn.addEventListener("click", () => {
      document.getElementById("2d-view").style.display = "block"
      document.getElementById("3d-view").style.display = "none"
      view2DBtn.classList.add("active")
      view3DBtn.classList.remove("active")
    })

    view3DBtn.addEventListener("click", () => {
      document.getElementById("2d-view").style.display = "none"
      document.getElementById("3d-view").style.display = "block"
      view2DBtn.classList.remove("active")
      view3DBtn.classList.add("active")
    })
  }

  // Make button function available globally
  window.button = () => {
    const btn = document.elementFromPoint(mPos[0], mPos[1])
    const action = btn.getAttribute("action")
    if (buttonActions[action]) {
      buttonActions[action](btn)
    }
  }
}

/**
 * Initialize reactor interaction
 * @param {Object} rbmk - The RBMK instance
 * @param {Object} options - The simulation options
 */
function initReactorInteraction(rbmk, options) {
  const toolsCanvas = document.getElementById("tools")

  // Draw tools
  function drawTools() {
    const toolsRenderer = new Renderer(toolsCanvas)
    toolsRenderer.reset()

    // Wait for console image to load
    if (!rbmk.consoleImg.complete) {
      rbmk.consoleImg.onload = () => drawTools()
      return
    }

    options.place.blocks.forEach((block, i) => {
      const x = i % 7
      const y = Math.floor(i / 7)

      // Draw block
      toolsRenderer.draw("image", {
        img: rbmk.consoleImg,
        crop: true,

        x: x * 32,
        y: y * 32,
        w: 32,
        h: 32,

        sX: block.index * 10,
        sY: 172,
        sW: 10,
        sH: 10,
      })

      // Draw selection indicator
      if (options.place.selected === block.select && !options.simulating && options.place.placing) {
        toolsRenderer.draw("image", {
          img: rbmk.consoleImg,
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
    })
  }

  // Setup reactor click handler
  document.addEventListener("click", (e) => {
    const rbmkCanvas = document.getElementById("rbmk")
    const rect = rbmkCanvas.getBoundingClientRect()
    const x = mPos[0] - rect.x
    const y = mPos[1] - rect.y
    const maxX = rbmk.width * 32
    const maxY = rbmk.height * 32

    // Check if click is within reactor grid
    if (x >= 0 && x <= maxX && y >= 0 && y <= maxY) {
      const gridX = Math.floor(x / 32)
      const gridY = Math.floor(y / 32)
      const index = gridX + rbmk.width * gridY

      if (!options.simulating && options.place.placing) {
        // Place or remove column
        if (options.place.selected === "blank") {
          // Special handling for blank columns to prevent deletion
          if (rbmk.columns[index] === null) {
            const blankColumn = new Blank()
            blankColumn.x = gridX
            blankColumn.y = gridY
            rbmk.columns[index] = blankColumn
          }
        } else if (options.place.selected === "nothing") {
          // Remove column
          rbmk.columns[index] = null
        } else {
          // Place a new column
          const newColumn = getConstructor(options.place.selected)
          if (newColumn !== null) {
            rbmk.columns[index] = newColumn
            rbmk.columns[index].x = gridX
            rbmk.columns[index].y = gridY
          }
        }
      } else {
        // Select column for configuration
        options.config.columnIndexSelected = index
      }
    }

    // Check if click is on a tool
    const toolsRect = toolsCanvas.getBoundingClientRect()
    if (
      mPos[0] >= toolsRect.x &&
      mPos[0] <= toolsRect.right &&
      mPos[1] >= toolsRect.y &&
      mPos[1] <= toolsRect.bottom &&
      !options.simulating &&
      options.place.placing
    ) {
      const toolX = Math.floor((mPos[0] - toolsRect.x) / 32)
      const toolY = Math.floor((mPos[1] - toolsRect.y) / 32)
      const toolIndex = toolY * 7 + toolX

      if (toolIndex >= 0 && toolIndex < options.place.blocks.length) {
        options.place.selected = options.place.blocks[toolIndex].select
      }
    }

    // Redraw tools panel
    drawTools()
  })

  // Initial tools draw
  drawTools()

  // Update tooltip visibility
  setInterval(() => {
    tooltip.style.visibility = "hidden"
    tooltip.style.left = mPos[0] + 15 + "px"
    tooltip.style.top = mPos[1] + window.scrollY + "px"

    const hoveringOn = document.elementFromPoint(mPos[0], mPos[1])
    if (hoveringOn && hoveringOn.getAttribute("tooltip")) {
      tooltip.innerHTML = hoveringOn.getAttribute("tooltip")
      tooltip.style.visibility = "visible"
    }
  }, 20)
}

/**
 * Get constructor for a column type
 * @param {string} block - The block type
 * @returns {Object|null} - The constructor instance or null
 */
function getConstructor(block) {
  switch (block) {
    case "blank":
      return new Blank()
    case "fuel":
      return new Fuel()
    case "control":
      return new Control()
    case "control_auto":
      return new ControlAuto()
    case "boiler":
      return new Boiler()
    case "moderator":
      return new Moderator()
    case "absorber":
      return new Absorber()
    case "reflector":
      return new Reflector()
    case "outgasser":
      return new Outgasser()
    case "storage":
      return new Storage()
    case "cooler":
      return new Cooler()
    case "heatex":
      return new Heatex()
    case "nothing":
      return null
    default:
      return null
  }
}

// Update the config panel to show fixed input/output rates instead of configurable ones

export function initConfigPanel(rbmk, options) {
  // Update config panel periodically
  setInterval(() => {
    const configMenu = document.getElementById("config_main")
    const selectedIndex = options.config.columnIndexSelected

    if (selectedIndex !== options.config.prevColumn) {
      configMenu.innerHTML = ""

      if (selectedIndex >= 0 && selectedIndex < rbmk.columns.length && rbmk.columns[selectedIndex] !== null) {
        // Column is selected, show its configuration
        const columnName = createElement(
          "p",
          {
            className: "noMargin",
            style: { fontSize: "35px" },
          },
          `<b>${rbmk.columns[selectedIndex].constructor.name} (${selectedIndex})</b>`,
        )

        configMenu.appendChild(columnName)

        const configContent = rbmk.columns[selectedIndex].getConfig()
        if (typeof configContent === "object") {
          configMenu.appendChild(configContent)
        } else {
          configMenu.innerHTML += configContent
        }
      } else {
        // No column selected, show RBMK options with fixed input/output rates
        configMenu.innerHTML = `
            <p style="font-size: 27px;">Boilers water input rate: 100 (Maximum)</p>
            <p style="font-size: 27px;">Boilers steam output rate: 100 (Maximum)</p>
            <button class="textButton" style="font-size: 27px;" action="reasimBoilers">ReaSim boilers: ${window.RBMKDials.dialReasimBoilers}</button>
            <p style="font-size: 27px;">If you want to edit gamerules, please open developer tools and check the console</p>
          `
      }

      options.config.prevColumn = selectedIndex
    }
  }, 100)
}

/**
 * Setup config menu action handler
 * @param {Object} rbmk - The RBMK instance
 * @param {Object} options - The simulation options
 */
export function setupConfigMenuAction(rbmk, options) {
  window.configMenuAction = () => {
    const btn = document.elementFromPoint(mPos[0], mPos[1])
    const col = rbmk.columns[options.config.columnIndexSelected]
    options.config.prevColumn = -1

    switch (btn.getAttribute("configmenuaction")) {
      case "moderation":
        col.moderated = !col.moderated
        break

      case "pull":
        const res = prompt("Target level")
        // Parse level
        let num = Number.parseInt(res, 10)

        // Validate and normalize
        if (isNaN(num)) num = 0
        num = Math.min(100, Math.max(0, num)) / 100

        col.startingLevel = col.level
        col.targetLevel = num
        break

      case "compression":
        if (col instanceof Boiler) {
          col.steamType = (col.steamType + 1) % 4
        }
        break

      case "cauto_interpolation":
        col.function++
        if (col.function > 2) {
          col.function = 0
        }
        break

      case "cauto_levelUpper":
        const upperRes = prompt("")
        let upperNum = Number.parseInt(upperRes, 10)

        // Validate and normalize
        if (isNaN(upperNum)) upperNum = 0
        upperNum = Math.min(100, Math.max(0, upperNum))

        col.levelUpper = upperNum
        break

      case "cauto_levelLower":
        const lowerRes = prompt("")
        let lowerNum = Number.parseInt(lowerRes, 10)

        // Validate and normalize
        if (isNaN(lowerNum)) lowerNum = 0
        lowerNum = Math.min(100, Math.max(0, lowerNum))

        col.levelLower = lowerNum
        break

      case "cauto_heatUpper":
        const heatUpperRes = prompt("")
        let heatUpperNum = Number.parseInt(heatUpperRes, 10)

        // Validate and normalize
        if (isNaN(heatUpperNum)) heatUpperNum = 0
        heatUpperNum = Math.min(9999, Math.max(0, heatUpperNum))

        col.heatUpper = heatUpperNum
        break

      case "cauto_heatLower":
        const heatLowerRes = prompt("")
        let heatLowerNum = Number.parseInt(heatLowerRes, 10)

        // Validate and normalize
        if (isNaN(heatLowerNum)) heatLowerNum = 0
        heatLowerNum = Math.min(9999, Math.max(0, heatLowerNum))

        col.heatLower = heatLowerNum
        break
    }
  }

  // Setup fuel click handler
  window.fuelClick = () => {
    const btn = document.elementFromPoint(mPos[0], mPos[1])
    const col = rbmk.columns[options.config.columnIndexSelected]

    if (col instanceof Fuel) {
      const fuelIndex = Number.parseInt(btn.getAttribute("data-fuelname") || btn.getAttribute("fuelname"), 10)
      if (!isNaN(fuelIndex) && fuelIndex >= 0 && fuelIndex < fuels.length) {
        col.fuel = new fuels[fuelIndex]()
        options.config.prevColumn = -1
      }
    }
  }
}
