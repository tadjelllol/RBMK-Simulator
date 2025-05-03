// Import modules
import { RBMKDials, SimulationDefaults, Assets } from './modules/constants.js';
import { fuelNames } from './modules/fuel-names.js';
import { fuels } from './modules/fuel-types.js';
import { createRBMK } from './modules/rbmk.js';
import { initUI, initConfigPanel, setupConfigMenuAction } from './modules/ui.js';

// Import styles
import './styles/main.css';

// Make constants available globally
window.RBMKDials = RBMKDials;
window.fuelNames = fuelNames;
window.fuels = fuels;

// Initialize the simulation
document.addEventListener('DOMContentLoaded', () => {
  // Create the RBMK instance
  const rbmk = createRBMK();
  window.rbmk = rbmk;
  
  // Set up simulation options
  const options = { ...SimulationDefaults };
  window.options = options;
  
  // Initialize UI components
  initUI(rbmk, options);
  initConfigPanel(rbmk, options);
  setupConfigMenuAction(rbmk, options);
  
  // Main simulation loop
  const simulationLoop = setInterval(() => {
    // Update tooltip visibility
    tooltip.style.visibility = "hidden";
    tooltip.style.left = (mPos[0] + 15) + "px";
    tooltip.style.top = (mPos[1] + window.scrollY) + "px";
    
    const hoveringOn = document.elementFromPoint(mPos[0], mPos[1]);
    if (hoveringOn && hoveringOn.getAttribute("tooltip")) {
      tooltip.innerHTML = hoveringOn.getAttribute("tooltip");
      tooltip.style.visibility = "visible";
    }
    
    // Run RBMK simulation
    if (options.simulating) {
      options.frames++;
      rbmk.update(options.frames);
    }
    
    // Draw RBMK
    rbmk.draw(options.frames);
    
    // Show/hide simulation controls
    const simulationButtons = document.getElementsByClassName("showInSim");
    for (let i = 0; i < simulationButtons.length; i++) {
      simulationButtons[i].style.display = options.simulating ? "unset" : "none";
    }
    
    const designButtons = document.getElementsByClassName("showInDesign");
    for (let i = 0; i < designButtons.length; i++) {
      designButtons[i].style.display = options.simulating ? "none" : "unset";
    }
    
    // Specific simulation updates
    if (options.simulating) {
      rbmk.columns.forEach(column => {
        if (column !== null) {
          if (RBMKDials.dialReasimBoilers) {
            column.rs_water += options.rbmkStuff.boilerInputRate;
          }
          
          if (column.constructor.name === 'Boiler') {
            column.feedwater += options.rbmkStuff.boilerInputRate;
          }
          
          if (column.constructor.name === 'Cooler') {
            column.cryo += options.rbmkStuff.boilerInputRate;
          }
        }
      });
    }
  }, 20);
  
  // Initialize temperature and neutron flux visualization graphs
  initGraphs(rbmk);
});

/**
 * Initialize visualization graphs
 * @param {Object} rbmk - The RBMK instance
 */
function initGraphs(rbmk) {
  // Add graph container to the right panel
  const rightPanel = document.getElementById('right-panel');
  
  const graphsContainer = document.createElement('div');
  graphsContainer.id = 'graphs-container';
  rightPanel.appendChild(graphsContainer);
  
  // Create temperature graph
  const tempGraphBox = document.createElement('div');
  tempGraphBox.className = 'graph-box';
  tempGraphBox.innerHTML = '<h3>Temperature Distribution</h3>';
  
  const tempCanvas = document.createElement('canvas');
  tempCanvas.id = 'temp-graph';
  tempGraphBox.appendChild(tempCanvas);
  graphsContainer.appendChild(tempGraphBox);
  
  // Create flux graph
  const fluxGraphBox = document.createElement('div');
  fluxGraphBox.className = 'graph-box';
  fluxGraphBox.innerHTML = '<h3>Neutron Flux</h3>';
  
  const fluxCanvas = document.createElement('canvas');
  fluxCanvas.id = 'flux-graph';
  fluxGraphBox.appendChild(fluxCanvas);
  graphsContainer.appendChild(fluxGraphBox);
  
  // Create depletion graph
  const depletionGraphBox = document.createElement('div');
  depletionGraphBox.className = 'graph-box';
  depletionGraphBox.innerHTML = '<h3>Fuel Depletion</h3>';
  
  const depletionCanvas = document.createElement('canvas');
  depletionCanvas.id = 'depletion-graph';
  depletionGraphBox.appendChild(depletionCanvas);
  graphsContainer.appendChild(depletionGraphBox);
  
  // Initialize charts
  initCharts(rbmk);
}

/**
 * Initialize charts
 * @param {Object} rbmk - The RBMK instance
 */
function initCharts(rbmk) {
  // Temperature chart
  const tempCtx = document.getElementById('temp-graph').getContext('2d');
  const tempChart = new Chart(tempCtx, {
    type: 'line',
    data: {
      labels: Array(30).fill(''),
      datasets: [{
        label: 'Average Column Temperature',
        data: Array(30).fill(20),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      animation: false,
      scales: {
        y: {
          beginAtZero: false,
          min: 0,
          max: 1000
        }
      }
    }
  });
  
  // Flux chart
  const fluxCtx = document.getElementById('flux-graph').getContext('2d');
  const fluxChart = new Chart(fluxCtx, {
    type: 'line',
    data: {
      labels: Array(30).fill(''),
      datasets: [{
        label: 'Fast Neutron Flux',
        data: Array(30).fill(0),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
        fill: true
      }, {
        label: 'Slow Neutron Flux',
        data: Array(30).fill(0),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      animation: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
  
  // Depletion chart
  const depletionCtx = document.getElementById('depletion-graph').getContext('2d');
  const depletionChart = new Chart(depletionCtx, {
    type: 'line',
    data: {
      labels: Array(30).fill(''),
      datasets: [{
        label: 'Average Fuel Depletion',
        data: Array(30).fill(0),
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      animation: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
  
  // Update charts periodically
  setInterval(() => {
    // Skip updates if not simulating
    if (!window.options.simulating) return;
    
    // Collect data
    const columnTemps = [];
    let fastFlux = 0;
    let slowFlux = 0;
    const fuelDepletions = [];
    
    rbmk.columns.forEach(column => {
      if (column !== null) {
        columnTemps.push(column.heat);
        
        if (column.constructor.name === 'Fuel') {
          fastFlux += column.fluxFast;
          slowFlux += column.fluxSlow;
          fuelDepletions.push(column.depletion);
        }
      }
    });
    
    // Calculate averages
    const avgTemp = columnTemps.reduce((a, b) => a + b, 0) / columnTemps.length || 0;
    const avgDepletion = fuelDepletions.reduce((a, b) => a + b, 0) / fuelDepletions.length || 0;
    
    // Update temperature chart
    tempChart.data.datasets[0].data.push(avgTemp);
    tempChart.data.datasets[0].data.shift();
    tempChart.update();
    
    // Update flux chart
    fluxChart.data.datasets[0].data.push(fastFlux);
    fluxChart.data.datasets[0].data.shift();
    fluxChart.data.datasets[1].data.push(slowFlux);
    fluxChart.data.datasets[1].data.shift();
    fluxChart.update();
    
    // Update depletion chart
    depletionChart.data.datasets[0].data.push(avgDepletion);
    depletionChart.data.datasets[0].data.shift();
    depletionChart.update();
  }, 1000);
}