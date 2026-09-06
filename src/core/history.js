import { deepClone } from './utils.js';

export class History {
  constructor(limit = 100) {
    this.limit = limit;
    this._undoStack = [];
    this._redoStack = [];
  }
  push(snapshot) {
    this._undoStack.push(deepClone(snapshot));
    if (this._undoStack.length > this.limit) this._undoStack.shift();
    this._redoStack.length = 0;
  }
  undo(current) {
    if (!this._undoStack.length) return null;
    this._redoStack.push(deepClone(current));
    return this._undoStack.pop();
  }
  redo(current) {
    if (!this._redoStack.length) return null;
    this._undoStack.push(deepClone(current));
    return this._redoStack.pop();
  }
  canUndo() {
    return this._undoStack.length > 0;
  }
  canRedo() {
    return this._redoStack.length > 0;
  }
  reset() {
    this._undoStack.length = 0;
    this._redoStack.length = 0;
  }
}
