export async function loadDiagram(svgPath: string): Promise<void> {
    await fetch(svgPath)
        .then(r => r.text())
        .then(svgContent => {
            const container = document.getElementById('diagram-container');
            if (container) {
                container.innerHTML = svgContent;
            }
        });
}

export function highlightNode(nodeId: string): void {
    document.querySelectorAll('.highlighted').forEach(el => {
        el.classList.remove('highlighted');
    });

    const el = document.getElementById(nodeId);
    if (el) {
        el.classList.add('highlighted');
    } else {
        console.warn('Node not found:', nodeId);
    }
}

export function showLayer(layerId: string): void {
    // in future layers will be stored in the database for each station
    const layerIds = ["DOWNTOWN PLATFORM_2", "UPTOWN PLATFORM_2", "MEZZANINE"];

    layerIds.forEach((id) => {
        const layer = document.getElementById(id);
        if (layer) {
            if (id === layerId) {
                layer.style.opacity = "1.0"
            } else {
                layer.style.opacity = "0.0"
            }
        }
    });
}
