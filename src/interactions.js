import {
  deg2rad,
  rad2deg,
  clamp,
  rotatePoint
} from './core/utils.js';
import { hitTest, elementAABB, elementCenter, rectsIntersect, selectionBBox, manifestFor } from './core/elements.js';

const SNAP_THRESHOLD = 6;

export class Interactions {
  constructor(editor) {
    this.editor = editor;
    this.drag = null;
    this.spaceDown = false;
    editor._isActive = true;
    this._bind();
  }

  _bind() {
    const ed = this.editor;
    this._onDocPointerDown = (e) => {
      ed._isActive = ed.container.contains(e.target);
    };
    this._onPointerMove = (e) => this.onPointerMove(e);
    this._onPointerUp = (e) => this.onPointerUp(e);
    this._onKeyDown = (e) => this.onKeyDown(e);
    this._onKeyUp = (e) => {
      if (e.code === 'Space') {
        this.spaceDown = false;
        ed.viewport.classList.remove('ez-panning');
      }
    };
    ed.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    ed.overlay.addEventListener('pointerdown', (e) => {
      if (e.target === ed.overlay) this.onPointerDown(e);
    });
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    ed.viewport.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('pointerdown', this._onDocPointerDown, true);
    ed.canvas.addEventListener('dblclick', (e) => this.onDblClick(e));
    ed.viewport.addEventListener('dragover', (e) => e.preventDefault());
    ed.viewport.addEventListener('drop', (e) => this.onDrop(e));
  }

  destroy() {
    const ed = this.editor;
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('pointerdown', this._onDocPointerDown, true);
    ed.viewport.classList.remove('ez-panning');
    this.drag = null;
  }

