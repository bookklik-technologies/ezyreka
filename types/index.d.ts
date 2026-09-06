export as namespace SenangDesign;

export interface DesignElement {
  id?: string;
  type: 'text' | 'rect' | 'ellipse' | 'triangle' | 'star' | 'hexagon' | 'diamond' | 'heart' | 'line' | 'image' | 'icon' | 'shape';
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  opacity?: number;
  locked?: boolean;
  hidden?: boolean;
  flipX?: boolean;
  flipY?: boolean;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
  arrow?: boolean;
  src?: string;
  icon?: string;
  iconStyle?: 'solid' | 'outline';
  shape?: string;
}

export interface PageBackground {
  type: 'solid' | 'gradient' | 'image';
  color?: string;
  from?: string;
  to?: string;
  angle?: number;
  src?: string;
}

export interface DesignPage {
  width: number;
  height: number;
  background: PageBackground;
  elements: DesignElement[];
}

export interface DesignDocument {
  version: number;
  pages: DesignPage[];
}

export interface EditorOptions {
  target: string | HTMLElement;
  width?: number;
  height?: number;
  name?: string;
  theme?: 'light' | 'dark';
}

export class Editor {
  constructor(options: EditorOptions);
  fileName: string;
  zoom: number;
  theme: 'light' | 'dark';
  pageIndex: number;
  uploads: { id: string; src: string; name: string }[];
  doc: DesignDocument;

  on(event: string, handler: (payload: any) => void): () => void;
  off(event: string, handler: (payload: any) => void): void;

  getJSON(): DesignDocument;
  loadJSON(doc: DesignDocument): void;
  applyTemplate(tpl: { name: string; page: DesignPage }): void;

  getElements(): DesignElement[];
  getSelected(): DesignElement[];
  select(ids: string[]): void;
  selectAll(): void;
  clearSelection(): void;

  addElement(props: Partial<DesignElement>): DesignElement;
  addText(props?: Partial<DesignElement>): DesignElement;
  updateSelected(props: Partial<DesignElement>, commit?: boolean): void;
  deleteSelected(): void;
  duplicateSelected(): void;
  copy(): void;
  cut(): void;
  paste(): void;
  bringToFront(): void;
  bringForward(): void;
  sendBackward(): void;
  sendToBack(): void;
  toggleLock(): void;
  setBackground(bg: PageBackground): void;

  setZoom(zoom: number, anchor?: { x: number; y: number }): void;
  zoomFit(): void;

  addPage(): void;
  duplicatePage(): void;
  deletePage(index?: number): void;
  goToPage(index: number): void;
  movePage(from: number, to: number): void;

  undo(): void;
  redo(): void;
  commit(): void;

  exportImage(format?: 'png' | 'jpeg', opts?: { scale?: number; transparent?: boolean; pageIndex?: number }): Promise<string>;
  exportAllPages(format?: 'png' | 'jpeg', opts?: { scale?: number }): Promise<void>;
  downloadJSON(): void;

  setFileName(name: string): void;
  setTheme(theme: 'light' | 'dark'): void;
  toggleTheme(): void;
  addUpload(file: File): Promise<string>;
  openFilePicker(): void;
  destroy(): void;
}

export declare const version: string;
export declare function autoInit(): void;
export default { Editor, version };
