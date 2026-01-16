window.addEventListener("load", () => {

    /* =========================
       TUTORIAL OVERLAY
    ========================== */

    let tutorialVisible = true;

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
    panel.style.maxWidth = "520px";
    panel.style.background = "#111";
    panel.style.border = "1px solid #444";
    panel.style.padding = "24px";
    panel.style.borderRadius = "8px";
    panel.style.boxShadow = "0 0 20px rgba(0,0,0,0.5)";

    panel.innerHTML = `
        <h2 style="margin-top:0;">🧊 3D Cube Sudoku</h2>

        <p><b>Goal:</b> Fill the cube with numbers 1–9.</p>

        <ul>
            <li><b>Click</b> a cell to select it</li>
            <li><b>1–9</b> to place a number</li>
            <li><b>Backspace / 0</b> to erase</li>
            <li><b>W A S D</b> move on face</li>
            <li><b>Q / E</b> move depth</li>
            <li><b>Mouse Drag & Arrow Keys</b> rotate cube</li>
            <li><b>Mouse Wheel</b> zoom</li>
        </ul>

        <p style="font-size:14px; opacity:0.8;">
            Invalid moves reduce score.<br>
            Completing cells increases score.
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
        tutorialVisible = false;
        overlay.remove();
    };

    panel.appendChild(closeBtn);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

});