  clientToWorld(e) {
    const rect = this.editor.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / this.editor.zoom,
      y: (e.clientY - rect.top) / this.editor.zoom
    };
  }

  onWheel(e) {
    const ed = this.editor;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      ed.setZoom(clamp(ed.zoom * factor, 0.05, 5), { x: e.clientX, y: e.clientY });
    }
  }

  onDrop(e) {
    e.preventDefault();
    const ed = this.editor;
    const files = [...(e.dataTransfer?.files || [])].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    const world = this.clientToWorld(e);
    files.forEach(async (file, i) => {
      const src = await ed.addUpload(file);
      ed.addElement({
        type: 'image',
        src,
        name: file.name,
        x: world.x - 100 + i * 30,
        y: world.y - 100 + i * 30
      });
    });
  }

  onDblClick(e) {
    const ed = this.editor;
    const p = this.clientToWorld(e);
    const els = ed.getElements();
    for (let i = els.length - 1; i >= 0; i--) {
      if (hitTest(els[i], p.x, p.y, 4, ed.registry)) {
        ed.select([els[i].id]);
        const edit = manifestFor(els[i].type, ed.registry).edit;
        if (edit === 'chart') ed.ui.sidepanel?.charts?.open();
        else if (edit === 'text') ed.startTextEdit(els[i]);
        return;
      }
    }
  }

  onPointerDown(e) {
    const ed = this.editor;
    if (e.button === 1 || this.spaceDown) {
      this.startPan(e);
      return;
    }
    if (e.button !== 0) return;
    if (ed._editing) ed.commitTextEdit();

    const p = this.clientToWorld(e);
    const els = ed.getElements();

    for (let i = els.length - 1; i >= 0; i--) {
      if (hitTest(els[i], p.x, p.y, 4, ed.registry)) {
        const el = els[i];
        if (e.shiftKey) {
          ed.toggleSelect(el.id);
        } else if (!ed.selection.has(el.id)) {
          ed.select([el.id]);
        }
        if (!el.locked) this.startMove(e);
        return;
      }
    }
    if (!e.shiftKey) ed.clearSelection();
    this.startRubberBand(e);
  }

  startPan(e) {
    const ed = this.editor;
    e.preventDefault();
    this.drag = {
      mode: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: ed.viewport.scrollLeft,
      scrollTop: ed.viewport.scrollTop
    };
    ed.viewport.classList.add('ez-panning');
  }

  startMove(e) {
    const ed = this.editor;
    const selected = ed.getSelected();
    const p = this.clientToWorld(e);
    this.drag = {
      mode: 'move',
      start: p,
      originals: selected.map((el) => ({ el, x: el.x, y: el.y })),
      moved: false
    };
  }

  startRubberBand(e) {
    const ed = this.editor;
    const p = this.clientToWorld(e);
    // Rendering preserves the overlay during band selection, so first remove
    // any handles left behind by the blank-canvas deselection.
    ed.updateOverlay();
    this.drag = { mode: 'band', start: p };
    const band = document.createElement('div');
    band.className = 'ez-band';
    ed.overlay.appendChild(band);
    this.drag.band = band;
  }

  startResize(e, dir) {
    const ed = this.editor;
    const el = ed.getSelected()[0];
    if (!el || el.locked) return;
    e.stopPropagation();
    e.preventDefault();
    const c0 = elementCenter(el);
    const opposite = {
      nw: 'se', n: 's', ne: 'sw',
      e: 'w', se: 'nw', s: 'n',
      sw: 'ne', w: 'e'
    }[dir];
    const anchor = this.handlePoint(el, opposite);
    this.drag = {
      mode: 'resize',
      dir,
      el,
      c0,
      anchor,
      aspect: el.w / Math.max(1, el.h),
      startW: el.w,
      startH: el.h
    };
  }

  startRotate(e) {
    const ed = this.editor;
    const el = ed.getSelected()[0];
    if (!el || el.locked) return;
    e.stopPropagation();
    e.preventDefault();
    const c = elementCenter(el);
    const p = this.clientToWorld(e);
    const startAngle = Math.atan2(p.y - c.y, p.x - c.x);
    this.drag = { mode: 'rotate', el, center: c, startAngle, startRotation: el.rotation || 0 };
  }

  handlePoint(el, dir) {
    const c = elementCenter(el);
    const r = deg2rad(el.rotation || 0);
    const local = {
      nw: { x: el.x, y: el.y },
      n: { x: c.x, y: el.y },
      ne: { x: el.x + el.w, y: el.y },
      e: { x: el.x + el.w, y: c.y },
      se: { x: el.x + el.w, y: el.y + el.h },
      s: { x: c.x, y: el.y + el.h },
      sw: { x: el.x, y: el.y + el.h },
      w: { x: el.x, y: c.y }
    }[dir];
    return rotatePoint(local.x, local.y, c.x, c.y, r);
  }

  onPointerMove(e) {
    const drag = this.drag;
    if (!drag) return;
    const ed = this.editor;
    if (drag.mode === 'pan') {
      ed.viewport.scrollLeft = drag.scrollLeft - (e.clientX - drag.startX);
      ed.viewport.scrollTop = drag.scrollTop - (e.clientY - drag.startY);
      return;
    }
    if (drag.mode === 'band') {
      const p = this.clientToWorld(e);
      const r = normRect(drag.start, p);
      drag.rect = r;
      Object.assign(drag.band.style, {
        left: r.x * ed.zoom + 'px',
        top: r.y * ed.zoom + 'px',
        width: r.w * ed.zoom + 'px',
        height: r.h * ed.zoom + 'px',
        display: 'block'
      });
      return;
    }
    if (drag.mode === 'move') {
      const p = this.clientToWorld(e);
      let dx = p.x - drag.start.x;
      let dy = p.y - drag.start.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
      if (e.shiftKey) {
        if (Math.abs(dx) > Math.abs(dy)) dy = 0;
        else dx = 0;
      }
      const originals = drag.originals;
      const movingBox = selectionBBox(originals.map((o) => ({ ...o.el, x: o.x + dx, y: o.y + dy })));
      const others = ed.getElements().filter((el) => !ed.selection.has(el.id) && !el.hidden && !el.locked);
      const snap = computeSnap(movingBox, others, ed.getPage(), e.altKey ? 0 : SNAP_THRESHOLD);
      dx += snap.dx;
      dy += snap.dy;
      for (const o of originals) {
        o.el.x = o.x + dx;
        o.el.y = o.y + dy;
      }
      ed.setGuides(snap.guides);
      ed.markDirty();
      return;
    }
    if (drag.mode === 'resize') {
      const p = this.clientToWorld(e);
      applyResize(drag, p, e.shiftKey);
      ed.markDirty();
      return;
    }
    if (drag.mode === 'rotate') {
      const p = this.clientToWorld(e);
      const angle = Math.atan2(p.y - drag.center.y, p.x - drag.center.x);
      let deg = drag.startRotation + rad2deg(angle - drag.startAngle);
      const snapTo = Math.round(deg / 15) * 15;
      if (Math.abs(deg - snapTo) < 4) deg = snapTo;
      drag.el.rotation = ((deg % 360) + 360) % 360;
      ed.markDirty();
    }
  }

  onPointerUp(e) {
    const drag = this.drag;
    if (!drag) return;
    const ed = this.editor;
    this.drag = null;
    if (drag.mode === 'pan') {
      ed.viewport.classList.remove('ez-panning');
      return;
    }
    if (drag.mode === 'band') {
      drag.band.remove();
      // Refresh even when a click or an empty drag selects no elements.
      ed.markDirty();
      if (drag.rect) {
        const hits = ed
          .getElements()
          .filter((el) => !el.hidden && !el.locked && rectsIntersect(drag.rect, elementAABB(el)));
        if (hits.length) {
          if (e.shiftKey) {
            const ids = new Set(ed.selection);
            hits.forEach((h) => ids.add(h.id));
            ed.select([...ids]);
          } else {
            ed.select(hits.map((h) => h.id));
          }
        }
      }
      return;
    }
    if (drag.mode === 'move') {
      ed.setGuides([]);
      if (drag.moved) {
        ed.markDirty();
        ed.commit();
      }
      return;
    }
    if (drag.mode === 'resize' || drag.mode === 'rotate') {
      if (manifestFor(drag.el.type, ed.registry).autoFitHeight) ed.fitTextHeight(drag.el);
      ed.markDirty();
      ed.commit();
    }
  }

  onKeyDown(e) {
    const ed = this.editor;
    if (!ed._isActive) return;
    const target = e.target;
    const typing =
      target &&
      (target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
    if (typing || ed._editing) return;

    if (e.code === 'Space' && !this.spaceDown) {
      e.preventDefault();
      this.spaceDown = true;
      ed.viewport.classList.add('ez-panning');
      return;
    }
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    if (mod && key === 'z') {
      e.preventDefault();
      e.shiftKey ? ed.redo() : ed.undo();
      return;
    }
    if (mod && key === 'y') {
      e.preventDefault();
      ed.redo();
      return;
    }
    if (mod && e.shiftKey && key === 'l') {
      e.preventDefault();
      return ed.toggleTheme();
    }
    if (mod && key === 'c') return ed.copy();
    if (mod && key === 'x') return ed.cut();
    if (mod && key === 'v') return ed.paste();
    if (mod && key === 'd') {
      e.preventDefault();
      return ed.duplicateSelected();
    }
    if (mod && key === 'a') {
      e.preventDefault();
      return ed.select(ed.getElements().filter((el) => !el.locked && !el.hidden).map((el) => el.id));
    }
    if (key === 'delete' || key === 'backspace') {
      if (ed.selection.size) {
        e.preventDefault();
        ed.deleteSelected();
      }
      return;
    }
    if (key === 'escape') return ed.clearSelection();
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key)) {
      if (!ed.selection.size) return;
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const dx = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0;
      const dy = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0;
      ed.getSelected().forEach((el) => {
        el.x += dx;
        el.y += dy;
      });
      ed.markDirty();
      ed.commit();
      return;
    }
    if (mod && (key === '=' || key === '+')) {
      e.preventDefault();
      ed.setZoom(ed.zoom * 1.2);
    }
    if (mod && key === '-') {
      e.preventDefault();
      ed.setZoom(ed.zoom / 1.2);
    }
    if (mod && key === '0') {
      e.preventDefault();
      ed.zoomFit();
    }
    if (mod && key === 's') {
      e.preventDefault();
      ed.downloadJSON();
    }
  }
}

