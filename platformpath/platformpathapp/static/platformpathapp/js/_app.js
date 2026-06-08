// External functions from other files
import { loadDiagram, showLayer, highlightStair } from "./_highlighter.js";
import { findPath } from "./_stations.js";
// Global State Variables
let currentPath = []; // Will hold the array returned by findPath
let currentIndex = 0; // Tracks which step the user is on
async function init() {
    await loadDiagram("/static/platformpathapp/diagrams/Bay50.svg");
    document.getElementById("find-route")?.addEventListener("click", startNavigation);
    document.getElementById("btn-prev")?.addEventListener("click", prevStep);
    document.getElementById("btn-next")?.addEventListener("click", nextStep);
}
// 1. Handle Form Submission
function startNavigation() {
    const startId = document.getElementById('start-node').value;
    const endId = document.getElementById('end-node').value;
    // Call your BFS function
    currentPath = findPath('bay-50-st', startId, endId);
    if (currentPath && currentPath.length > 0) {
        currentIndex = 0; // Reset to the beginning
        const stepUI = document.getElementById('step-ui');
        if (stepUI) {
            stepUI.style.display = 'block'; // Show the UI
        }
        renderCurrentStep(); // Draw the first step
    }
    else {
        alert("No path found between those points!");
    }
}
// 2. Render the Map based on the currentIndex
function renderCurrentStep() {
    if (!currentPath)
        return;
    const step = currentPath[currentIndex];
    // A. Update the Text
    const instructionText = document.getElementById('instruction-text');
    if (instructionText) {
        instructionText.innerText =
            `Step ${currentIndex + 1} of ${currentPath.length}: ${step.instruction}`;
    }
    // B. Handle Layer Visibility (The Z-Axis Fix)
    // Show ONLY the layer specified by the current node
    showLayer(step.layer);
    // C. Highlight the Specific Element
    // Note: Ensure highlightStair() removes previous highlights before adding the new one!
    highlightStair(step.svgId);
    // D. Manage Button States (Disable Prev on step 1, Next on last step)
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    if (btnPrev)
        btnPrev.disabled = (currentIndex === 0);
    if (btnNext)
        btnNext.disabled = (currentIndex === currentPath.length - 1);
}
// 3. Navigation Controls
function nextStep() {
    if (currentPath && currentIndex < currentPath.length - 1) {
        currentIndex++;
        renderCurrentStep();
    }
}
function prevStep() {
    if (currentIndex > 0) {
        currentIndex--;
        renderCurrentStep();
    }
}
// initalize page
document.addEventListener("DOMContentLoaded", () => {
    void init();
});
//# sourceMappingURL=_app.js.map