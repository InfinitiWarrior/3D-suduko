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

    const dimensionBtn = document.createElement("button");
    dimensionBtn.innerText = "Dimension Swap";
    dimensionBtn.style.marginTop = "8px";
    dimensionBtn.style.fontSize = "16px";
    dimensionBtn.style.cursor = "pointer";

    ui.appendChild(scoreDiv);
    ui.appendChild(restartBtn);
    ui.appendChild(dimensionBtn);
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

        for (let x = 0; x < SIZE; x++) {
            for (let y = 0; y < SIZE; y++) {
                for (let z = 0; z < SIZE; z++) {
                const mat = MAT_EMPTY.clone();
                mat.depthTest = false;
                mat.depthWrite = false;

                const c = new THREE.Mesh(geom, mat);
                    c.position.set(pos(x), pos(y), pos(z));
                    c.userData = {
                        x, y, z,
                        value: grid[x][y][z],
                        initial: grid[x][y][z],
                        label: null,
                        homePosition: c.position.clone()
                    };

                    c.add(new THREE.LineSegments(new THREE.EdgesGeometry(geom), OUTLINE));

                    if (grid[x][y][z] !== 0) {
                        const s = numberSprite(grid[x][y][z]);
                        c.add(s);
                        c.userData.label = s;
                    }

                    mainCube.add(c);
                    cells.push(c);
                    c.renderOrder = c.userData.z;

                }
            }
        }
    }

    /* =========================
       DIMENSION SWAP
    ========================== */
    let dimensionMode = "3D";
    let dimensionAnimating = false;
    let dimensionT = 0;

    function get2DGridPosition(x, y, z) {
    const boardSpacing = CELL * 11;
    const gridX = z % 3;
    const gridY = Math.floor(z / 3);

    const Z_EPSILON = 0.0005; // 👈 critical
    const zOffset = (z - 4) * Z_EPSILON;

    return new THREE.Vector3(
        (gridX - 1) * boardSpacing + (x - 4) * CELL,
        (1 - gridY) * boardSpacing + (4 - y) * CELL,
        zOffset
    );
}


    dimensionBtn.onclick = () => {
    if (dimensionAnimating) return;

    if (dimensionMode === "3D") {
        // save 3D camera state
        savedCamera = {
            radius: camRadius,
            theta: camTheta,
            phi: camPhi,
            position: camera.position.clone()
        };

        // move camera to flat view
        cam2DZoom = 12;
        camera.position.set(0, 0, cam2DZoom);
        camera.lookAt(0, 0, 0);


        dimensionMode = "2D";
    } else {
        // restore 3D camera state
        camRadius = savedCamera.radius;
        camTheta = savedCamera.theta;
        camPhi = savedCamera.phi;
        camera.position.copy(savedCamera.position);
        updateCamera();
        


        dimensionMode = "3D";
    }

    dimensionAnimating = true;
    dimensionT = 0;
    dimensionBtn.innerText =
        dimensionMode === "2D" ? "Return to Cube" : "Dimension Swap";
};


    /* =========================
       HIGHLIGHTING + INPUT
    ========================== */
    let selected = null;
    const OPACITY_SELECTED = 0.6;
    const OPACITY_LINE     = 0.25;
    const OPACITY_MATCH    = 0.08;


    function highlightFromSelected() {
    // reset visuals
    for (const c of cells) {
        c.material.opacity = 0;
        c.material.color.set(0xffffff);
    }

    if (!selected) return;

    // ALWAYS show selected cell
    selected.material.opacity = OPACITY_SELECTED;
    selected.material.color.set(0xff4444);

    // if empty cell, stop here
    if (selected.userData.value === 0) return;

    const n = selected.userData.value;

    // all same-number cells generate their own "+"
    const sources = cells.filter(c => c.userData.value === n);

    for (const src of sources) {
        const { x, y, z } = src.userData;

        for (let i = 0; i < SIZE; i++) {
            const cx = cells[idx(x, y, i)];
            const cy = cells[idx(x, i, z)];
            const cz = cells[idx(i, y, z)];

            cx.material.opacity = OPACITY_LINE;
            cy.material.opacity = OPACITY_LINE;
            cz.material.opacity = OPACITY_LINE;

            cx.material.color.set(0x6666ff);
            cy.material.color.set(0x6666ff);
            cz.material.color.set(0x6666ff);
        }
    }

    // reassert selected so it always wins
    selected.material.opacity = OPACITY_SELECTED;
    selected.material.color.set(0xff4444);
}




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

    /* =========================
       CAMERA CONTROLS
    ========================== */
    let camRadius = 4;
    let camTheta = Math.PI / 2;
    let camPhi = Math.PI / 2;
    let savedCamera = null;
    let cam2DZoom = 12;



    function updateCamera() {
        camPhi = Math.max(0.1, Math.min(Math.PI - 0.1, camPhi));
        camera.position.x = camRadius * Math.sin(camPhi) * Math.cos(camTheta);
        camera.position.y = camRadius * Math.cos(camPhi);
        camera.position.z = camRadius * Math.sin(camPhi) * Math.sin(camTheta);
        camera.lookAt(0, 0, 0);
    }

    if (dimensionMode === "3D") {
    updateCamera();
    }


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

    if (dimensionMode === "3D") {
        // original rotation behavior
        camTheta += dx * 0.005;
        camPhi -= dy * 0.005;
        updateCamera();
        

    } else {
        // 2D panning
        camera.position.x -= dx * 0.01;
        camera.position.y += dy * 0.01;
    }

    lastX = e.clientX;
    lastY = e.clientY;
});

