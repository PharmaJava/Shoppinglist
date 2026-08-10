# Estrategia SEO e internacionalización

## 0. La tesis

La aplicación es privada y no se indexa. Lo que posiciona es un **catálogo de plantillas y guías**
que responde a lo que la gente busca de verdad, y que convierte a lista real en un clic.

El embudo es literalmente este:

```
Búsqueda «lista de la compra semanal para 4 personas»
   └─► /es/plantillas/lista-compra-semanal-4-personas   (SSG, indexable, contenido útil)
        └─► botón «Usar esta plantilla»                 (crea la lista al instante, sin registro)
             └─► compartir por WhatsApp                 (viralidad: cada visita SEO trae 1-3 más)
                  └─► uso recurrente → cuenta → premium
```

La página de plantilla no es una landing con un botón: **es la lista**, ya escrita y ordenada por
pasillo, con contenido que aporta valor por sí mismo. Google premia esa utilidad y el usuario
convierte porque no hay salto entre lo que buscaba y lo que recibe.

---

## 1. Arquitectura de URLs

```
/                              → 307 según Accept-Language + cookie
/es                            Landing ES
/en                            Landing EN
/es/plantillas                 Hub de plantillas (página pilar)
/es/plantillas/[slug]          Plantilla individual        ← motor de SEO programático
/es/guias                      Hub de guías
/es/guias/[slug]               Guía / artículo
/es/precios                    Precios
/es/legal/{privacidad,terminos,cookies}
/en/templates, /en/guides, /en/pricing, /en/legal/...

/l/[listId]                    Lista compartida            ← noindex, sin prefijo de idioma
/i/[token]                     Aceptar invitación          ← noindex
/es/app                        Dashboard                   ← noindex
```

Decisiones y su motivo:

- **Prefijo de idioma siempre**, también en español. Si el idioma por defecto vive además en la
  raíz se generan dos URLs con el mismo contenido; es la causa más habitual de canibalización en
  sitios bilingües.
- **Slugs traducidos y nativos**: `/es/plantillas/...` y `/en/templates/...`. Nunca `/en/plantillas/`.
  El slug es una señal de relevancia y además de calidad percibida.
- **`/l/[listId]` corto y sin idioma**: el enlace se pega en WhatsApp, donde cada carácter cuenta,
  y la lista no tiene idioma propio.
- La redirección de `/` es **307, no 301**: la elección de idioma depende de la petición y no debe
  quedar cacheada por el navegador. `x-default` apunta a `/en`.

---

## 2. Implementación técnica

### 2.1 Metadatos y hreflang

```ts
// src/app/[locale]/plantillas/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const { locale, slug } = await params
  const t = await getTemplate(locale, slug)
  const path = locale === 'es' ? `/es/plantillas/${slug}` : `/en/templates/${t.slugEn}`

  return {
    title: t.metaTitle,                    // ≤ 60 caracteres
    description: t.metaDescription,        // 140-155 caracteres
    alternates: {
      canonical: `${SITE_URL}${path}`,     // autorreferencial, absoluto
      languages: {
        'es-ES': `${SITE_URL}/es/plantillas/${t.slugEs}`,
        'en-US': `${SITE_URL}/en/templates/${t.slugEn}`,
        'x-default': `${SITE_URL}/en/templates/${t.slugEn}`,
      },
    },
    openGraph: { type: 'website', locale, images: [`${SITE_URL}/api/og?t=${slug}`] },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
  }
}
```

Reglas que se verifican en CI (un test recorre el sitemap y comprueba cada una):

- **hreflang bidireccional**: si ES apunta a EN, EN debe apuntar a ES. Los reenvíos unidireccionales
  se ignoran silenciosamente, y es el error más frecuente en sitios multiidioma.
- Toda página se **autorreferencia** en `hreflang` y en `canonical`.
- Canónicas siempre absolutas y con el dominio de producción (variable de entorno, nunca literal).
- Las rutas de la app llevan `robots: { index: false, follow: false }` **y** cabecera
  `X-Robots-Tag: noindex` desde el middleware, por si alguna se renderiza fuera del árbol previsto.

### 2.2 Datos estructurados (JSON-LD)

| Página | Schema |
|---|---|
| Landing | `SoftwareApplication` (categoría `ShoppingApplication`, `offers` con precio 0) + `Organization` + `WebSite` con `SearchAction` |
| Plantilla | `ItemList` con los productos + `HowTo` («cómo usar esta lista») + `BreadcrumbList` |
| Guía | `Article` con `author`, `datePublished`, `dateModified` + `BreadcrumbList` |
| Precios | `Product` con `AggregateOffer` |
| FAQ (en landing y guías) | `FAQPage` |

`AggregateRating` **sólo cuando existan valoraciones reales y visibles en la página**. Inventarlas
es motivo de acción manual por spam de datos estructurados; no compensa jamás.

### 2.3 Sitemaps

