/* ==========================================================================
   EXXOMAX C.A. - Datos de la empresa, zonas y vendedores
   --------------------------------------------------------------------------
   ESTE ES EL UNICO ARCHIVO QUE NECESITAS EDITAR para actualizar los datos
   de contacto, el WhatsApp principal y la lista de vendedores.
   ========================================================================== */

/* ---------------------------------------------------------------- empresa -- */
window.EXXOMAX_EMPRESA = {
  nombre: "EXXOMAX C.A.",
  rif: "J504831298",
  giro: "Importación y distribución de materiales de ferretería",

  direccion: "Av. Principal, Local Nro 0-0, Urb. José Félix Rivas, Sector Plata II",
  ciudad: "Valera",
  estado: "Trujillo",
  zip: "3101",
  pais: "Venezuela",

  /* ----------------------------------------------------------------------
     PENDIENTE: reemplaza estos datos por los reales de la empresa.
     mientras CONTACTO_PENDIENTE sea true, los botones de WhatsApp del sitio
     llevan a la pagina de contacto en vez de enviar a un numero equivocado.
     ---------------------------------------------------------------------- */
  CONTACTO_PENDIENTE: true,
  whatsapp: "584120000000",        // <-- numero de WhatsApp de la empresa
  telefono: "",                    // <-- telefono fijo
  email: "",                       // <-- correo de contacto
  instagram: "",
  facebook: "",
  linkedin: "",

  horario: "Lunes a viernes, 8:00 am - 5:00 pm",
  registro: "Inscrita en el SENIAT el 16/01/2024",
};

/* ------------------------------------------------------------------ zonas -- */
/* cobertura de despacho declarada por la empresa */
window.EXXOMAX_ZONAS = [
  {
    id: "trujillo",
    nombre: "Trujillo",
    capital: "Valera",
    coords: [9.3178, -70.6027],
    radio: 90000,
    desc: "Sede principal y despacho en todo el estado. Zona núcleo de nuestra operación.",
    rutas: "Valera · Boconó · Trujillo · Urdaneta · Carache",
  },
  {
    id: "tachira",
    nombre: "Táchira",
    capital: "San Cristóbal",
    coords: [7.7669, -72.2250],
    radio: 85000,
    desc: "Rutas de despacho activas hacia San Cristóbal y el resto del estado.",
    rutas: "San Cristóbal · Cúcuta · Colón · Ayacucho",
  },
  {
    id: "merida",
    nombre: "Mérida",
    capital: "Mérida",
    coords: [8.5975, -71.1450],
    radio: 85000,
    desc: "Cobertura en la capital y municipios metropolitanos del estado.",
    rutas: "Mérida · Libertador · Sucre · Campo Mara",
  },
  {
    id: "zulia",
    nombre: "Zulia",
    capital: "Maracaibo",
    coords: [10.6427, -71.6125],
    radio: 95000,
    desc: "Despachos programados hacia la región occidental del país.",
    rutas: "Maracaibo · Machiques · Catatumbo · Colón",
  },
];

/* -------------------------------------------------------------- vendedores -- */
window.EXXOMAX_VENDEDORES = [
  { nombre: "Ricardo Enrique Briceño Valero",  tel: "0426-6706262" },
  { nombre: "Ricardo Yunot Rosillo Duarte",      tel: "0424-7159335" },
  { nombre: "Robert Rodolfo Pacheco Uzcátegui",  tel: "0414-3508167" },
  { nombre: "Naudy Antonio Vegas",               tel: "0412-8252959" },
  { nombre: "Jesús Alberto Bastidas Briceno",    tel: "0424-7528411" },
  { nombre: "Evelin Osneidy Valero Perez",       tel: "0412-6838908" },
  { nombre: "Eusebio Antonio García Justo",      tel: "0412-7647611" },
  { nombre: "Gerardo José Peña Bandre",          tel: "0424-2190011" },
  { nombre: "Fernando Rafael Alvarado Colmenarez", tel: "0414-5069858" },
  { nombre: "Alirio Jesus Pineda Hernandez",     tel: "0424-7263106" },
  { nombre: "Carmen Valero",                     tel: "0414-7266782" },
  { nombre: "Evelyn Quintero",                   tel: "0412-0210032" },
];

