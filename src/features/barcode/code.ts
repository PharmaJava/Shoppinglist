/**
 * El número que hay debajo de las rayas.
 *
 * Un código de barras de producto es un GTIN: EAN-8, UPC-A (12), EAN-13 o
 * GTIN-14. Todos llevan un dígito de control al final que se calcula a partir
 * de los demás, y comprobarlo es lo que separa una lectura buena de una mala
 * —una cámara con poca luz devuelve dígitos de más o de menos, y sin esta
 * comprobación se acabaría preguntando por productos que no existen.
 */

const LONGITUDES = [8, 12, 13, 14];

/** Deja sólo dígitos: la gente teclea el código con espacios y guiones. */
export function normalizarCodigo(entrada: string): string {
  const digitos = entrada.replace(/\D/g, "");

  // Un UPC-A (12 dígitos, típico de producto americano) es el mismo código
  // que el EAN-13 que empieza por cero. Guardarlos igual evita tener el mismo
  // producto dos veces según con qué lector se leyera.
  return digitos.length === 12 ? `0${digitos}` : digitos;
}

/**
 * El dígito de control de un código **sin** su último dígito.
 *
 * De derecha a izquierda, pesos 3 y 1 alternos; el control es lo que falta
 * para llegar a la decena. Vale para las cuatro longitudes.
 */
export function digitoDeControl(sinControl: string): number {
  let suma = 0;
  let peso = 3;

  for (let i = sinControl.length - 1; i >= 0; i--) {
    suma += Number(sinControl[i]) * peso;
    peso = peso === 3 ? 1 : 3;
  }

  return (10 - (suma % 10)) % 10;
}

export function esCodigoValido(code: string): boolean {
  if (!/^\d+$/.test(code) || !LONGITUDES.includes(code.length)) return false;

  return digitoDeControl(code.slice(0, -1)) === Number(code.at(-1));
}
