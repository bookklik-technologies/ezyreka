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
    // The top of the undo stack is always the current state (pushed by the
    // last commit), so it must be discarded before returning the previous one.
    if (this._undoStack.length < 2) return null;
    this._redoStack.push(deepClone(current));
    this._undoStack.pop();
    return this._undoStack.pop();
  }
  redo(current) {
    if (!this._redoStack.length) return null;
    this._undoStack.push(deepClone(current));
    return this._redoStack.pop();
  }
  canUndo() {
    return this._undoStack.length >= 2;
  }
  canRedo() {
    return this._redoStack.length > 0;
  }
  reset() {
    this._undoStack.length = 0;
    this._redoStack.length = 0;
  }
}
