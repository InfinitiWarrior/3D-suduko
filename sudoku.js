// Import Three.js (add this if you are using a module-based environment)
// import * as THREE from 'three';

// Create a scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Create a renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Resize handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Define materials
const transparentMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
const outlineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
const selectedMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: false, opacity: 1 }); // Red for selected

// Create main cube geometry and add to scene
const geometry = new THREE.BoxGeometry(3, 3, 3);
const mainCube = new THREE.Mesh(geometry, transparentMaterial);
scene.add(mainCube);

// Store smaller cubes
const smallCubeSize = 1 / 3;
const smallCubeGeometry = new THREE.BoxGeometry(smallCubeSize, smallCubeSize, smallCubeSize);
const smallerCubes = [];

// 3D Sudoku Grid Size
const gridSize = 9;
let sudokuGrid = Array.from({ length: gridSize }, () => 
    Array.from({ length: gridSize }, () => Array(gridSize).fill(0))
);

// Check if placing a number in the grid follows Sudoku rules
function isSafeToPlace(x, y, z, number) {
    for (let i = 0; i < gridSize; i++) {
        if (sudokuGrid[x][y][i] === number || sudokuGrid[x][i][z] === number || sudokuGrid[i][y][z] === number) {
            return false;
        }
    }
    return true;
}

// Recursive backtracking function to solve the Sudoku
function solve3DSudoku(x = 0, y = 0, z = 0) {
    if (x === gridSize) return true; // Completed the grid

    let [nextX, nextY, nextZ] = getNextPosition(x, y, z);

    // Skip cells with pre-filled numbers
    if (sudokuGrid[x][y][z] !== 0) return solve3DSudoku(nextX, nextY, nextZ);

    for (let num = 1; num <= gridSize; num++) {
        if (isSafeToPlace(x, y, z, num)) {
            sudokuGrid[x][y][z] = num; // Place number

            if (solve3DSudoku(nextX, nextY, nextZ)) return true; // Move forward

            sudokuGrid[x][y][z] = 0; // Backtrack
        }
    }
    return false; // Trigger backtracking
}

// Helper to find the next position in 3D
function getNextPosition(x, y, z) {
    if (z + 1 < gridSize) return [x, y, z + 1];
    if (y + 1 < gridSize) return [x, y + 1, 0];
    return [x + 1, 0, 0];
}

// Generate the initial grid and solve it
function generateAndSolve3DSudoku() {
    // You can initialize a random 3D Sudoku board here with valid constraints
    solve3DSudoku();
    return sudokuGrid;
}

// Initialize and solve the 3D Sudoku grid
const solvedSudokuGrid = generateAndSolve3DSudoku();
console.log(solvedSudokuGrid);

// Create smaller cubes and add numbers from solved 3D Sudoku grid
function createTextTexture(number) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 64;
    canvas.height = 64;

    context.fillStyle = '#ffffff';
    context.font = '40px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(number, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

// Render the 3D grid with numbers from solvedSudokuGrid
for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
            const smallCube = new THREE.Mesh(smallCubeGeometry, transparentMaterial);
            smallCube.position.set((x - 4) * smallCubeSize, (y - 4) * smallCubeSize, (z - 4) * smallCubeSize);
            mainCube.add(smallCube);
            smallerCubes.push(smallCube);

            // Outline for smaller cubes
            const smallCubeEdgesGeometry = new THREE.EdgesGeometry(smallCubeGeometry);
            const smallCubeOutline = new THREE.LineSegments(smallCubeEdgesGeometry, outlineMaterial);
            smallCube.add(smallCubeOutline);

            // Display the number on the cube if present in solved grid
            const number = solvedSudokuGrid[x][y][z];
            if (number !== 0) {
                const textTexture = createTextTexture(number);

                const textMaterial = new THREE.SpriteMaterial({
                    map: textTexture,
                    depthTest: false,
                    opacity: 0.85
                });
                const textSprite = new THREE.Sprite(textMaterial);

                textSprite.scale.set(0.3, 0.3, 0.3);
                textSprite.position.set(0, 0, smallCubeSize - 0.35);
                smallCube.add(textSprite);
            }
        }
    }
}

// Create main cube outline and synchronize rotation
const edgesGeometry = new THREE.EdgesGeometry(geometry);
const outlineLines = new THREE.LineSegments(edgesGeometry, outlineMaterial);
mainCube.add(outlineLines); // Add to main cube for consistent rotation

// Mouse variables
let mouseDown = false;
let lastMouseX = null;
let lastMouseY = null;

// Raycaster setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Mouse events
document.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mouseup', handleMouseUp);
document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('click', handleMouseClick);

// Keyboard events
document.addEventListener('keydown', handleKeyPress);

let selectedCubeIndex = -1;
const tolerance = 0.001; // Set a tolerance for positional matching

function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseUp() {
    mouseDown = false;
}

function handleMouseMove(event) {
    if (!mouseDown) return;

    const deltaX = event.clientX - lastMouseX;
    const deltaY = event.clientY - lastMouseY;

    // Rotate entire scene for interactive control
    scene.rotation.y += deltaX * 0.005;
    scene.rotation.x += deltaY * 0.005;

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseClick(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update raycaster
    raycaster.setFromCamera(mouse, camera);

    // Calculate intersecting objects
    const intersects = raycaster.intersectObjects(smallerCubes);

    if (intersects.length > 0) {
        // Unhighlight all cubes
        if (selectedCubeIndex !== -1) {
            smallerCubes[selectedCubeIndex].material = transparentMaterial;
            smallerCubes[selectedCubeIndex].userData.selected = false;
        }

        // Highlight the clicked cube
        selectedCubeIndex = smallerCubes.indexOf(intersects[0].object);
        smallerCubes[selectedCubeIndex].material = selectedMaterial;
        smallerCubes[selectedCubeIndex].userData.selected = true;
    }
}

// Helper function to compare positions with a tolerance
function positionsMatch(pos1, pos2) {
    return Math.abs(pos1.x - pos2.x) < tolerance &&
           Math.abs(pos1.y - pos2.y) < tolerance &&
           Math.abs(pos1.z - pos2.z) < tolerance;
}

function handleKeyPress(event) {
    if (selectedCubeIndex === -1) return;

    const { x, y, z } = smallerCubes[selectedCubeIndex].position;
    let newX = x, newY = y, newZ = z;

    switch (event.key) {
        case 'a':
            newX -= smallCubeSize;
            break;
        case 'd':
            newX += smallCubeSize;
            break;
        case 'w':
            newY += smallCubeSize;
            break;
        case 's':
            newY -= smallCubeSize;
            break;
        case 'q':
            newZ -= smallCubeSize;
            break;
        case 'e':
            newZ += smallCubeSize;
            break;
    }

    // Find the new cube based on the updated coordinates with tolerance
    const newSelectedCube = smallerCubes.find(cube =>
        positionsMatch(cube.position, { x: newX, y: newY, z: newZ })
    );

    if (newSelectedCube) {
        // Unhighlight the current cube
        smallerCubes[selectedCubeIndex].material = transparentMaterial;
        smallerCubes[selectedCubeIndex].userData.selected = false;

        // Update to the new cube
        selectedCubeIndex = smallerCubes.indexOf(newSelectedCube);
        newSelectedCube.material = selectedMaterial;
        newSelectedCube.userData.selected = true;
    }
}

// Render the scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
