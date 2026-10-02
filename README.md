# EXXOMAX C.A. — sitio web

Sitio corporativo de EXXOMAX C.A., empresa de importación y distribución de
materiales de ferretería. HTML, CSS y JavaScript estáticos: no requiere base de
datos, ni instalación, ni build.

## Cómo abrirlo

Con XAMPP funcionando, la dirección es:

    http://localhost/exxomax/

Para verlo en otro equipo de la red local, usa la IP de la máquina que tiene
XAMPP: `http://192.168.x.x/exxomax/`

También funciona abriendo `index.html` con doble clic, aunque el buscador del
catálogo usa JavaScript y funciona igual (sólo algunos navegadores bloquean
`fetch` en archivos locales; en ese caso usa el servidor de Apache).

## Estructura

    index.html          Portada: hero centrado con métricas animadas,
                        carrusel de marcas, alianza, misión/visión, objetivos,
                        portafolio de categorías con foto, fichas de marcas,
                        proceso con fotos, cobertura, CTA
    nosotros.html       Historia, alianza Hierromax, misión, visión, objetivos,
                        compromisos y proceso con fotos
    catalogo.html       1.081 productos con buscador, filtros y paginación
    cobertura.html      Mapa de zonas + cartera de vendedores
    contacto.html       Datos de la empresa, formulario y vendedores

    data/
      empresa.js        ⭐ EDITAR AQUÍ: teléfono, WhatsApp, correo, redes,
                        zonas, vendedores, categorías (icono + foto),
                        base de fotos y logos de marca
      productos.js      Catálogo completo (generado, no editar a mano)
      categorias.js     Categorías y totales (generado)
      marcas.js         Marcas y su número de productos (generado)
      productos.json    Datos crudos del catálogo (generado)

    assets/
      css/estilos.css   Sistema de diseño completo + animaciones
      js/app.js         Cabecera, menú, animaciones, carrusel de marcas,
                        contadores y datos comunes
      js/iconos.js      Sprite SVG (40 iconos de interfaz y categorías)
      js/catalogo.js    Buscador, filtros, orden y paginación
      js/mapa.js        Mapa de cobertura (Leaflet + OpenStreetMap)
      js/contacto.js    Formulario de cotización
      img/logo.svg      Logotipo (editable: es código, no imagen)
      img/productos/    Fotos de producto, 500×500 px (1.023 con foto)
      img/marcas/       (opcional) logotipos oficiales de marca

    tools/              Scripts de extracción del catálogo original

## Lo que hay que actualizar

Sólo un archivo: **`data/empresa.js`**. Ahí están el WhatsApp, el teléfono, el
correo, las redes sociales, las zonas de despacho y los vendedores.

Mientras `CONTACTO_PENDIENTE: true` esté así, los botones de WhatsApp llevan a
la página de contacto en lugar de enviar mensajes a un número equivocado. Cuando
tengas el número real:

1. Ponlo en `whatsapp: "584121234567"` (formato internacional, sin `+`).
2. Cambia `CONTACTO_PENDIENTE: false`.
3. Listo: todos los botones de WhatsApp del sitio ya funcionan.

Lo mismo con `telefono`, `email`, `instagram`, `facebook` y `linkedin`: rellena
lo que tengas y quita lo que no, en ese mismo archivo.

### Logotipo

El logotipo está recreado en SVG, no es una imagen: `assets/img/logo.svg`
(cabecera) y `assets/img/logo-blanco.svg` (pie de página, versión en blanco).
Si más adelante tienes el logo original en PNG o SVG, reemplaza esos dos
archivos y el `favicon.svg` respetando la misma proporción.

### Iconos y fotos

El sitio no usa emojis: todos los símbolos son iconos SVG del sprite
`assets/js/iconos.js`, que se inyecta al cargar cada página. Para añadir uno
nuevo, se agrega un `<symbol id="i-…">` ahí y se usa con
`<svg class="ico"><use href="#i-…"></use></svg>`.

Las fotos del portafolio de categorías y del proceso están en `data/empresa.js`
(`imagen` de cada categoría, `foto` de cada paso); la carpeta de la que salen es
`EXXOMAX_HERO.base`. Las fotos de producto están en `assets/img/productos/` con
el nombre del código (`.jpg`).

### Logos de marca

El PDF no traía los logotipos, así que cada marca se dibuja con su nombre en un
wordmark con estilo propio (6 variantes que se reparten por ranking). Si
consigues los logos oficiales:

1. Crea `assets/img/marcas/` y guarda cada uno, p. ej. `MEGAPRO.svg`.
2. Decláralos en `data/empresa.js`:

       window.EXXOMAX_LOGOS_MARCAS = { "MEGAPRO": "assets/img/marcas/MEGAPRO.svg" };