function normRect(a, b) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(b.x - a.x),
    h: Math.abs(b.y - a.y)
  };
}

function applyResize(drag, pWorld, keepAspect) {
  const { el, c0, anchor, dir } = drag;
  const r = deg2rad(-(el.rotation || 0));
  const pLocal = rotatePoint(pWorld.x, pWorld.y, c0.x, c0.y, r);
  const aLocal = rotatePoint(anchor.x, anchor.y, c0.x, c0.y, r);
  const horizontal = dir.includes('e') || dir.includes('w');
  const vertical = dir.includes('n') || dir.includes('s');
  const sx = dir.includes('w') ? -1 : 1;
  const sy = dir.includes('n') ? -1 : 1;

  // Side handles change only their own axis; clamp at the opposite edge.
  let w = horizontal ? Math.max(8, sx * (pLocal.x - aLocal.x)) : drag.startW;
  let h = vertical ? Math.max(8, sy * (pLocal.y - aLocal.y)) : drag.startH;
  if (keepAspect && horizontal && vertical) {
    w = Math.max(w, 8 * drag.aspect);
    h = w / drag.aspect;
  }
  // Derive the center from the final size so constraints cannot move the anchor.
  const mid = {
    x: aLocal.x + (horizontal ? sx * w / 2 : 0),
    y: aLocal.y + (vertical ? sy * h / 2 : 0)
  };
  const newCenter = rotatePoint(mid.x, mid.y, c0.x, c0.y, -r);
  el.w = w;
  el.h = h;
  el.x = newCenter.x - w / 2;
  el.y = newCenter.y - h / 2;
}