/* ------------------------------------------------------------- categorias -- */
/* icono: id del sprite en assets/js/iconos.js
   imagen: foto real del catalogo que representa la categoria */
window.EXXOMAX_CATEGORIAS_INFO = [
  { id: "electrica",    nombre: "Herramientas Eléctricas",    icono: "i-electrica",    imagen: "1333.jpg",
    resumen: "Taladros, sierras, pulidoras y equipos de potencia." },
  { id: "manuales",     nombre: "Herramientas Manuales",      icono: "i-manuales",     imagen: "1479.jpg",
    resumen: "Llaves, alicates, destornilladores y herramienta de mano." },
  { id: "abrasivos",    nombre: "Abrasivos y Discos",         icono: "i-abrasivos",    imagen: "166.jpg",
    resumen: "Discos de corte y diamantados, lijas y mechas." },
  { id: "tornilleria",  nombre: "Tornillería y Fijación",      icono: "i-tornilleria",  imagen: "1889.jpg",
    resumen: "Tornillería, anclajes, remaches y accesorios." },
  { id: "plomeria",     nombre: "Plomería y Tuberías",        icono: "i-plomeria",     imagen: "1819.jpg",
    resumen: "Tubos, mangueras, válvulas y conexiones CPVC." },
  { id: "banos",        nombre: "Baños y Cocina",             icono: "i-banos",        imagen: "1673.jpg",
    resumen: "Grifería, lavamanos, duchas y accesorios." },
  { id: "cerrajeria",   nombre: "Cerrajería y Cerraduras",    icono: "i-cerrajeria",   imagen: "400.jpg",
    resumen: "Cerraduras, candados, bisagras y herrajes." },
  { id: "electricidad", nombre: "Electricidad e Iluminación",  icono: "i-electricidad", imagen: "796.jpg",
    resumen: "Cables, lámparas, tomacorrientes y tableros." },
  { id: "pinturas",     nombre: "Pinturas y Barnices",       icono: "i-pinturas",     imagen: "1923.jpg",
    resumen: "Pinturas, barnices, rodillos y solventes." },
  { id: "adhesivos",    nombre: "Adhesivos y Selladores",     icono: "i-adhesivos",    imagen: "274.jpg",
    resumen: "Pegamentos, siliconas, cementos y selladores." },
  { id: "seguridad",    nombre: "Seguridad Industrial",       icono: "i-seguridad",    imagen: "1857.jpg",
    resumen: "Protección ocular, guantes, cascos y EPI." },
  { id: "jardin",       nombre: "Jardinería y Riego",         icono: "i-jardin",       imagen: "1971.jpg",
    resumen: "Riego, machetes, mecates y herramientas de jardín." },
  { id: "construccion", nombre: "Materiales de Construcción",  icono: "i-construccion", imagen: "1559.jpg",
    resumen: "Mallas, cementos y materiales de obra." },
  { id: "ferreteria",   nombre: "Ferretería y Embalaje",      icono: "i-ferreteria",   imagen: "238.jpg",
    resumen: "Cintas, empaques, embalajes y accesorios varios." },
];

/* ------------------------------------------------------------------ hero -- */
/* base de las fotos del catalogo que usa el portafolio de categorias */
window.EXXOMAX_HERO = {
  base: "assets/img/productos/",
};

/* --------------------------------------------------------------- marcas -- */
/* El catalogo en PDF no incluye los logotipos de las marcas: solo el texto y
   fotos de producto. Mientras no haya archivo, la pagina dibuja cada marca con
   su wordmark (nombre con estilo propio) en la banda animada y en las fichas.
   Si consigues el logo oficial, dejalo aqui con el nombre exacto (todo en
   mayusculas) y se usara como imagen. */
window.EXXOMAX_LOGOS_MARCAS = {
  MEGAPRO: "",           /* assets/img/marcas/megapro.png */
  GREENPRO: "",
  EXXEL: "",
};

/* ------------------------------------------------------------- metricas -- */
window.EXXOMAX_METRICAS = [
  { valor: "1.081", label: "productos en catálogo" },
  { valor: "293",  label: "productos marca propia MEGAPRO" },
  { valor: "4",    label: "estados con despacho" },
  { valor: "12",   label: "vendedores en la zona" },
];
