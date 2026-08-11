# Tests end-to-end

```bash
pnpm e2e            # compila, arranca el servidor y ejecuta todo
pnpm e2e --ui       # modo interactivo
```

Se ejecutan contra el **servidor de producción**, no el de desarrollo: buena
parte de lo que se comprueba —metadatos, `hreflang`, sitemap, hoja de
impresión— sale del build, y en `next dev` no siempre coincide. Playwright lo
levanta solo (ver `playwright.config.ts`).

Dos proyectos, móvil y escritorio, porque los fallos que hemos tenido de
verdad eran de móvil: el campo de la portada aplastado a 21 px y las secciones
escondidas sin menú.

## Qué cubren y qué no

Cubren **lo que no necesita sesión**: portada, menú, cambio de idioma, 404,
hubs y fichas de contenido, `hreflang` bidireccional, datos estructurados,
sitemap, `robots.txt`, `noindex` en las listas compartidas y la hoja de
impresión.

**No cubren los flujos con lista real** —crear, tiempo real entre dos
navegadores, offline y reenvío del outbox—, que son justo los que más valdría
la pena automatizar. Necesitan un proyecto de Supabase de pruebas con su
propia base: hacerlo contra producción llenaría la base real de listas de
test, y contra un proyecto compartido los tests se pisarían entre ellos.

Cuando exista ese proyecto, basta con darle a Playwright
`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` de pruebas: la
configuración ya los toma del entorno si están, y sólo cae en los valores de
ejemplo cuando no. Los tests nuevos irían en `e2e/lista.spec.ts`.

## En el CI

Se ejecutan en cada PR después de los tests unitarios, con el navegador ya
instalado en la imagen. Si uno falla, el informe de Playwright queda en los
artefactos de la ejecución.
