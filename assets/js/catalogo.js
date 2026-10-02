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

  function filtrar() {
    var q = vista.q ? normalizar(vista.q) : "";
    var salida = [];
    for (var i = 0; i < TODOS.length; i++) {
      var p = TODOS[i];
      if (vista.cat && p.g !== vista.cat) continue;
      if (vista.marca && p.b !== vista.marca) continue;
      if (q && p.q.indexOf(q) === -1) continue;
      salida.push(p);
    }
    return salida;
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
    if (vista.cat) {
      var c = CATEGORIAS.filter(function (x) { return x.id === vista.cat; })[0];
      chips.push({ k: "cat", t: c ? c.nombre : vista.cat });
    }
    if (vista.marca) chips.push({ k: "marca", t: vista.marca });
    if (!chips.length) { cont.innerHTML = ""; return; }
    cont.innerHTML = chips.map(function (c) {
      return '<span class="chip">' + esc(c.t) + '<button type="button" data-quitar="' + c.k + '" aria-label="Quitar filtro">×</button></span>';
    }).join("") + '<button type="button" class="btn btn-sm btn-borde" data-limpiar-todo>Limpiar todo</button>';
  }

  function render() {
    var cont = $("#rejilla");
    resultados = ordenar(filtrar());

    var desde = (pagina - 1) * porPagina;
    var lote = resultados.slice(desde, desde + porPagina);

    $("#cuenta").innerHTML = resultados.length === TODOS.length
      ? "<b>" + TODOS.length.toLocaleString("es-VE") + "</b> productos en el catálogo"
      : "<b>" + resultados.length.toLocaleString("es-VE") + "</b> de " + TODOS.length.toLocaleString("es-VE") + " productos";

    pintarChips();

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

  function pintarFiltros() {
    var cont = $("#filtro-categorias");
    cont.innerHTML = CATEGORIAS.map(function (c) {
      return '<li><button type="button" data-cat="' + esc(c.id) + '">' +
        '<span>' + esc(c.nombre) + '</span><span class="n">' + c.total + "</span></button></li>";
    }).join("");

    var sel = $("#filtro-marca");
    sel.innerHTML = '<option value="">Todas las marcas</option>' +
      MARCAS.map(function (m) {
        return '<option value="' + esc(m.n) + '">' + esc(m.n) + " (" + m.t + ")</option>";
      }).join("");
  }

  function refrescarFiltros() {
    $$("#filtro-categorias button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-cat") === vista.cat);
    });
    $("#filtro-marca").value = vista.marca;
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
