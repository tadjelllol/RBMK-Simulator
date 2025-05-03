import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Initialize the 3D view
 * @param {Object} rbmk - The RBMK instance
 */
export function init3DView(rbmk) {
  const container = document.getElementById('three-container');
  
  // Initialize Three.js scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);
  
  // Add camera
  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(rbmk.width / 2, rbmk.width * 0.8, rbmk.height * 0.8);
  
  // Add renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);
  
  // Add controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(rbmk.width / 2, 0, rbmk.height / 2);
  controls.update();
  
  // Create grid
  createGrid(scene, rbmk.width, rbmk.height);
  
  // Create columns
  const columnMeshes = createColumns(scene, rbmk);
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    updateColumns(columnMeshes, rbmk);
    renderer.render(scene, camera);
  }
  
  animate();
  
  // Handle resize
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
  
  return {
    scene,
    camera,
    renderer,
    controls,
    columnMeshes
  };
}

/**
 * Create the grid
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {number} width - The grid width
 * @param {number} height - The grid height
 */
function createGrid(scene, width, height) {
  const gridGeometry = new THREE.PlaneGeometry(width, height);
  const gridMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x222222,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5
  });
  
  const grid = new THREE.Mesh(gridGeometry, gridMaterial);
  grid.rotation.x = -Math.PI / 2;
  grid.position.set(width / 2 - 0.5, -0.01, height / 2 - 0.5);
  scene.add(grid);
  
  // Add grid lines
  const lineGeometry = new THREE.BufferGeometry();
  const lineVertices = [];
  
  // Add horizontal lines
  for (let i = 0; i <= width; i++) {
    lineVertices.push(i, 0, 0);
    lineVertices.push(i, 0, height);
  }
  
  // Add vertical lines
  for (let i = 0; i <= height; i++) {
    lineVertices.push(0, 0, i);
    lineVertices.push(width, 0, i);
  }
  
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));
  
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x444444 });
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lines);
}

/**
 * Create column meshes
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} rbmk - The RBMK instance
 * @returns {Array} - The column meshes
 */
function createColumns(scene, rbmk) {
  const columnMeshes = [];
  
  for (let y = 0; y < rbmk.height; y++) {
    for (let x = 0; x < rbmk.width; x++) {
      const column = rbmk.columns[x + rbmk.width * y];
      
      if (column !== null) {
        const mesh = createColumnMesh(column);
        mesh.position.set(x, 0, y);
        scene.add(mesh);
        
        columnMeshes.push({
          index: x + rbmk.width * y,
          mesh,
          column
        });
      }
    }
  }
  
  return columnMeshes;
}

/**
 * Create a column mesh
 * @param {Object} column - The column
 * @returns {THREE.Group} - The column mesh group
 */
function createColumnMesh(column) {
  const group = new THREE.Group();
  
  // Base column geometry
  const columnGeometry = new THREE.BoxGeometry(0.8, 1, 0.8);
  
  // Get color based on column type
  let color;
  
  switch (column.constructor.name) {
    case 'Fuel':
      color = 0x4caf50; // Green
      break;
    case 'Control':
      color = 0xff9800; // Orange
      break;
    case 'ControlAuto':
      color = 0xffc107; // Amber
      break;
    case 'Boiler':
      color = 0x03a9f4; // Light Blue
      break;
    case 'Moderator':
      color = 0x2196f3; // Blue
      break;
    case 'Absorber':
      color = 0x673ab7; // Deep Purple
      break;
    case 'Reflector':
      color = 0xe91e63; // Pink
      break;
    case 'Cooler':
      color = 0x00bcd4; // Cyan
      break;
    case 'Storage':
      color = 0x795548; // Brown
      break;
    default:
      color = 0x9e9e9e; // Gray
  }
  
  const columnMaterial = new THREE.MeshStandardMaterial({ color });
  const columnMesh = new THREE.Mesh(columnGeometry, columnMaterial);
  columnMesh.position.y = 0.5;
  
  group.add(columnMesh);
  
  // Add heat indicator
  const heatGeometry = new THREE.BoxGeometry(0.9, 0.05, 0.9);
  const heatMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
  const heatMesh = new THREE.Mesh(heatGeometry, heatMaterial);
  heatMesh.position.y = 1.05;
  heatMesh.userData.isHeatIndicator = true;
  
  group.add(heatMesh);
  
  return group;
}

/**
 * Update column meshes
 * @param {Array} columnMeshes - The column meshes
 * @param {Object} rbmk - The RBMK instance
 */
function updateColumns(columnMeshes, rbmk) {
  columnMeshes.forEach(item => {
    if (item.column !== null) {
      // Update heat indicator
      item.mesh.children.forEach(child => {
        if (child.userData.isHeatIndicator) {
          // Calculate heat opacity
          const heatFactor = (item.column.heat - 20) / (item.column.maxHeat - 20);
          child.material.opacity = Math.min(heatFactor, 1) * 0.8;
          
          // Calculate heat color (from yellow to red)
          const r = 1;
          const g = Math.max(0, 1 - heatFactor);
          const b = 0;
          
          child.material.color.setRGB(r, g, b);
        }
      });
      
      // Update control rod height if applicable
      if (item.column.constructor.name === 'Control' || item.column.constructor.name === 'ControlAuto') {
        const controlRod = item.mesh.children[0];
        controlRod.scale.y = Math.max(0.1, item.column.level);
        controlRod.position.y = 0.5 * controlRod.scale.y;
      }
    }
  });
}