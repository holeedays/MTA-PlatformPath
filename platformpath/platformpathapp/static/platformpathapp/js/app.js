// Global State Variables
let currentPath = [];   // Will hold the array returned by findPath
let currentIndex = 0;   // Tracks which step the user is on

// 1. Handle Form Submission
function startNavigation() {
    const startId = document.getElementById('start-node').value;
    const endId = document.getElementById('end-node').value;

    // Call your BFS function
    currentPath = findPath('bay-50-st', startId, endId);

    if (currentPath && currentPath.length > 0) {
        currentIndex = 0; // Reset to the beginning
        document.getElementById('step-ui').style.display = 'block'; // Show the UI
        renderCurrentStep(); // Draw the first step
    } else {
        alert("No path found between those points!");
    }
}

// 2. Render the Map based on the currentIndex
function renderCurrentStep() {
    const step = currentPath[currentIndex];

    // A. Update the Text
    document.getElementById('instruction-text').innerText =
        `Step ${currentIndex + 1} of ${currentPath.length}: ${step.instruction}`;

    // B. Handle Layer Visibility (The Z-Axis Fix)
    // First, hide everything
    down.style.opacity = "0.0";
    up.style.opacity = "0.0";
    mez.style.opacity = "0.0";

    // Then, show ONLY the layer specified by the current node
    const activeLayer = document.getElementById(step.layer);
    if (activeLayer) {
        activeLayer.style.opacity = "1.0";
    }

    // C. Highlight the Specific Element
    // Note: Ensure highlightStair() removes previous highlights before adding the new one!
    highlightStair(step.svgId);

    // D. Manage Button States (Disable Prev on step 1, Next on last step)
    document.getElementById('btn-prev').disabled = (currentIndex === 0);
    document.getElementById('btn-next').disabled = (currentIndex === currentPath.length - 1);
}

// 3. Navigation Controls
function nextStep() {
    if (currentIndex < currentPath.length - 1) {
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