`app/sitemap.ts` genera un índice y sitemaps por idioma, con `<xhtml:link>` alternos por entrada.
`lastmod` real, tomado de la fecha de modificación del contenido — no `new Date()`, que es lo que
todo el mundo hace mal y hace que Google deje de fiarse de la señal.

Contenido: landings, hubs, plantillas, guías, precios y legal. **Nunca** rutas `noindex`.

### 2.4 robots.txt

```
User-agent: *
Allow: /
Disallow: /l/
Disallow: /i/
Disallow: /api/
Disallow: /*/app

Sitemap: https://<dominio>/sitemap.xml
```

### 2.5 Core Web Vitals — presupuesto bloqueante en CI

| Métrica | Objetivo (p75, móvil) |
|---|---|
| LCP | < 1,8 s |
| INP | < 200 ms |
| CLS | < 0,05 |
| TTFB | < 400 ms |
| JS inicial en landing | < 120 KB comprimido |

Cómo se consigue:

- Landing y plantillas en SSG puro: HTML servido desde CDN, cero JS bloqueante.
- `next/font` con fuente variable *self-hosted* y `font-display: swap`. Nada de Google Fonts
  externo (latencia + señal de privacidad).
- Imágenes en AVIF/WebP con `width`/`height` explícitos. El *hero* con `priority`, el resto en
  *lazy*.
- Reservar altura de todo bloque dinámico (banner de cookies incluido — es la causa número uno de
  CLS en sitios europeos).
- Componentes de servidor por defecto; `'use client'` sólo donde hay interacción real.
- Lighthouse CI en cada PR: si el presupuesto se rompe, la PR no se mergea.

---

## 3. Investigación de palabras clave

Volúmenes orientativos (España / EE. UU.-Reino Unido); validar con datos reales antes de la Fase 1.

### Español — intención transaccional (prioridad máxima)

| Palabra clave | Intención | Página destino |
|---|---|---|
| lista de la compra | genérica alta | `/es` |
| lista de la compra online | herramienta | `/es` |
| lista de la compra compartida | **nuestra cuña** | `/es` + guía |
| app lista de la compra | comparación | `/es` + guía |
| hacer lista de la compra online gratis | transaccional | `/es` |
| compartir lista de la compra familia | **nuestra cuña** | guía |

### Español — intención informativa (el volumen largo)

`lista de la compra semanal`, `lista de la compra saludable`, `lista de la compra para 2 / 4 personas`,
`lista de la compra básica`, `lista de la compra mensual`, `lista compra keto / vegana / sin gluten`,
`lista de la compra barata`, `qué comprar en el supermercado`, `lista de despensa básica`,
`menú semanal y lista de la compra`, `lista compra bebé / fiesta / navidad / barbacoa`.

### Inglés

`shopping list app`, `shared shopping list`, `grocery list app free`, `online grocery list`,
`weekly grocery list`, `grocery list for two`, `healthy grocery list`, `keto grocery list`,
`pantry staples list`, `grocery list template`, `family shopping list app`.

### Nota sobre marcas de supermercados

Existe volumen alto en `lista compra Mercadona`, `Lidl`, `Carrefour`, `Walmart`, `Tesco`, `Aldi`.
Es una oportunidad real, con una condición: **uso descriptivo, nunca sugiriendo afiliación**.
«Lista de la compra para Mercadona (plantilla gratis)» es legítimo; usar su logotipo, su tipografía
o dar a entender colaboración no lo es. Revisión legal antes de publicar este cluster, y disclaimer
visible de no afiliación.

---

## 4. Arquitectura de contenidos

### 4.1 Clusters temáticos

Cada cluster tiene una **página pilar** que enlaza a sus hijas, y cada hija devuelve el enlace a la
pilar. Es lo que consolida la autoridad temática.

```
PILAR: /es/plantillas  «Plantillas de lista de la compra»
  ├── lista-compra-semanal
  ├── lista-compra-semanal-4-personas
  ├── lista-compra-mensual
  ├── lista-compra-basica-despensa
  ├── lista-compra-saludable
  ├── lista-compra-keto / vegana / sin-gluten / mediterranea
  ├── lista-compra-barata-bajo-presupuesto
  ├── lista-compra-navidad / barbacoa / cumpleanos
  └── lista-compra-bebe / universitario / camping

PILAR: /es/guias  «Cómo organizar la compra»
  ├── como-hacer-la-lista-de-la-compra
  ├── como-compartir-la-lista-con-la-familia   ← alineada con el producto
  ├── menu-semanal-y-lista-de-la-compra
  ├── ahorrar-en-la-compra-del-supermercado
  ├── organizar-la-compra-por-pasillos
  └── mejores-apps-de-lista-de-la-compra       ← comparativa honesta, incluida la competencia
```

Objetivo Fase 1: **20 plantillas + 5 guías por idioma**. Fase 4: 100+ por idioma.

### 4.2 Anatomía de una página de plantilla

