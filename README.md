# Mapa de gasolineras más baratas de España

Mapa interactivo, sin nada alrededor — pensado para embeber en el cuerpo de
una noticia (iframe) o para visitarlo directo. Muestra las 10 estaciones más
baratas de cada comunidad autónoma (17 + Ceuta y Melilla), con un selector
de combustible flotando arriba a la izquierda. Cada popup muestra los 4
precios (95, 98, Diésel, Diésel Premium) de esa estación.

Datos oficiales del Ministerio para la Transición Ecológica (MITECO).

## Subir a GitHub / desplegar en Vercel

Igual que siempre:

```bash
cd gasolineras-mvp
git init
git add .
git commit -m "Mapa embebible por comunidad"
git branch -M main
git remote add origin <URL_DE_TU_REPO>
git push -u origin main
```

En Vercel: importar el repo, framework Next.js (se detecta solo), deploy.
Sin variables de entorno.

## Embeber en la noticia

Una vez desplegado, en el cuerpo de la noticia:

```html
<iframe
  src="https://tu-proyecto.vercel.app"
  width="100%"
  height="600"
  style="border:0;"
  loading="lazy"
></iframe>
```

## Si alguna comunidad sigue sin aparecer (modo diagnóstico)

La clasificación por comunidad autónoma usa dos vías: primero el código
oficial `IDCCAA` que trae el propio dato de MITECO, y si eso falla, el
nombre de la provincia por texto. Debería cubrir las 19, pero por si acaso
dejé un modo de diagnóstico:

Abrí en el navegador:
`https://tu-proyecto.vercel.app/api/precios-por-comunidad?debug=1`

Te va a devolver un JSON con:
- `conteoPorComunidad`: cuántas estaciones cayeron en cada comunidad
  (si "Otras" tiene un número alto, hay estaciones sin clasificar)
- `muestraSinClasificar`: ejemplos reales de estaciones que no se pudieron
  ubicar, con su `Provincia` e `IDCCAA` tal como los da la API

Pasame ese JSON (o el bloque `muestraSinClasificar` y `conteoPorComunidad`)
y ajusto el mapeo en `lib/miteco.js` con el dato real en vez de a ciegas —
hasta ahora no pude probar contra la API real de MITECO porque el entorno
donde yo escribo el código no tiene salida a dominios del Gobierno, así que
este es el primer contacto real con el formato exacto de sus datos.

## Fuente de datos

https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/

Dato público oficial (Real Decreto 4/2013), sin API key ni autenticación.
