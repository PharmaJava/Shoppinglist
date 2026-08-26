# Consentimiento y medición

Lo primero, porque decide todo lo demás: **esta web casi no guarda nada en el
dispositivo, y lo poco que guarda casi todo hace falta.** El aviso que sale al
entrar no es un trámite copiado de otra web: es la consecuencia de haber
mirado qué se guarda de verdad.

---

## 1. Qué se guarda, y qué se pregunta

| Qué | Dónde | Para qué | ¿Se pregunta? |
|---|---|---|---|
| Sesión de Supabase | Cookie | Es la cuenta. Sin ella ninguna lista es tuya | **No** |
| `NEXT_LOCALE` | Cookie | El idioma en que se enseña la web | **No** |
| Listas y cola de cambios | IndexedDB | Que la lista sirva dentro del súper sin cobertura | **No** |
| Contador de visitas | localStorage | Ofrecer instalar la app en la 2ª visita y no volver a insistir | **No** |
| Medición de Vercel | — (nada) | Cuánta gente entra y si la web va lenta | **Sí** |
| Google Analytics | Cookies `_ga` | Estadísticas de uso | **Sí**, y sólo si está configurado |

Las cuatro primeras son **estrictamente necesarias** y por eso no se piden a
votación: la ley no exige consentimiento para lo que hace falta para dar el
servicio que la persona ha pedido, y preguntarlo igualmente sólo entrena a la
gente a pulsar «aceptar» sin leer.

**La de Vercel no usa cookies ni guarda nada en el dispositivo.** Se pregunta
igual por un motivo concreto: porque se puede apagar de verdad. Un interruptor
que no apaga nada es peor que no tener interruptor.

## 2. Las reglas que se cumplen, y dónde

| Regla | Dónde vive |
|---|---|
| Nada que no sea necesario se carga antes de contestar | `Measurement`: los componentes no se montan sin permiso |
| Negarse cuesta lo mismo que aceptar | Los dos botones, mismo tamaño y misma pantalla — hay un test |
| Consentimiento granular por finalidad | El panel de «Elegir», una casilla por cosa |
| Nada marcado de fábrica | `fromChoices`: lo que no se marca queda denegado |
| Se puede retirar tan fácil como se dio | Enlace en el pie de **todas** las páginas |
| Se puede demostrar qué se consintió y cuándo | `decidedAt` + `version` guardados con la respuesta |

Y una que no es regla pero debería: **no bloquea la web**. Se puede escribir la
primera lista sin contestar. Un aviso que secuestra la pantalla es un aviso que
se acepta sin leer, y entonces el consentimiento no vale nada aunque el papel
diga que sí.

## 3. Encender Google Analytics

Está escrito por adelantado y apagado, igual que se hizo con el cobro de la
Fase 3. Para encenderlo:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX   # Vercel → Environment Variables
```

Y redesplegar, que las `NEXT_PUBLIC_*` se incrustan al construir. Eso es todo:
no hay que tocar el aviso, ni el panel, ni la política.

**Qué pasa solo al ponerla:**

1. En el aviso aparece **una segunda casilla**, la de Google, con su propia
   explicación —«usa cookies»— separada de la de Vercel. Quien quiera puede
   decir que sí a una y que no a la otra.
2. **Se vuelve a preguntar a todo el mundo.** Y no porque nadie suba un número
   a mano: `parseConsent` descarta cualquier respuesta guardada que no cubra
   todas las categorías que hoy se preguntan, y hasta ayer nadie vio la de
   Google. Nadie ha dado permiso para algo que no se le llegó a enseñar.
3. El script de `gtag` sólo se carga cuando esa casilla está marcada.

### Consent Mode v2

Aunque Google Analytics no llega a cargarse sin permiso, cuando se carga se
declara el estado del consentimiento como Google espera del tráfico europeo:

```js
gtag('consent', 'default', {
  ad_storage: 'denied', ad_user_data: 'denied',
  ad_personalization: 'denied', analytics_storage: 'denied'
});
gtag('consent', 'update', { analytics_storage: 'granted' });
```

Los tres de publicidad se quedan **denegados siempre**, con permiso o sin él,
porque esta web no hace publicidad ni cede datos para anuncios. Si algún día
eso cambiara, cambiarlo aquí sería lo de menos: haría falta una categoría
nueva en el aviso y reescribir la política, porque sería otra cosa distinta.

### Lo que hay que actualizar a mano el día que se encienda

El código se adapta solo; la **política de privacidad no**. Hay que añadir a
`src/content/legal/{es,en}.ts`:

- Google (Google Ireland Ltd.) en la lista de con quién se comparten los datos.
- Las cookies concretas: `_ga` (2 años) y `_ga_<ID>` (2 años), su finalidad y
  que son de Google.
- La transferencia internacional de datos a EE. UU. y su base legal.

Nada de eso lo puede inventar el código, y publicar una política que no nombra
a Google mientras Google recibe datos es exactamente el tipo de cosa por la
que se multa.

## 4. Añadir cualquier otra herramienta

El sitio a tocar es uno: `src/features/consent/categories.ts`. Se añade la
categoría a `ConsentCategory` y a `ASKED_CATEGORIES` —con su condición, si va
detrás de una variable—, sus dos textos (`<categoría>Title` y
`<categoría>Body`) en los mensajes, y el componente que la carga se envuelve
en `isGranted(consent, "<categoría>")`.

El aviso, el panel, el volver a preguntar y el enlace del pie salen solos.

## 5. Comprobado

Pruebas de componente (`src/features/consent`, `src/components/consent`): que
una respuesta incompleta o de otra versión se descarta; que lo no marcado
queda denegado; que `localStorage` bloqueado no tumba nada; que sin
identificador Google Analytics no se carga **ni con permiso**; y que con
identificador y permiso sale el `gtag` con el Consent Mode correcto.

Prueba de e2e (`e2e/consentimiento.spec.ts`), sobre el build de verdad: que el
aviso sale, que **no impide usar la web**, que la respuesta sobrevive a una
recarga, que el pie deja volver a decidir, que lo imprescindible se explica
pero no se puede desmarcar, y la que sostiene todo lo demás — que tras decir
que no **no sale ni una petición a `_vercel/insights`**. Si eso se rompiera,
el aviso sería decorativo.
