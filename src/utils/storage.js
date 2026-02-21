export function saveDiagram(key, data) {
  try {
    localStorage.setItem(`sysdesign_${key}`, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Save failed:', e);
    return false;
  }
}

export function loadDiagram(key) {
  try {
    const raw = localStorage.getItem(`sysdesign_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Load failed:', e);
    return null;
  }
}

export function listSavedDiagrams() {
  const diagrams = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('sysdesign_')) {
      diagrams.push(key.replace('sysdesign_', ''));
    }
  }
  return diagrams;
}

export function exportAsJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'system-design.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importJSON() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          resolve(JSON.parse(ev.target.result));
        } catch {
          resolve(null);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

export function exportAsPNG(canvas) {
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'system-design.png';
  a.click();
}
