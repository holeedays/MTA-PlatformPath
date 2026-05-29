function loadDiagram(svgPath) {
    fetch(svgPath)
        .then(r => r.text())
        .then(svgContent => {
            document.getElementById('diagram-container').innerHTML = svgContent;
        });
}

function highlightStair(stairId) {
    const el = document.getElementById(stairId);
    if (el) {
        el.classList.add('highlighted');
    } else {
        console.warn('Stair not found:', stairId);
    }
}