1. `H1` con la palabra clave exacta.
2. **La lista real, visible e interactiva** (agrupada por pasillo). Es el contenido, no un adorno.
3. CTA principal: «Usar esta plantilla» → crea la lista y lleva a `/l/[id]`.
4. 300-600 palabras de contenido genuinamente útil: para cuántas personas, presupuesto estimado,
   consejos de conservación, sustituciones.
5. FAQ (3-5 preguntas) con `FAQPage`.
6. Enlaces internos: pilar, 3-4 plantillas relacionadas, 1 guía.
7. Descarga en PDF (imán de enlaces y de tráfico desde Pinterest).

**Regla anti-*thin content***: cada plantilla se escribe una a una, con datos y criterio propios.
Generar 300 páginas iguales cambiando el número de comensales es exactamente lo que penalizan las
actualizaciones de contenido útil. Si una plantilla no aporta algo que no esté en las demás, no se
publica.

### 4.3 ES ≠ EN traducido

Las guías se escriben **nativas** por mercado. En España se compra varias veces por semana, en
tiendas más pequeñas y con productos distintos; en EE. UU. la compra es semanal, en grandes
superficies y con otro vocabulario (`grocery`, no `shopping`, en muchas consultas). Traducir
literalmente produce contenido que no responde a la búsqueda local y no posiciona.

---

## 5. E-E-A-T y autoridad

- **Autores reales**, con página de autor, biografía y enlaces. Nada de «Equipo de redacción».
- Página «Sobre nosotros» con personas, empresa e historia.
- `dateModified` real y actualizaciones periódicas del contenido con más tráfico.
- Fuentes citadas cuando se den datos (precio medio de la cesta, INE, Eurostat).
- Contacto visible y política de privacidad clara: señales de confianza que Google evalúa.

### Adquisición de enlaces (por orden de rentabilidad)

1. **Herramientas gratuitas enlazables**: generador de lista imprimible, calculadora de presupuesto
   semanal, planificador de menú. Las herramientas atraen enlaces; los artículos, mucho menos.
2. **Plantillas en PDF** descargables → Pinterest, blogs de familia y organización del hogar.
3. **Digital PR con datos propios**: cuando haya volumen, publicar un estudio anonimizado
   («los 20 productos más olvidados de la lista de la compra»). Es contenido que la prensa cita.
4. Lanzamiento en Product Hunt, Hacker News, r/SideProject.
5. Comunidades donde el problema es real: foros de familias, r/mealprep, r/EatCheapAndHealthy —
   participando, no promocionando.
6. Menciones sin enlace de la marca → petición de enlace.

---

## 6. Optimización de conversión

El SEO trae la visita; esto la convierte.

- **Sin muro de registro. En ningún punto del embudo del invitado.** Cada paso previo a la lista
  cuesta entre un 20 % y un 40 % de conversión.
- «Usar esta plantilla» crea la lista **en menos de un segundo**, con el alta anónima ya hecha en
  segundo plano al cargar la página.
- El botón de compartir aparece en cuanto hay 3 productos: es el momento de máxima intención.
- Prompt de instalación de la PWA en la **segunda** visita, nunca en la primera.
- Invitación a registrarse sólo cuando ya hay valor acumulado («guarda tus 3 listas»), y siempre
  descartable.

---

## 7. Medición

- **Google Search Console** por propiedad de dominio, con seguimiento separado por carpeta de idioma.
- **Bing Webmaster Tools** (importa cada vez más como fuente de datos de LLMs).
- Rastreo de posiciones para 50 palabras clave prioritarias por idioma.
- Panel mensual: impresiones, clics, CTR y posición media por cluster; activación por página de
  aterrizaje; K viral por origen.
- **Auditoría técnica trimestral**: rastreo completo, enlaces rotos, huérfanas, hreflang, Core Web
  Vitals de campo (CrUX, no sólo laboratorio).

---

## 8. Lista de verificación previa al lanzamiento

- [ ] Dominio definitivo decidido y HTTPS con redirección canónica (con y sin `www`)
- [ ] `hreflang` bidireccional verificado en todas las plantillas (test automático)
- [ ] Canónicas autorreferenciales y absolutas
- [ ] Sitemap index + sitemap por idioma, con `lastmod` real
- [ ] `robots.txt` correcto y rutas de app con `noindex` + `X-Robots-Tag`
- [ ] JSON-LD validado con la herramienta de resultados enriquecidos
- [ ] Core Web Vitals dentro de presupuesto en móvil 4G
- [ ] Imágenes OG generadas y verificadas en WhatsApp, X y Facebook
- [ ] 20 plantillas + 5 guías publicadas por idioma
- [ ] Search Console y Bing verificados, sitemap enviado
- [ ] Página 404 útil, con enlaces al hub y al buscador
- [ ] Sin `noindex` heredado del entorno de preview (error clásico: los *previews* de Vercel deben
      llevar `noindex` y producción **no**)
