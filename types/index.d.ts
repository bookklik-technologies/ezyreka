export as namespace Ezyreka;

export type ChartType = 'bar' | 'row' | 'grouped-bar' | 'line' | 'multi-line' | 'pie' | 'donut' | 'area' | 'stacked-area';

export interface ChartSeries {
  name: string;
  values: (number | null)[];
  color?: string;
}

export interface ChartData {
  categories: string[];
  series: ChartSeries[];
}

export interface ChartConfig extends ChartData {
  type: ChartType;
  categoryColors?: string[];
  title?: string;
  showLegend?: boolean;
  showValues?: boolean;
  showAxes?: boolean;
  showGrid?: boolean;
  fontSize?: number;
  textColor?: string;
}

export interface GradientStop {
  color: string;
  /** Position along the gradient, 0–1. */
  offset: number;
}

export interface GradientFill {
  type: 'gradient';
  from?: string;
  to?: string;
  /** Multi-stop gradient; when present it overrides from/to. */
  stops?: GradientStop[];
  /** Degrees clockwise from left-to-right (0); defaults to 135. */
  angle?: number;
}

export type PaletteEntry = string | { label: string; colors: string[] };

export interface HistoryLike {
  push(snapshot: unknown): void;
  undo(current: unknown): unknown;
  redo(current: unknown): unknown;
  reset(): void;
  canUndo?(): boolean;
  canRedo?(): boolean;
}

export interface DesignElement {
  id?: string;
  type: 'text' | 'rect' | 'ellipse' | 'triangle' | 'star' | 'hexagon' | 'diamond' | 'heart' | 'line' | 'image' | 'icon' | 'shape' | 'chart';
  chart?: ChartConfig;
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
  fill?: string | GradientFill;
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

export interface EditorTemplate {
  name: string;
  category?: string;
  format?: string;
  page: DesignPage;
}

export interface EditorOptions {
  target: string | HTMLElement;
  width?: number;
  height?: number;
  name?: string;
  theme?: 'light' | 'dark';
  /** Additional templates shown in the Templates panel after the built-ins. */
  templates?: EditorTemplate[];
  /** Extra font family names offered in the font pickers. */
  fonts?: string[];
  /** Extra Google Fonts css2 family specs, e.g. "Familia:wght@400;700". */
  googleFonts?: string[];
  /** Replaces the default color swatches for this editor; entries are hex strings or { label, colors } groups. */
  palette?: PaletteEntry[];
  /** Replaces the default gradient presets for this editor. */
  gradients?: { from: string; to: string; angle?: number }[];
  /** Replaces the default chart series colors (applies to all editors on the page). */
  chartColors?: string[];
  /** Design document to load during initialization. */
  initialDoc?: DesignDocument;
  /** Image source providers shown in the Uploads panel. */
  imageSources?: ImageSource[];
  /** Injects a custom history strategy implementing the snapshot interface. */
  history?: HistoryLike;
  /** Named custom themes (CSS variable sets) usable via `theme` and setTheme(). */
  themes?: Record<string, Record<string, string>>;
  /** CSS custom properties applied to the editor container on top of the theme. */
  cssVars?: Record<string, string>;
  /**
   * UI module configuration. `false` runs headless (canvas API only);
   * set a module key to `false` to disable it, or to a constructor to
   * replace it (each module is instantiated with the editor).
   */
  ui?: boolean | Partial<Record<'topbar' | 'sidepanel' | 'toolbar' | 'contextMenu' | 'pagesBar', false | (new (editor: Editor) => unknown)>>;
}

export interface ImageSource {
  id: string;
  label?: string;
  /** Returns image items for a search query; called debounced and on panel open. */
  search(query: string): Promise<{ src: string; name?: string; thumb?: string }[]> | { src: string; name?: string; thumb?: string }[];
}

export interface PanelDefinition {
  id: string;
  label?: string;
  /** SVG markup for the tool rail icon; defaults to the shapes icon. */
  icon?: string;
  render(contentEl: HTMLElement, editor: Editor): void;
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
  /** Move a layer by element-array index (0 is the backmost layer). */
  moveLayer(from: number, to: number): void;
  toggleLock(): void;
  /** Resize the current page; dimensions are whole pixels from 1 to 10000. */
  resizeCanvas(width: number, height: number): void;
  setBackground(bg: PageBackground, commit?: boolean): void;

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

