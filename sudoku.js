// Create a scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Create a renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Define materials
const seeThroughMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
const outlineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

const evenSmallerCubeSize = 1;
const evenSmallerCubeGeometry = new THREE.BoxGeometry(evenSmallerCubeSize, evenSmallerCubeSize, evenSmallerCubeSize);

// Create smaller cubes and position them inside the main cube
for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
            const smallCube = new THREE.Mesh(smallCubeGeometry, seeThroughMaterial);
            smallCube.position.set(x * smallCubeSize, y * smallCubeSize, z * smallCubeSize);
            mainCube.add(smallCube);

            // Add outline to smaller cubes
            const smallCubeEdgesGeometry = new THREE.EdgesGeometry(smallCubeGeometry);
            const smallCubeOutline = new THREE.LineSegments(smallCubeEdgesGeometry, outlineMaterial);
            smallCube.add(smallCubeOutline);

            // Create even smaller cubes and position them inside each small cube
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    for (let k = -1; k <= 1; k++) {
                        const evenSmallerCube = new THREE.Mesh(evenSmallerCubeGeometry, seeThroughMaterial);
                        evenSmallerCube.position.set((i + 0.5) * evenSmallerCubeSize - evenSmallerCubeSize / 2, (j + 0.5) * evenSmallerCubeSize - evenSmallerCubeSize / 2, (k + 0.5) * evenSmallerCubeSize - evenSmallerCubeSize / 2);
                        smallCube.add(evenSmallerCube);

                        // Add outline to even smaller cubes
                        const evenSmallerCubeEdgesGeometry = new THREE.EdgesGeometry(evenSmallerCubeGeometry);
                        const evenSmallerCubeOutline = new THREE.LineSegments(evenSmallerCubeEdgesGeometry, outlineMaterial);
                        evenSmallerCube.add(evenSmallerCubeOutline);
                    }
                }
            }
        }
    }
}

// Create edges geometry for the outline of the main cube
const edgesGeometry = new THREE.EdgesGeometry(geometry);

// Create a mesh for the outline lines of the main cube
const outlineLines = new THREE.LineSegments(edgesGeometry, outlineMaterial);
scene.add(outlineLines);

// Variables to track mouse movement
let mouseDown = false;
let lastMouseX = null;
let lastMouseY = null;

// Event listener for mouse down
document.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mouseup', handleMouseUp);
document.addEventListener('mousemove', handleMouseMove);

// Function to handle mouse down event
function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

// Function to handle mouse up event
function handleMouseUp() {
    mouseDown = false;
}

// Function to handle mouse movement
function handleMouseMove(event) {
    if (!mouseDown) return;

    const deltaX = event.clientX - lastMouseX;
    const deltaY = event.clientY - lastMouseY;

    mainCube.rotation.y += deltaX * 0.005; // Rotate around y-axis
    mainCube.rotation.x += deltaY * 0.005; // Rotate around x-axis

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

// Render the scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
