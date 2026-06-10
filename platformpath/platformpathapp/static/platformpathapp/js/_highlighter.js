export async function loadDiagram(svgPath) {
    await fetch(svgPath)
        .then(r => r.text())
        .then(svgContent => {
        const container = document.getElementById('diagram-container');
        if (container) {
            container.innerHTML = svgContent;
        }
    });
}
export function highlightNode(nodeId) {
    document.querySelectorAll('.highlighted').forEach(el => {
        el.classList.remove('highlighted');
    });
    const el = document.getElementById(nodeId);
    if (el) {
        el.classList.add('highlighted');
    }
    else {
        console.warn('Node not found:', nodeId);
    }
}
// Passed a layer id and an array of all unique layers, shows the layer with the given id and hides all other layers
export function showLayer(layerId, uniqueLayers) {
    uniqueLayers.forEach((id) => {
        const layer = document.getElementById(id);
        if (layer) {
            if (id === layerId) {
                layer.style.opacity = "1.0";
            }
            else {
                layer.style.opacity = "0.0";
            }
        }
    });
}
//# sourceMappingURL=_highlighter.js.map