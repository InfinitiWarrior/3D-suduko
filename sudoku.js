window.onload = function () {

    /* =========================
       SCORE + UI
    ========================== */
    let score = 0;

    const ui = document.createElement("div");
    ui.style.position = "fixed";
    ui.style.top = "10px";
    ui.style.left = "10px";
    ui.style.color = "white";
    ui.style.fontFamily = "Arial";
    ui.style.zIndex = "1000";

    const scoreDiv = document.createElement("div");
    scoreDiv.style.fontSize = "20px";
    scoreDiv.innerText = "Score: 0";

    const restartBtn = document.createElement("button");
    restartBtn.innerText = "Restart";
    restartBtn.style.marginTop = "8px";
    restartBtn.style.fontSize = "16px";
    restartBtn.style.cursor = "pointer";

    ui.appendChild(scoreDiv);
    ui.appendChild(restartBtn);
    document.body.appendChild(ui);

    function updateScore(delta) {
        score += delta;
        scoreDiv.innerText = `Score: ${score}`;
    }

    /* =========================
       THREE SETUP
    ========================== */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);

    window.addEventListener("resize", () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    });

    /* =========================
       MATERIALS
    ========================== */
    const MAT_EMPTY = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    const MAT_SELECTED = new THREE.MeshBasicMaterial({ color: 0xff4444 });
    const MAT_LINE = new THREE.MeshBasicMaterial({
        color: 0x6666ff,
        transparent: true,
        opacity: 0.25
    });
    const OUTLINE = new THREE.LineBasicMaterial({ color: 0xffffff });

    /* =========================
       MAIN CUBE
    ========================== */
    const cubeGeom = new THREE.BoxGeometry(3, 3, 3);
    const mainCube = new THREE.Mesh(cubeGeom, MAT_EMPTY);
    scene.add(mainCube);
    mainCube.add(new THREE.LineSegments(new THREE.EdgesGeometry(cubeGeom), OUTLINE));

    /* =========================
       GRID
    ========================== */
    const SIZE = 9;
    const CELL = 1 / 3;

    let grid, initialGrid;

    function newGrid() {
        grid = Array.from({ length: SIZE }, () =>
            Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
        );
    }

    function isValid(x, y, z, n) {
        for (let i = 0; i < SIZE; i++) {
            if (
                grid[x][y][i] === n ||
                grid[x][i][z] === n ||
                grid[i][y][z] === n
            ) return false;
        }
        return true;
    }

    function hasAnyCandidate(x, y, z) {
        for (let n = 1; n <= 9; n++) {
            if (isValid(x, y, z, n)) return true;
        }
        return false;
    }

    function createsDeadEnd(x0, y0, z0) {
        for (let i = 0; i < SIZE; i++) {
            const checks = [
                [x0, y0, i],
                [x0, i, z0],
                [i, y0, z0]
            ];
            for (const [x, y, z] of checks) {
                if (grid[x][y][z] === 0 && !hasAnyCandidate(x, y, z)) {
                    return true;
                }
            }
        }
        return false;
    }

    function seed(count = 60) {
        let placed = 0;
        while (placed < count) {
            const x = Math.floor(Math.random() * SIZE);
            const y = Math.floor(Math.random() * SIZE);
            const z = Math.floor(Math.random() * SIZE);
            const n = Math.floor(Math.random() * 9) + 1;

            if (grid[x][y][z] === 0 && isValid(x, y, z, n)) {
                grid[x][y][z] = n;
                placed++;
            }
        }
    }

    /* =========================
       NUMBER SPRITES
    ========================== */
    function numberSprite(n) {
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d");
        c.width = c.height = 64;

        ctx.fillStyle = "#fff";
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n, 32, 32);

        const tex = new THREE.CanvasTexture(c);
        const mat = new THREE.SpriteMaterial({
            map: tex,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });

        const spr = new THREE.Sprite(mat);
        spr.scale.set(0.3, 0.3, 0.3);
        spr.position.set(0, 0, 0);
        return spr;
    }

    /* =========================
       CELLS
    ========================== */
    const geom = new THREE.BoxGeometry(CELL, CELL, CELL);
    const cells = [];

    const pos = i => (i - 4) * CELL;
    const idx = (x, y, z) => x * 81 + y * 9 + z;

    function buildCells() {
        cells.length = 0;
        mainCube.clear();
        mainCube.add(new THREE.LineSegments(new THREE.EdgesGeometry(cubeGeom), OUTLINE));

        for (let x = 0; x < SIZE; x++) {
            for (let y = 0; y < SIZE; y++) {
                for (let z = 0; z < SIZE; z++) {
                    const c = new THREE.Mesh(geom, MAT_EMPTY);
                    c.position.set(pos(x), pos(y), pos(z));
                    c.userData = {
                        x, y, z,
                        value: grid[x][y][z],
                        initial: grid[x][y][z],
                        label: null
                    };

                    c.add(new THREE.LineSegments(new THREE.EdgesGeometry(geom), OUTLINE));

                    if (grid[x][y][z] !== 0) {
                        const s = numberSprite(grid[x][y][z]);
                        c.add(s);
                        c.userData.label = s;
                    }

                    mainCube.add(c);
                    cells.push(c);
                }
            }
        }
    }

    /* =========================
       HIGHLIGHTING
    ========================== */
    let selected = null;

    function clearHighlights() {
        cells.forEach(c => c.material = MAT_EMPTY);
        if (selected) selected.material = MAT_SELECTED;
    }

    function highlightFromSelected() {
        clearHighlights();
        if (!selected || selected.userData.value === 0) return;

        const n = selected.userData.value;
        for (const src of cells.filter(c => c.userData.value === n)) {
            const { x, y, z } = src.userData;
            for (let i = 0; i < SIZE; i++) {
                cells[idx(x, y, i)].material = MAT_LINE;
                cells[idx(x, i, z)].material = MAT_LINE;
                cells[idx(i, y, z)].material = MAT_LINE;
            }
        }
        selected.material = MAT_SELECTED;
    }

    /* =========================
       INPUT
    ========================== */
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    document.addEventListener("click", e => {
        mouse.x = (e.clientX / innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hit = raycaster.intersectObjects(cells)[0];
        if (hit) {
            selected = hit.object;
            highlightFromSelected();
        }
    });

    document.addEventListener("keydown", e => {
        if (!selected) return;
        const { x, y, z, value, initial } = selected.userData;

        if (e.key >= "1" && e.key <= "9") {
            const n = parseInt(e.key);
            if (!isValid(x, y, z, n)) {
                updateScore(-100);
                return;
            }

            const prev = value;
            grid[x][y][z] = n;
            if (createsDeadEnd(x, y, z)) {
                grid[x][y][z] = prev;
                updateScore(-100);
                return;
            }

            selected.userData.value = n;

            if (selected.userData.label)
                selected.remove(selected.userData.label);

            selected.userData.label = numberSprite(n);
            selected.add(selected.userData.label);

            if (prev === 0 && initial === 0) updateScore(100);
            else if (prev !== n && initial !== n) updateScore(50);

            highlightFromSelected();
        }

        if (e.key === "Backspace" || e.key === "0") {
            if (value !== 0) {
                grid[x][y][z] = 0;
                selected.userData.value = 0;
                selected.remove(selected.userData.label);
                selected.userData.label = null;
                highlightFromSelected();
            }
        }
    });

    /* =========================
       MOVEMENT
    ========================== */
    const EPS = 0.001;
    const same = (a, b) =>
        Math.abs(a.x - b.x) < EPS &&
        Math.abs(a.y - b.y) < EPS &&
        Math.abs(a.z - b.z) < EPS;

    document.addEventListener("keydown", e => {
        if (!selected) return;

        let { x, y, z } = selected.position;
        if (e.key === "a") x -= CELL;
        if (e.key === "d") x += CELL;
        if (e.key === "w") y += CELL;
        if (e.key === "s") y -= CELL;
        if (e.key === "q") z -= CELL;
        if (e.key === "e") z += CELL;

        const next = cells.find(c => same(c.position, { x, y, z }));
        if (next) {
            selected = next;
            highlightFromSelected();
        }
    });

    /* =========================
       RESTART
    ========================== */
    function restart() {
        score = 0;
        updateScore(0);
        selected = null;
        newGrid();
        seed();
        initialGrid = JSON.parse(JSON.stringify(grid));
        buildCells();
    }

    restartBtn.onclick = restart;

    /* =========================
       INIT
    ========================== */
    newGrid();
    seed();
    initialGrid = JSON.parse(JSON.stringify(grid));
    buildCells();

    window.dispatchEvent(new MessageEvent("message", { data: "Cube Loaded" }));

    /* =========================
    CAMERA CONTROLS
    ========================== */
    let camRadius = 4;
    let camTheta = Math.PI / 2; // facing +Z
    let camPhi = Math.PI / 2;   // level (no tilt)


    function updateCamera() {
        camPhi = Math.max(0.1, Math.min(Math.PI - 0.1, camPhi));

        camera.position.x = camRadius * Math.sin(camPhi) * Math.cos(camTheta);
        camera.position.y = camRadius * Math.cos(camPhi);
        camera.position.z = camRadius * Math.sin(camPhi) * Math.sin(camTheta);

        camera.lookAt(0, 0, 0);
    }

    updateCamera();

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    document.addEventListener("mousedown", e => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
    });

    document.addEventListener("mouseup", () => dragging = false);
    document.addEventListener("mouseleave", () => dragging = false);

    document.addEventListener("mousemove", e => {
        if (!dragging) return;

        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;

        camTheta += dx * 0.005;   // left-right drag
        camPhi   -= dy * 0.005;   // up-down drag


        lastX = e.clientX;
        lastY = e.clientY;

        updateCamera();
    });
    
    document.addEventListener("wheel", e => {
    camRadius += e.deltaY * 0.01;
    camRadius = Math.max(3, Math.min(15, camRadius));
    updateCamera();
    });

    document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft")  camTheta += 0.05;
    if (e.key === "ArrowRight") camTheta -= 0.05;
    if (e.key === "ArrowUp")    camPhi   -= 0.05;
    if (e.key === "ArrowDown")  camPhi   += 0.05;

    updateCamera();
    });

    

    /* =========================
       LOOP
    ========================== */
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    
    animate();
};
