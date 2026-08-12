/**
 * Pegar una lista de varias líneas en un campo de una sola.
 *
 * El parser ya entiende los saltos de línea, pero un `<input>` no: al pegar,
 * el navegador se los come y deja «Agua Gazpacho Chocolate» pegado. Y no vale
 * cambiarlo por un `<textarea>`, porque entonces Intro escribe una línea en
 * vez de crear la lista, que es el gesto que hace todo el mundo.
 *
 * Así que se interceptan los saltos y se convierten en comas, que es lo que el
 * campo sí sabe enseñar y el parser sabe separar. De paso se ve lo que se va a
 * crear antes de crearlo.
 */
export function flattenPastedList(pasted: string): string {
  return pasted
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s ]*[-–—*•·+]+\s*/, "").trim())
    .filter(Boolean)
    .join(", ");
}

export function hasLineBreaks(text: string): boolean {
  return /\r?\n/.test(text);
}

/**
 * Valor resultante de pegar `pasted` sobre la selección actual del campo.
 *
 * Devuelve `null` cuando no hay nada que arreglar —un pegado de una sola
 * línea— para dejar que el navegador haga lo suyo, que incluye el deshacer
 * nativo y la posición del cursor.
 */
export function valueAfterPaste(
  current: string,
  selectionStart: number,
  selectionEnd: number,
  pasted: string,
): string | null {
  if (!hasLineBreaks(pasted)) return null;

  const flattened = flattenPastedList(pasted);
  if (!flattened) return null;

  const before = current.slice(0, selectionStart);
  const after = current.slice(selectionEnd);

  // Si ya había algo escrito y no acaba en separador, se añade uno: pegar una
  // lista detrás de «pan» no debe producir «panagua».
  const needsSeparator = before.trim() !== "" && !/[,;]\s*$/.test(before);

  return `${before}${needsSeparator ? ", " : ""}${flattened}${after}`;
}
