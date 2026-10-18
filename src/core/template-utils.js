// One schema for built-ins, host options, plugin registration and application.
export function templatePages(template) {
  const invalid = () => new Error('ezyreka: templates need { name, page } or { name, pages: [...] }, with valid page dimensions and elements');
  if (!template || typeof template !== 'object' || typeof template.name !== 'string' || !template.name.trim()) throw invalid();
  const single = template.page !== undefined;
  const multiple = template.pages !== undefined;
  if (single === multiple || (multiple && (!Array.isArray(template.pages) || !template.pages.length))) throw invalid();
  const pages = single ? [template.page] : template.pages;
  for (const page of pages) {
    if (!page || typeof page !== 'object' ||
        ![page.width, page.height].every(value => Number.isInteger(value) && value >= 1 && value <= 10000) ||
        !Array.isArray(page.elements)) throw invalid();
    for (const element of page.elements) {
      if (!element || typeof element !== 'object' || Array.isArray(element) ||
          typeof element.type !== 'string' || !element.type.trim()) throw invalid();
      for (const key of ['x', 'y', 'w', 'h', 'rotation', 'opacity']) {
        if (element[key] !== undefined && !Number.isFinite(element[key])) throw invalid();
      }
      if (element.w < 0 || element.h < 0) throw invalid();
    }
  }
  return pages;
}
