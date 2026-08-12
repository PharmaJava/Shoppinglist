import datos from "./ios-splash.json";

export interface SplashDevice {
  ancho: number;
  alto: number;
  dpr: number;
  modelo: string;
}

export const IOS_SPLASH_DEVICES: SplashDevice[] = datos.dispositivos;

export function splashPath({ ancho, alto, dpr }: SplashDevice): string {
  return `/splash/${ancho}x${alto}@${dpr}x.png`;
}

/**
 * Las pantallas de arranque de iOS.
 *
 * Sin ellas, tocar el icono de una PWA en el iPhone deja un rectángulo blanco
 * hasta que carga la app: la diferencia más visible entre «esto es una web con
 * un icono» y «esto es una app». Safari no escala nada: elige la imagen cuya
 * media query encaja **exactamente** con el dispositivo, y si no encaja
 * ninguna vuelve al blanco. De ahí la lista literal de `ios-splash.json`.
 *
 * Sólo vertical, que es como está declarada la app en el manifest.
 */
export function iosStartupImages(): Array<{ url: string; media: string }> {
  return IOS_SPLASH_DEVICES.map((dispositivo) => ({
    url: splashPath(dispositivo),
    media:
      `(device-width: ${dispositivo.ancho}px) and (device-height: ${dispositivo.alto}px) ` +
      `and (-webkit-device-pixel-ratio: ${dispositivo.dpr}) and (orientation: portrait)`,
  }));
}
