function loadDiagram(svgPath: string): void {
    fetch(svgPath)
        .then(r => r.text())
        .then(svgContent => {
            const container = document.getElementById('diagram-container');
            if (container) {
                container.innerHTML = svgContent;
            }
        });
}

function highlightStair(stairId: string): void {
    document.querySelectorAll('.highlighted').forEach(el => {
        el.classList.remove('highlighted');
    });

    const el = document.getElementById(stairId);
    if (el) {
        el.classList.add('highlighted');
    } else {
        console.warn('Stair not found:', stairId);
    }
}

(window as any).loadDiagram = loadDiagram;
(window as any).highlightStair = highlightStair;