document.addEventListener("keydown", e => {
    if (!selected) return;

    const { x, y, z, value, initial } = selected.userData;

    /* =====================
       PREVENT SCROLL
    ====================== */
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }

    /* =====================
       CAMERA (ARROW KEYS)
    ====================== */
    if (dimensionMode === "3D") {
        if (e.key === "ArrowLeft")  camTheta += 0.05;
        if (e.key === "ArrowRight") camTheta -= 0.05;
        if (e.key === "ArrowUp")    camPhi   -= 0.05;
        if (e.key === "ArrowDown")  camPhi   += 0.05;
        updateCamera();
    } else {
        const pan = 0.3;
        if (e.key === "ArrowLeft")  camera.position.x -= pan;
        if (e.key === "ArrowRight") camera.position.x += pan;
        if (e.key === "ArrowUp")    camera.position.y += pan;
        if (e.key === "ArrowDown")  camera.position.y -= pan;
    }

    /* =====================
       WASDQE MOVEMENT
    ====================== */
    let nx = x, ny = y, nz = z;

    // Depth is always the same
    if (e.key === "q") nz--;
    if (e.key === "e") nz++;

    // Screen-relative movement
    if (dimensionMode === "3D") {
        // World-aligned (original behavior)
        if (e.key === "w") ny++;
        if (e.key === "s") ny--;
        if (e.key === "a") nx--;
        if (e.key === "d") nx++;
    } else {
        // 2D view is visually flipped in X and Y
        if (e.key === "w") ny--;
        if (e.key === "s") ny++;
        if (e.key === "a") nx++;
        if (e.key === "d") nx--;
    }

    if (e.key === "q") nz--;
    if (e.key === "e") nz++;

    nx = Math.max(0, Math.min(8, nx));
    ny = Math.max(0, Math.min(8, ny));
    nz = Math.max(0, Math.min(8, nz));

    const next = cells[idx(nx, ny, nz)];
    if (next && next !== selected) {
        selected = next;
        highlightFromSelected();
        return;
    }

    /* =====================
       NUMBER INPUT
    ====================== */
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

    /* =====================
       DELETE / CLEAR
    ====================== */
    if (e.key === "Backspace" || e.key === "0") {
        if (value !== 0 && initial === 0) {
            grid[x][y][z] = 0;
            selected.userData.value = 0;
            selected.remove(selected.userData.label);
            selected.userData.label = null;
            highlightFromSelected();
        }
    }
});



    document.addEventListener("wheel", e => {
    if (dimensionMode === "3D") {
        // original 3D zoom
        camRadius += e.deltaY * 0.01;
        camRadius = Math.max(3, Math.min(15, camRadius));
        updateCamera();
        

    } else {
        // 2D zoom (NO updateCamera)
        cam2DZoom += e.deltaY * 0.01;
        cam2DZoom = Math.max(5, Math.min(40, cam2DZoom));
        camera.position.z = cam2DZoom;
    }
});


    /* =========================
       RESTART + INIT
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

    newGrid();
    seed();
    initialGrid = JSON.parse(JSON.stringify(grid));
    buildCells();

    /* =========================
       LOOP
    ========================== */
    function animate() {
        requestAnimationFrame(animate);

        if (dimensionAnimating) {
            dimensionT += 0.05;
            const a = Math.min(dimensionT, 1);

            for (const c of cells) {
                const { x, y, z, homePosition } = c.userData;
                const target = get2DGridPosition(x, y, z);

                if (dimensionMode === "2D") {
                    c.position.lerpVectors(homePosition, target, a);
                    c.renderOrder = 10 + c.userData.z;

                } else {
                    c.position.lerpVectors(target, homePosition, a);
                    c.renderOrder = 0;
                }
            }

            if (a >= 1) dimensionAnimating = false;
        }

        renderer.render(scene, camera);
    }

    animate();
};