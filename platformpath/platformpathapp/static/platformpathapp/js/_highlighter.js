function loadDiagram(svgPath) {
    fetch(svgPath)
        .then(r => r.text())
        .then(svgContent => {
        const container = document.getElementById('diagram-container');
        if (container) {
            container.innerHTML = svgContent;
        }
    });
}
function highlightStair(stairId) {
    document.querySelectorAll('.highlighted').forEach(el => {
        el.classList.remove('highlighted');
    });
    const el = document.getElementById(stairId);
    if (el) {
        el.classList.add('highlighted');
    }
    else {
        console.warn('Stair not found:', stairId);
    }
}
window.loadDiagram = loadDiagram;
window.highlightStair = highlightStair;
export {};
//# sourceMappingURL=_highlighter.js.map