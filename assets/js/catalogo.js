/* ==========================================================================
   EXXOMAX - Catalogo: buscador, filtros, orden y paginacion
   ========================================================================== */
(function () {
  "use strict";

  var normalizar = window.EXXOMAX_normalizar;
  var enlaceWa = window.EXXOMAX_waEnlace;
  var ico = window.EXXOMAX_ico || function () { return ""; };
  var E = window.EXXOMAX_EMPRESA || {};

  var TODOS = [];
  var CATEGORIAS = [];
  var MARCAS = [];

  var porPagina = 24;
  var pagina = 1;
  var vista = { q: "", cat: "", marca: "", orden: "nombre" };
  var resultados = [];

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* ------------------------------------------------------------- seguridad */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* --------------------------------------------------------------- busqueda */

  /* Valor centinela para la opcion "Sin marca": 194 de los 1.081 productos no
     tienen marca y antes quedaban inalcanzables al elegir cualquier marca. */
  var SIN_MARCA = "__sin_marca__";

  /* Aviso vigente cuando la combinacion categoria+marca no tiene interseccion */
  var aviso = null;

  function coincide(p, cat, marca, q) {
    if (cat && p.g !== cat) return false;
    if (marca) {
      if (marca === SIN_MARCA) { if (p.b) return false; }
      else if (p.b !== marca) return false;
    }
    if (q && p.q.indexOf(q) === -1) return false;
    return true;
  }

  function filtrarCon(cat, marca, q) {
    var salida = [];
    for (var i = 0; i < TODOS.length; i++) {
      if (coincide(TODOS[i], cat, marca, q)) salida.push(TODOS[i]);
    }
    return salida;
  }

  function contarCon(cat, marca, q) {
    var n = 0;
    for (var i = 0; i < TODOS.length; i++) {
      if (coincide(TODOS[i], cat, marca, q)) n++;
    }
    return n;
  }

  function normalizarQ() { return vista.q ? normalizar(vista.q) : ""; }

  function filtrar() {
    return filtrarCon(vista.cat, vista.marca, normalizarQ());
  }

  function ordenar(lista) {
    var l = lista.slice();
    if (vista.orden === "nombre") {
      l.sort(function (a, b) { return a.n.localeCompare(b.n, "es"); });
    } else if (vista.orden === "marca") {
      l.sort(function (a, b) {
        return a.b === b.b ? a.n.localeCompare(b.n, "es") : a.b.localeCompare(b.b, "es");
      });
    } else if (vista.orden === "codigo") {
      l.sort(function (a, b) { return a.c.localeCompare(b.c); });
    } else if (vista.orden === "confoto") {
      l.sort(function (a, b) {
        if (!!a.i === !!b.i) return a.n.localeCompare(b.n, "es");
        return a.i ? -1 : 1;
      });
    }
    return l;
  }

  /* ------------------------------------------------------------- plantilla */

  function tarjeta(p) {
    var foto = p.i
      ? '<img src="assets/img/productos/' + esc(p.i) + '" alt="' + esc(p.n) + '" loading="lazy" decoding="async" width="250" height="250">'
      : "";
    var pres = p.p ? '<span class="producto-pres">' + esc(p.p) + "</span>" : "<span></span>";
    var marca = p.b ? '<span class="producto-marca">' + esc(p.b) + "</span>" : "<span></span>";
    var cat = "";
    for (var k = 0; k < CATEGORIAS.length; k++) {
      if (CATEGORIAS[k].id === p.g) { cat = CATEGORIAS[k].nombre; break; }
    }
    var msg = "Hola EXXOMAX, consulto por el producto " + p.c + " (" + p.n + ")";
    return '<article class="producto">' +
      '<div class="producto-foto' + (p.i ? "" : " sin-foto") + '" role="img" aria-label="' + esc(p.n) + '">' +
      foto + (cat ? '<span class="producto-tag">' + esc(cat) + "</span>" : "") + "</div>" +
      '<div class="producto-cuerpo">' +
      '<div class="producto-codigo">' + esc(p.c) + "</div>" +
      '<h3 class="producto-nombre">' + esc(p.n) + "</h3>" +
      '<div class="producto-meta">' + marca + pres + "</div>" +
      '<a class="producto-wa" href="' + esc(enlaceWa(msg)) + '" data-wa-producto="' + esc(p.c) + '">' +
      ico("i-whatsapp", "ico-sm") + "Consultar</a>" +
      "</div></article>";
  }

  function pintarPaginacion(total) {
    var paginas = Math.ceil(total / porPagina);
    if (paginas <= 1) { $("#paginacion").innerHTML = ""; return; }
    var h = '<button type="button" data-pg="' + (pagina - 1) + '"' + (pagina === 1 ? " disabled" : "") + ' aria-label="Anterior">‹</button>';
    var desde = Math.max(1, pagina - 2);
    var hasta = Math.min(paginas, desde + 4);
    desde = Math.max(1, hasta - 4);
    for (var i = desde; i <= hasta; i++) {
      h += '<button type="button" data-pg="' + i + '"' + (i === pagina ? ' class="on" aria-current="page"' : "") + ">" + i + "</button>";
    }
    h += '<button type="button" data-pg="' + (pagina + 1) + '"' + (pagina === paginas ? " disabled" : "") + ' aria-label="Siguiente">›</button>';
    $("#paginacion").innerHTML = h;
  }

  function pintarChips() {
    var cont = $("#chips-activos");
    var chips = [];
    if (vista.q) chips.push({ k: "q", t: '“' + vista.q + '”' });
    if (vista.cat) chips.push({ k: "cat", t: nombreCategoria(vista.cat) });
    if (vista.marca) chips.push({ k: "marca", t: textoMarca(vista.marca) });
    if (!chips.length) { cont.innerHTML = ""; return; }
    cont.innerHTML = chips.map(function (c) {
      return '<span class="chip">' + esc(c.t) + '<button type="button" data-quitar="' + c.k + '" aria-label="Quitar filtro">×</button></span>';
    }).join("") + '<button type="button" class="btn btn-sm btn-borde" data-limpiar-todo>Limpiar todo</button>';
  }

  /* Nombre legible de la marca activa (incluye el caso "Sin marca") */
  function textoMarca(m) {
    return m === SIN_MARCA ? "Sin marca" : m;
  }

  function nombreCategoria(id) {
    var c = CATEGORIAS.filter(function (x) { return x.id === id; })[0];
    return c ? c.nombre : id;
  }

  /* Cuando categoria y marca no tienen nada en comun no se muestra un muro
     vacio: se muestra el filtro mas amplio (el que mas productos aporta) y se
     explica cual se esta aplicando, con un boton para quitar el otro. */
  function resolverAviso() {
    aviso = null;
    var q = normalizarQ();
    if (!vista.cat || !vista.marca) return filtrarCon(vista.cat, vista.marca, q);
    var base = filtrarCon(vista.cat, vista.marca, q);
    if (base.length) return base;

    var nCat = contarCon(vista.cat, "", q);
    var nMarca = contarCon("", vista.marca, q);

    if (nMarca >= nCat && nMarca > 0) {
      aviso = { aplica: "marca", otro: "cat", n: nMarca };
      return filtrarCon("", vista.marca, q);
    }
    if (nCat > 0) {
      aviso = { aplica: "cat", otro: "marca", n: nCat };
      return filtrarCon(vista.cat, "", q);
    }
    return base;
  }

  function pintarAviso() {
    var cont = $("#aviso-filtros");
    if (!cont) return;
    if (!aviso) { cont.hidden = true; cont.innerHTML = ""; return; }

    var aplica = aviso.aplica === "marca" ? textoMarca(vista.marca) : nombreCategoria(vista.cat);
    var otro = aviso.otro === "marca" ? textoMarca(vista.marca) : nombreCategoria(vista.cat);
    var aplicaMarca = aviso.aplica === "marca";

    cont.innerHTML =
      '<span class="ico-aviso">' + ico("i-reloj", "") + "</span>" +
      "<div><b>No hay productos que cumplan los dos filtros a la vez.</b> " +
      "Estás viendo los de <b>" + esc(aplica) + "</b> (" + aviso.n.toLocaleString("es-VE") + ")." +
      '<div class="acciones">' +
      '<button type="button" class="btn-mini" data-quitar-filtro="' + aviso.otro + '">' +
      "Quitar el filtro de " + esc(aplicaMarca ? "categoría" : "marca") + "</button>" +
      '<button type="button" class="btn-mini" data-quitar-filtro="__todos__">Quitar los dos</button>' +
      "</div></div>";
    cont.hidden = false;
  }

  function render() {
    var cont = $("#rejilla");
    resultados = ordenar(resolverAviso());

    var desde = (pagina - 1) * porPagina;
    var lote = resultados.slice(desde, desde + porPagina);

    $("#cuenta").innerHTML = resultados.length === TODOS.length
      ? "<b>" + TODOS.length.toLocaleString("es-VE") + "</b> productos en el catálogo"
      : "<b>" + resultados.length.toLocaleString("es-VE") + "</b> de " + TODOS.length.toLocaleString("es-VE") + " productos";

    pintarChips();
    pintarAviso();

    if (!lote.length) {
      cont.innerHTML = '<div class="vacio" style="grid-column:1/-1">' +
        '<div class="icono-grande">' + ico("i-buscar", "ico-lg") + "</div>" +
        "<h3>Sin resultados</h3><p>No encontramos productos con esa búsqueda. Prueba con menos palabras o escríbenos para cotizar.</p>" +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
        '<button type="button" class="btn btn-borde" data-limpiar-todo>Limpiar filtros</button>' +
        '<a class="btn btn-primario" href="contacto.html">Consultar disponibilidad</a></div></div>';
      $("#paginacion").innerHTML = "";
      return;
    }

    cont.innerHTML = lote.map(tarjeta).join("");
    pintarPaginacion(resultados.length);
  }

  /* --------------------------------------------------------------- filtros */

  /* Las listas se construyen una sola vez y despues solo se actualizan los
     contadores: rehacer el <select> en cada pulsacion lo cerraria mientras se
     esta usando. Cada contador respeta el OTRO filtro activo, asi se ve de
     antemano que una combinacion no existe en vez de descubrirlo al aplicarla. */
  function pintarFiltros() {
    var cont = $("#filtro-categorias");
    cont.innerHTML = CATEGORIAS.map(function (c) {
      return '<li><button type="button" data-cat="' + esc(c.id) + '">' +
        '<span>' + esc(c.nombre) + '</span><span class="n">0</span></button></li>';
    }).join("");

    var sel = $("#filtro-marca");
    sel.innerHTML = '<option value="">Todas las marcas</option>' +
      MARCAS.map(function (m) {
        return '<option value="' + esc(m.n) + '">' + esc(m.n) + " (0)</option>";
      }).join("") +
      '<option value="' + SIN_MARCA + '" class="sinmarca">Sin marca (0)</option>';

    actualizarContadores();
  }

  function actualizarContadores() {
    var q = normalizarQ();

    $$("#filtro-categorias button").forEach(function (b) {
      var id = b.getAttribute("data-cat");
      var n = contarCon(id, vista.marca, q);
      b.querySelector(".n").textContent = n.toLocaleString("es-VE");
      b.classList.toggle("sin-datos", n === 0);
    });

    Array.prototype.forEach.call($("#filtro-marca").options, function (op) {
      var v = op.value;
      if (!v) return;
      var n = contarCon(vista.cat, v, q);
      var base = v === SIN_MARCA ? "Sin marca" : v;
      op.textContent = base + " (" + n.toLocaleString("es-VE") + ")";
      op.classList.toggle("sin-datos", n === 0);
    });
  }

  function refrescarFiltros() {
    $$("#filtro-categorias button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-cat") === vista.cat);
    });
    $("#filtro-marca").value = vista.marca;
    actualizarContadores();
  }

  function aplicar() {
    pagina = 1;
    render();
    refrescarFiltros();
  }

  /* ----------------------------------------------------------------- init */

  function init() {
    if (!window.EXXOMAX_PRODUCTOS) {
      $("#rejilla").innerHTML = '<div class="cargando" style="grid-column:1/-1"><p>No se pudo cargar el catálogo.</p></div>';
      return;
    }
    TODOS = window.EXXOMAX_PRODUCTOS;
    CATEGORIAS = (window.EXXOMAX_CATEGORIAS || []).filter(function (c) { return c.total > 0; });
    MARCAS = (window.EXXOMAX_MARCAS || []).filter(function (m) { return m.n; });

    $("#total-catalogo").textContent = TODOS.length.toLocaleString("es-VE");

    /* parametros de URL: ?categoria=plomeria */
    var p = new URLSearchParams(location.search);
    if (p.get("categoria")) {
      var existe = CATEGORIAS.filter(function (c) { return c.id === p.get("categoria"); })[0];
      if (existe) vista.cat = existe.id;
    }
    if (p.get("q")) vista.q = p.get("q");
    $("#buscar").value = vista.q;

    pintarFiltros();
    aplicar();

    /* --- eventos --- */
    var t = null;
    $("#buscar").addEventListener("input", function (e) {
      var v = e.target.value;
      clearTimeout(t);
      t = setTimeout(function () { vista.q = v.trim(); aplicar(); }, 180);
    });

    $("#limpiar-busqueda").addEventListener("click", function () {
      $("#buscar").value = "";
      vista.q = "";
      aplicar();
      $("#buscar").focus();
    });

    $("#filtro-categorias").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-cat]");
      if (!b) return;
      vista.cat = vista.cat === b.getAttribute("data-cat") ? "" : b.getAttribute("data-cat");
      aplicar();
    });

    $("#filtro-marca").addEventListener("change", function (e) {
      vista.marca = e.target.value;
      aplicar();
    });

    $("#orden").addEventListener("change", function (e) {
      vista.orden = e.target.value;
      render();
    });

    $("#por-pagina").addEventListener("change", function (e) {
      porPagina = parseInt(e.target.value, 10) || 24;
      pagina = 1;
      render();
    });

    document.addEventListener("click", function (e) {
      var pg = e.target.closest("#paginacion button[data-pg]");
      if (pg && !pg.disabled) {
        pagina = parseInt(pg.getAttribute("data-pg"), 10);
        render();
        document.querySelector(".catalogo-cabecera").scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      var q = e.target.closest("[data-quitar]");
      if (q) {
        var k = q.getAttribute("data-quitar");
        vista[k] = k === "q" ? "" : "";
        if (k === "q") $("#buscar").value = "";
        aplicar();
        return;
      }
      /* botones del aviso: "Quitar el filtro de X" / "Quitar los dos" */
      var af = e.target.closest("[data-quitar-filtro]");
      if (af) {
        var cual = af.getAttribute("data-quitar-filtro");
        if (cual === "__todos__") {
          vista.cat = "";
          vista.marca = "";
        } else {
          vista[cual] = "";
        }
        aplicar();
        return;
      }
      if (e.target.closest("[data-limpiar-todo]")) {
        vista = { q: "", cat: "", marca: "", orden: vista.orden };
        $("#buscar").value = "";
        aplicar();
      }
    });

    /* --- plegar la barra de filtros en pantallas medias/pequenas --- */
    var btnFiltros = $("#toggle-filtros");
    var panelFiltros = $("#panel-filtros");
    if (btnFiltros && panelFiltros) {
      btnFiltros.addEventListener("click", function () {
        var plegado = panelFiltros.classList.toggle("plegado");
        btnFiltros.setAttribute("aria-expanded", plegado ? "false" : "true");
      });
      /* si al elegir un filtro el panel esta plegado, se abre para
         que el cliente vea que el filtro se aplico */
      panelFiltros.addEventListener("click", function (e) {
        if (e.target.closest("button[data-cat]") && panelFiltros.classList.contains("plegado")) {
          panelFiltros.classList.remove("plegado");
          btnFiltros.setAttribute("aria-expanded", "true");
        }
      });
    }

    /* atajo: "/" enfoca el buscador */
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        $("#buscar").focus();
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
