// Global State Variables
let currentPath: any[] | null = [];   // Will hold the array returned by findPath
let currentIndex: number = 0;   // Tracks which step the user is on

// External variables/functions from other scripts
declare function findPath(stationId: string, fromNodeId: string, toNodeId: string): any[] | null;
declare function highlightStair(stairId: string): void;
declare const down: HTMLElement;
declare const up: HTMLElement;
declare const mez: HTMLElement;

// 1. Handle Form Submission
function startNavigation(): void {
    const startId = (document.getElementById('start-node') as HTMLSelectElement).value;
    const endId = (document.getElementById('end-node') as HTMLSelectElement).value;

    // Call your BFS function
    currentPath = findPath('bay-50-st', startId, endId);

    if (currentPath && currentPath.length > 0) {
        currentIndex = 0; // Reset to the beginning
        const stepUI = document.getElementById('step-ui');
        if (stepUI) {
            stepUI.style.display = 'block'; // Show the UI
        }
        renderCurrentStep(); // Draw the first step
    } else {
        alert("No path found between those points!");
    }
}

// 2. Render the Map based on the currentIndex
function renderCurrentStep(): void {
    if (!currentPath) return;
    const step = currentPath[currentIndex];

    // A. Update the Text
    const instructionText = document.getElementById('instruction-text');
    if (instructionText) {
        instructionText.innerText =
            `Step ${currentIndex + 1} of ${currentPath.length}: ${step.instruction}`;
    }

    // B. Handle Layer Visibility (The Z-Axis Fix)
    // First, hide everything
    if (down) down.style.opacity = "0.0";
    if (up) up.style.opacity = "0.0";
    if (mez) mez.style.opacity = "0.0";

    // Then, show ONLY the layer specified by the current node
    const activeLayer = document.getElementById(step.layer || step.layerID);
    if (activeLayer) {
        activeLayer.style.opacity = "1.0";
    }

    // C. Highlight the Specific Element
    // Note: Ensure highlightStair() removes previous highlights before adding the new one!
    highlightStair(step.svgId || step.svgID);

    // D. Manage Button States (Disable Prev on step 1, Next on last step)
    const btnPrev = document.getElementById('btn-prev') as HTMLButtonElement;
    const btnNext = document.getElementById('btn-next') as HTMLButtonElement;
    
    if (btnPrev) btnPrev.disabled = (currentIndex === 0);
    if (btnNext) btnNext.disabled = (currentIndex === currentPath.length - 1);
}

// 3. Navigation Controls
function nextStep(): void {
    if (currentPath && currentIndex < currentPath.length - 1) {
        currentIndex++;
        renderCurrentStep();
    }
}

function prevStep(): void {
    if (currentIndex > 0) {
        currentIndex--;
        renderCurrentStep();
    }
}

(window as any).startNavigation = startNavigation;
(window as any).nextStep = nextStep;
(window as any).prevStep = prevStep;