  // Customization: register assets on this editor's registries.
  registerTemplates(templates: EditorTemplate | EditorTemplate[]): void;
  /** Registers a font family; pass `{ google: "Familia:wght@400;700" }` (or a css2 spec string, or `true`) to load it from Google Fonts. */
  registerFont(name: string, opts?: { google?: string | boolean }): string;
  /** Registers icons as 24×24 viewBox path data: `{ name: 'M…' }` or `{ name: { solid: 'M…', outline: 'M…' } }`. */
  registerIcons(icons: Record<string, string | { solid: string; outline?: string }>): void;
  /** Registers Elements-panel entries; `path` is 0–100 viewBox geometry rendered as a vector shape. */
  registerShapes(shapes: { label: string; type?: string; props?: Partial<DesignElement>; svg?: string; path?: string; shape?: string } | { label: string; type?: string; props?: Partial<DesignElement>; svg?: string; path?: string; shape?: string }[]): void;

  // Customization: extend rendering, panels and image sources.
  /** Overrides or adds the canvas renderer for an element type: fn(ctx, el, registry). */
  registerElementRenderer(type: string, renderer: (ctx: CanvasRenderingContext2D, el: DesignElement, registry: unknown) => void): void;
  /** Registers a brand-new element type: `{ defaults, manifest, render }`. */
  registerElementType(type: string, def?: { defaults?: Record<string, unknown>; manifest?: Record<string, unknown>; render?: (ctx: CanvasRenderingContext2D, el: DesignElement, registry: unknown) => void }): void;
  /** Extends or overrides an element type's capability manifest (name, layerIcon, edit, toolbar, hitTest…). */
  registerElementManifest(type: string, manifest: Record<string, unknown>): void;
  /** Overrides or adds the painter for a chart type: fn(ctx, chart, series, plotBox, font, bounds). */
  registerChartRenderer(type: string, renderer: (ctx: CanvasRenderingContext2D, chart: ChartConfig, series: ChartSeries[], plotBox: { x: number; y: number; w: number; h: number }, font: number, bounds: { w: number; h: number; top: number; bottom: number }) => void): void;
  /** Registers a brand-new chart type from a preset ({ type, label, group, kind, circular, multiSeries, validate }) plus an optional painter. */
  registerChartType(preset: { type: string; label: string; group?: string; kind?: string; circular?: boolean; multiSeries?: boolean; horizontal?: boolean; validate?: (chart: ChartConfig) => void }, renderFn?: Parameters<Editor['registerChartRenderer']>[1]): void;
  /** Replaces this editor's color swatches; entries are hex strings or { label, colors } groups. */
  registerPalette(palette: PaletteEntry[]): void;
  /** Registers a named theme from CSS custom properties, usable via setTheme(). */
  registerTheme(name: string, vars: Record<string, string>): string;
  /** Registers a background type painter: fn(ctx, bg, pageWidth, pageHeight). */
  registerBackgroundPainter(type: string, painter: (ctx: CanvasRenderingContext2D, bg: PageBackground, pw: number, ph: number) => void): void;
  /** Adds a sidebar tab: `{ id, label, icon, render(contentEl, editor) }`. */
  registerPanel(panel: PanelDefinition): void;
  /** Registers an existing image (URL or data URL) into the uploads library. */
  registerImage(image: string | { src: string; name?: string }): { id: string; src: string; name: string };
  /** Adds an image source provider to the Uploads panel. */
  registerImageSource(source: ImageSource): ImageSource;
}

export declare const version: string;
export declare function autoInit(): void;
export default { Editor, version };
