/**
 * Tipos mínimos de la Barcode Detection API, que no está en lib.dom.d.ts.
 * Sólo lo que usa src/features/barcode/use-barcode-scanner.ts.
 *
 * La implementan Chrome y Edge en Android y escritorio. Safari **no**, ni en
 * iOS ni en Mac: de ahí que la interfaz tenga que funcionar sin ella (ver
 * docs/15-CODIGOS.md).
 */
interface DetectedBarcode {
  rawValue: string;
  format: string;
}

interface BarcodeDetectorOptions {
  formats?: string[];
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  static getSupportedFormats(): Promise<string[]>;
  detect(source: CanvasImageSource | Blob | ImageData): Promise<DetectedBarcode[]>;
}

interface Window {
  BarcodeDetector?: typeof BarcodeDetector;
}
