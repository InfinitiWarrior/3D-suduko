window.addEventListener("load", () => {

    /* =========================
       TUTORIAL OVERLAY
    ========================== */

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.background = "rgba(0, 0, 0, 0.85)";
    overlay.style.color = "#fff";
    overlay.style.zIndex = "5000";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.fontFamily = "Arial";

    const panel = document.createElement("div");
    panel.style.maxWidth = "560px";
    panel.style.background = "#111";
    panel.style.border = "1px solid #444";
    panel.style.padding = "24px";
    panel.style.borderRadius = "8px";
    panel.style.boxShadow = "0 0 20px rgba(0,0,0,0.5)";
    panel.style.lineHeight = "1.5";

    panel.innerHTML = `
        <h2 style="margin-top:0;">🧊 3D Cube Sudoku</h2>

        <p>
            <b>Goal:</b> Fill the cube so that every straight line
            (X, Y, and Z directions) contains the numbers <b>1–9</b>
            with no duplicates.
        </p>

        <hr style="border-color:#333">

        <h3 style="margin-bottom:6px;">🧠 How to Think About It</h3>
        <p style="opacity:0.9;">
            You don’t have to solve the cube all at once.
            Think of it as <b>9 interconnected Sudoku boards</b>.
        </p>

        <p style="opacity:0.9;">
            Use <b>Dimension Swap</b> to split the cube into flat 2D layers
            for easier solving, then return to 3D to see how everything connects.
        </p>

        <hr style="border-color:#333">

        <h3 style="margin-bottom:6px;">🎮 Controls</h3>

        <ul>
            <li><b>Click</b> a cell to select it</li>
            <li><b>1–9</b> to place a number</li>
            <li><b>Backspace / 0</b> to erase</li>
            <li><b>W A S D</b> move on the current face</li>
            <li><b>Q / E</b> move through depth</li>
            <li><b>Mouse Drag / Arrow Keys</b> rotate the cube</li>
            <li><b>Mouse Wheel</b> zoom</li>
            <li><b>Dimension Swap</b> toggles 3D ↔ layered 2D view</li>
        </ul>

        <hr style="border-color:#333">

        <p style="font-size:14px; opacity:0.8;">
            Invalid moves reduce score.<br>
            Valid placements increase score.<br>
            There may be multiple valid solutions — focus on consistency, not guessing.
        </p>
    `;

    const closeBtn = document.createElement("button");
    closeBtn.innerText = "Start Playing";
    closeBtn.style.marginTop = "16px";
    closeBtn.style.padding = "10px 16px";
    closeBtn.style.fontSize = "16px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.background = "#ff4444";
    closeBtn.style.color = "#fff";
    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "4px";

    closeBtn.onclick = () => {
        overlay.remove();
    };

    panel.appendChild(closeBtn);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

});