function computeSnap(box, others, page, threshold) {
  const result = { dx: 0, dy: 0, guides: [] };
  if (!threshold) return result;
  const pw = page.width;
  const ph = page.height;

  const xTargets = [];
  const yTargets = [];
  for (const o of others) {
    const b = elementAABB(o);
    xTargets.push({ v: b.x, a: b.y, b: b.y + b.h });
    xTargets.push({ v: b.x + b.w / 2, a: b.y, b: b.y + b.h });
    xTargets.push({ v: b.x + b.w, a: b.y, b: b.y + b.h });
    yTargets.push({ v: b.y, a: b.x, b: b.x + b.w });
    yTargets.push({ v: b.y + b.h / 2, a: b.x, b: b.x + b.w });
    yTargets.push({ v: b.y + b.h, a: b.x, b: b.x + b.w });
  }
  xTargets.push({ v: 0, a: 0, b: ph }, { v: pw / 2, a: 0, b: ph }, { v: pw, a: 0, b: ph });
  yTargets.push({ v: 0, a: 0, b: pw }, { v: ph / 2, a: 0, b: pw }, { v: ph, a: 0, b: pw });

  const movers = (list, size) => [0, size / 2, size];
  let bestX = null;
  for (const m of movers(0, box.w)) {
    for (const t of xTargets) {
      const d = t.v - (box.x + m);
      if (Math.abs(d) < threshold && (!bestX || Math.abs(d) < Math.abs(bestX.d))) {
        bestX = { d, v: t.v, a: t.a, b: t.b };
      }
    }
  }
  let bestY = null;
  for (const m of movers(0, box.h)) {
    for (const t of yTargets) {
      const d = t.v - (box.y + m);
      if (Math.abs(d) < threshold && (!bestY || Math.abs(d) < Math.abs(bestY.d))) {
        bestY = { d, v: t.v, a: t.a, b: t.b };
      }
    }
  }
  if (bestX) {
    result.dx = bestX.d;
    result.guides.push({
      axis: 'x',
      v: bestX.v,
      from: Math.min(bestX.a, box.y) - 12,
      to: Math.max(bestX.b, box.y + box.h) + 12
    });
  }
  if (bestY) {
    result.dy = bestY.d;
    result.guides.push({
      axis: 'y',
      v: bestY.v,
      from: Math.min(bestY.a, box.x) - 12,
      to: Math.max(bestY.b, box.x + box.w) + 12
    });
  }
  return result;
}