3. Se usan solos en el carrusel y en las fichas del portafolio, y la marca
   propia (MEGAPRO) se resalta sobre fondo verde.
4. Las marcas sin logo declarado siguen mostrando su wordmark; basta con quitar
   la línea del mapa para volver atrás.

## El catálogo

`data/productos.js` contiene las 1.081 referencias con su código, marca,
presentación, foto y categoría. **No incluye precios**, porque el sitio es
público y cualquier número en un archivo descargable queda expuesto. Los
precios se cotizan por cantidad y zona, que es como trabaja la empresa.

Campos: `n` nombre · `c` código · `g` categoría · `b` marca · `p` presentación
· `i` imagen · `q` texto de búsqueda.

Buscar: escribe el nombre o el código (también funciona sin acentos, y con la
tecla `/` enfocas el buscador). En pantallas de tablet y móvil la barra de
filtros se pliega detrás del botón "Filtros" para que los productos se vean de
inmediato.

### Regenerar el catálogo desde el PDF

Si cambia el catálogo de Excel/PDF, vuelve a generar los datos:

    py tools\extract_catalog.py      # lee el PDF -> productos.json + fotos crudas
    py tools\optimize_images.py      # redimensiona las fotos con ffmpeg
    py tools\build_site_data.py      # productos.json -> productos.js, categorías y marcas

`tools\optimize_images.py` necesita [ffmpeg](https://ffmpeg.org/) en el PATH.
Los dos primeros scripts usan sólo la librería estándar de Python.

El informe `tools\reporte.txt` resume cuántas referencias se extrajeron, cuáles
quedaron sin foto y la distribución por categoría.

## Responsive

Probado en 18 anchos reales (320, 360, 375, 390, 414, 430, 480, 540, 600, 700,
768, 820, 900, 1024, 1180, 1280, 1440 y 1920 px) en las 5 páginas: 90 de 90
combinaciones sin desbordamiento horizontal y sin objetivos táctiles menores
de 30 px.

Puntos de corte, todos en `assets/css/estilos.css`:

| Ancho | Qué cambia |
|---|---|
| ≤ 1080 px | Los filtros pasan a bloque plegable, el hero a una columna, el mapa y las rejillas de 2 columnas |
| ≤ 860 px | El menú se convierte en hamburguesa, se apilan las rejillas de 3 columnas |
| ≤ 620 px | Una sola columna, cabecera más compacta, tarjetas de producto más pequeñas y botones táctiles más grandes |

## Mapa

Usa Leaflet con teselas de OpenStreetMap: no necesita clave de API ni registro,
y no cuesta nada. Si insertas un dominio, considera añadir un proveedor de
teselas con clave propia o el mapa quedará sujeto al uso justo de OSM.

## Colores

| Uso | Color |
|---|---|
| Verde principal | `#00a63e` |
| Verde oscuro | `#00752c` |
| Verde acento | `#7bc043` |
| Verde muy claro | `#eefaf2` |
| Texto | `#0f2419` |
| Gris | `#5f7168` |

Se cambian todos desde las variables de `:root` en `assets/css/estilos.css`.

## Verificación

Controles pasados sobre las 5 páginas (escritorio 1280 px y móvil 390 px):

- 0 errores de consola, 0 peticiones fallidas, 0 imágenes rotas.
- 0 desbordamiento horizontal en ningún ancho; menú hamburguesa con 5 enlaces.
- Todas las animaciones de entrada terminan visibles (sin secciones ocultas).
- Sin emojis: todos los símbolos son iconos SVG del sprite.
- Catálogo: búsqueda por nombre/código/con tilde, filtros combinados, orden,
  paginación y atajo `/`.
- Formulario: validación de nombre, teléfono y mensaje; prellenado del código
  de producto cuando llega desde el catálogo.

### Animaciones

Comprobado con medición de `layout-shift` del navegador:

- **CLS = 0** durante la carga y durante todo el recorrido de scroll (el título
  mide igual antes y después de que JS envuelva las palabras).
- **Carrusel de marcas sin salto**: el desfase de la vuelta era de 7 px
  porque el `gap` de la pista descolocaba `translateX(-50%)`; el espaciado va
  ahora en `margin-right` de cada tarjeta (salto medido: 0 px). Las dos filas
  corren en sentidos opuestos.
- **Entradas al scroll**: cada bloque se anima sólo cuando ya cruzó 64 px el
  borde inferior de la pantalla (medido: 0 entradas antes de cruzar; antes
  había bloques revelándose con 0-2 % visibles).
- La pista de marcas arranca pausada y corre cuando la banda entra en pantalla;
  con `prefers-reduced-motion` activado todo queda estático.

## Datos fiscales

EXXOMAX C.A. · RIF J504831298 · Gerencia Regional de Tributos Internos,
estado Trujillo. Inscrita en el SENIAT el 16/01/2024.
