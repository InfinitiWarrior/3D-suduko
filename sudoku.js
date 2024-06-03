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
const selectedMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: false, opacity: 1 }); // Red color for selected state

// Create a cube geometry for the main cube
const geometry = new THREE.BoxGeometry(3, 3, 3);

// Create the main cube
const mainCube = new THREE.Mesh(geometry, seeThroughMaterial);
scene.add(mainCube);

// Create smaller cube geometry
const smallCubeSize = 1;
const smallCubeGeometry = new THREE.BoxGeometry(smallCubeSize, smallCubeSize, smallCubeSize);

// Create even smaller cube geometry
const evenSmallerCubeSize = smallCubeSize / 3;
const evenSmallerCubeGeometry = new THREE.BoxGeometry(evenSmallerCubeSize, evenSmallerCubeSize, evenSmallerCubeSize);

// Store even smaller cubes for raycasting
const evenSmallerCubes = [];

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
                        evenSmallerCubes.push(evenSmallerCube);

                        // Add outline to even smaller cubes
                        const evenSmallerCubeEdgesGeometry = new THREE.EdgesGeometry(evenSmallerCubeGeometry);
                        const evenSmallerCubeOutline = new THREE.LineSegments(evenSmallerCubeEdgesGeometry, outlineMaterial);
                        evenSmallerCube.add(evenSmallerCubeOutline);

                        // Initialize selection state
                        evenSmallerCube.userData.selected = false;
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

// Raycaster for detecting clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Event listeners for mouse events
document.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mouseup', handleMouseUp);
document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('click', handleMouseClick);

// Functions to handle mouse events
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

    // Rotate the entire scene instead of just the mainCube
    scene.rotation.y += deltaX * 0.005; // Rotate around y-axis
    scene.rotation.x += deltaY * 0.005; // Rotate around x-axis

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseClick(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the raycaster
    const intersects = raycaster.intersectObjects(evenSmallerCubes);

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        intersectedObject.material = intersectedObject.userData.selected ? seeThroughMaterial : selectedMaterial;
        intersectedObject.userData.selected = !intersectedObject.userData.selected;
    }
}

// Render the scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
