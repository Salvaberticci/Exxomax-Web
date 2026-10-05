/* ==========================================================================
   EXXOMAX - Comportamiento compartido del sitio
   ========================================================================== */
(function () {
  "use strict";

  var E = window.EXXOMAX_EMPRESA || {};

  /* ------------------------------------------------------------ utilidades */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /** Quita acentos y pasa a minusculas, para busquedas tolerantes. */
  function normalizar(s) {
    return (s || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  /** Numero telefonico venezolano -> formato internacional para wa.me */
  function numeroWa(tel) {
    var d = (tel || "").replace(/[^\d]/g, "");
    if (!d) return "";
    if (d.length === 11 && d[0] === "0") d = d.slice(1);
    return "58" + d;
  }

  /**
   * Enlace de WhatsApp. Mientras CONTACTO_PENDIENTE este en true, los botones
   * llevan a la pagina de contacto para no enviar mensajes a un numero falso.
   */
  function enlaceWa(mensaje) {
    var texto = encodeURIComponent(mensaje || "Hola EXXOMAX, quiero información sobre sus productos.");
    if (E.CONTACTO_PENDIENTE || !E.whatsapp || E.whatsapp.indexOf("0000") > -1) {
      return "contacto.html";
    }
    return "https://wa.me/" + E.whatsapp + "?text=" + texto;
  }
  window.EXXOMAX_waEnlace = enlaceWa;
  window.EXXOMAX_numeroWa = numeroWa;
  window.EXXOMAX_normalizar = normalizar;
  window.EXXOMAX_ico = function (id, clase) {
    return '<svg class="' + (clase || "icono") + '" aria-hidden="true"><use href="#' + id + '"></use></svg>';
  };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ------------------------------------------------------------- cabecera */

  function menuMovil() {
    var btn = $(".menu-btn");
    var nav = $(".nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", function () {
      var abierto = nav.classList.toggle("abierto");
      btn.classList.toggle("abierto", abierto);
      btn.setAttribute("aria-expanded", abierto ? "true" : "false");
    });
    $$(".nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("abierto");
        btn.classList.remove("abierto");
        btn.setAttribute("aria-expanded", "false");
      });
    });
  }

  function sombraCabecera() {
    var h = $(".header");
    if (!h) return;
    function act() { h.classList.toggle("scroll", window.scrollY > 8); }
    act();
    window.addEventListener("scroll", act, { passive: true });
  }

  function marcarActivo() {
    var ruta = location.pathname.split("/").pop() || "index.html";
    $$(".nav a").forEach(function (a) {
      var destino = (a.getAttribute("href") || "").split("#")[0];
      if (destino && destino === ruta) a.classList.add("activo");
    });
  }

  /* ---------------------------------------------------- parallax general */

  function parallaxHerramientas() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var items = $$('[data-parallax], [data-parallax-hero]');
    if (!items.length) return;

    var ticking = false;

    function mover() {
      var wH = window.innerHeight;
      var scrollY = window.scrollY;

      items.forEach(function (el) {
        if (el.hasAttribute('data-parallax-hero')) {
          /* Para el hero: el origen es 0, así que usamos scrollY directo */
          var factor = parseFloat(el.getAttribute('data-parallax-hero')) || 0.15;
          var py = scrollY * factor;
          el.style.setProperty('--py', py.toFixed(2) + 'px');
        } else {
          /* Para el resto de la página: el origen es el centro de la pantalla */
          var parent = el.parentElement;
          var rect = parent.getBoundingClientRect();
          
          if (rect.top < wH && rect.bottom > 0) {
            var factor = parseFloat(el.getAttribute('data-parallax')) || 0.15;
            var dist = (rect.top + rect.height / 2) - (wH / 2);
            var py = dist * factor;
            el.style.setProperty('--py', py.toFixed(2) + 'px');
          }
        }
      });

      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(mover);
      }
    }, { passive: true });
    
    /* Disparo inicial */
    mover();
  }

  /* --------------------------------------------------- barra de progreso */

  function barraProgreso() {
    var barra = $("[data-progreso]");
    if (!barra) return;
    var relleno = barra.querySelector("i");
    if (!relleno) return;
    var ticking = false;
    function act() {
      var alto = document.documentElement.scrollHeight - window.innerHeight;
      var pct = alto > 0 ? (window.scrollY / alto) * 100 : 0;
      relleno.style.width = Math.min(100, Math.max(0, pct)) + "%";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(act); }
    }, { passive: true });
    window.addEventListener("resize", act);
    act();
  }

  /* ------------------------------------------------------------- reveals */

  function revelar() {
    var selectores = [
      ".revelar",
      ".revelar-izq",
      ".revelar-der",
      ".revelar-escala",
      ".revelar-blur",
      ".revelar-voltear"
    ];
    var nodos = $$(selectores.join(","));
    if (!nodos.length) return;

    /* Al mostrarse un bloque, sus titulos reciben .h2-brilo: el degradado
       animado se reproduce en ese momento y no al cargar la pagina. */
    function mostrar(n) {
      n.classList.add("visible");
      $$("h2", n).forEach(function (h) { h.classList.add("h2-brilo"); });
    }

    if (!("IntersectionObserver" in window)) {
      nodos.forEach(mostrar);
      return;
    }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          mostrar(e.target);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -12% 0px" });
    nodos.forEach(function (n) { obs.observe(n); });

    function barrer() {
      var limite = window.innerHeight - 64;
      nodos.forEach(function (n) {
        if (n.classList.contains("visible")) return;
        if (n.getBoundingClientRect().top < limite) {
          mostrar(n);
          obs.unobserve(n);
        }
      });
    }
    var t = null;
    window.addEventListener("scroll", function () {
      if (t) return;
      t = setTimeout(function () { t = null; barrer(); }, 140);
    }, { passive: true });
    window.addEventListener("load", barrer);
    window.addEventListener("resize", barrer);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) barrer();
    });
  }

  /* ----------------------------------------------- titulo palabra a palabra */

  /**
   * Envuelve cada palabra en un <span class="palabra"> animado.
   * Los elementos con estilo propio (por ejemplo el degradado del titulo) se
   * envuelven enteros en un unico <span>: animarlos a ellos seria imposible,
   * porque su regla de `animation` para el degradado gana en especificidad y
   * dejaria el `opacity: 0` inicial sin anularse nunca.
   */
  function revelarPalabras() {
    $$("[data-palabras]").forEach(function (h) {
      if (h.dataset.animado === "1") return;
      h.dataset.animado = "1";

      var nodos = Array.prototype.slice.call(h.childNodes);
      var i = 0;
      var frag = document.createDocumentFragment();

      function envolver(contenido, paso) {
        var s = document.createElement("span");
        s.className = "palabra";
        s.style.animationDelay = (0.06 * i + 0.1 + (paso || 0)).toFixed(2) + "s";
        s.appendChild(contenido);
        return s;
      }

      nodos.forEach(function (nodo) {
        if (nodo.nodeType === 3) {
          var fragTexto = document.createDocumentFragment();
          nodo.nodeValue.split(/(\s+)/).forEach(function (trozo) {
            if (!trozo) return;
            if (/^\s+$/.test(trozo)) {
              fragTexto.appendChild(document.createTextNode(trozo));
              return;
            }
            i++;
            var t = document.createElement("span");
            t.className = "palabra";
            t.style.animationDelay = (0.06 * i + 0.1).toFixed(2) + "s";
            t.textContent = trozo;
            fragTexto.appendChild(t);
          });
          frag.appendChild(fragTexto);
          return;
        }
        if (nodo.nodeType === 1) {
          i++;
          frag.appendChild(envolver(nodo.cloneNode(true), .12));
          return;
        }
        frag.appendChild(nodo);
      });

      h.innerHTML = "";
      h.appendChild(frag);
    });
  }

  /* --------------------------------------------------- contadores animados */

  function animarContadores() {
    var nodos = $$("[data-contar]");
    if (!nodos.length) return;
    var obs = ("IntersectionObserver" in window)
      ? new IntersectionObserver(function (e) {
          e.forEach(function (x) {
            if (!x.isIntersecting) return;
            obs.unobserve(x.target);
            contar(x.target);
          });
        }, { threshold: 0.4 })
      : null;

    function contar(n) {
      var bruto = n.getAttribute("data-contar");
      var solo = bruto.replace(/[^\d.,]/g, "");
      /* en espanol el punto es de miles: "1.081" son mil ochenta y uno, y
         parseFloat lo leeria como 1,081 y lo pintaria con coma */
      var esMiles = /^\d{1,3}(?:\.\d{3})+$/.test(solo);
      var limpio = esMiles ? solo.replace(/\./g, "") : solo;
      var destino = parseFloat(limpio);
      var prefijo = (bruto.match(/^[^\d]*/) || [""])[0];
      var sufijo = (bruto.match(/[^\d.]*$/) || [""])[0];
      var decimales = esMiles ? 0 : (limpio.split(".")[1] || "").length;
      var dur = 1400;
      var t0 = null;
      if (!("IntersectionObserver" in window) || destino === 0) {
        n.textContent = prefijo + destino.toFixed(decimales) + sufijo;
        return;
      }
      function paso(t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - k, 3);            /* salida suave */
        n.textContent = prefijo + (destino * e).toLocaleString("es-VE", {
          minimumFractionDigits: decimales,
          maximumFractionDigits: decimales,
        }) + sufijo;
        if (k < 1) window.requestAnimationFrame(paso);
      }
      window.requestAnimationFrame(paso);
    }

    nodos.forEach(function (n) {
      if (obs) obs.observe(n); else contar(n);
    });
  }

  /* --------------------------------------------------- datos en el DOM */

  function pintarMetricas() {
    var cont = $("[data-metricas]");
    if (!cont) return;
    cont.innerHTML = (window.EXXOMAX_METRICAS || []).map(function (x) {
      return '<div class="hero-stat"><b data-contar="' + x.valor + '">' + x.valor +
        '</b><span>' + x.label + "</span></div>";
    }).join("");
  }

  function pintarZonas() {
    var cont = $("[data-zonas]");
    if (!cont) return;
    cont.innerHTML = (window.EXXOMAX_ZONAS || []).map(function (x) {
      return '<article class="zona-card" data-zona="' + x.id + '" tabindex="0" role="button">' +
        '<h3><span class="pt">' + x.nombre.charAt(0) + "</span>" + x.nombre + "</h3>" +
        "<p>" + x.desc + "</p>" +
        '<div class="ruta">' + x.rutas + "</div>" +
        "</article>";
    }).join("");
  }

  function pintarVendedores() {
    var cont = $("[data-vendedores]");
    if (!cont) return;
    cont.innerHTML = (window.EXXOMAX_VENDEDORES || []).map(function (x) {
      var ini = x.nombre.split(" ").filter(function (p) { return p.length > 2; })[0] || x.nombre.charAt(0);
      var wa = "https://wa.me/" + numeroWa(x.tel);
      return '<article class="vendedor">' +
        '<div class="inicial">' + ini.charAt(0).toUpperCase() + "</div>" +
        '<div class="datos"><b>' + x.nombre + "</b>" +
        '<a href="' + wa + '" target="_blank" rel="noopener">' +
        window.EXXOMAX_ico("i-whatsapp", "ico-sm") + x.tel + "</a></div>" +
        '<a class="btn-wa" href="' + wa + '" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp a ' + x.nombre + '">' +
        window.EXXOMAX_ico("i-whatsapp", "") + "</a></article>";
    }).join("");
  }

  /* ------------------------------------------------------------ categorias */

  function pintarCategorias(destino, limite) {
    var cont = typeof destino === "string" ? $(destino) : destino;
    if (!cont) return;
    var cats = window.EXXOMAX_CATEGORIAS_INFO || [];
    var totales = {};
    (window.EXXOMAX_CATEGORIAS || []).forEach(function (t) { totales[t.id] = t.total; });
    var lista = limite ? cats.slice(0, limite) : cats;
    var base = (window.EXXOMAX_HERO || {}).base || "assets/img/productos/";

    cont.innerHTML = lista.map(function (c) {
      var n = totales[c.id] || 0;
      var foto = c.imagen
        ? '<img src="' + base + c.imagen + '" alt="' + esc(c.nombre) + '" loading="lazy" decoding="async">'
        : "";
      return '<a class="cat-card" href="catalogo.html?categoria=' + c.id + '">' +
        '<div class="cat-foto">' + foto +
        '<span class="cat-ico">' + window.EXXOMAX_ico(c.icono) + "</span>" +
        '<span class="cat-num">' + n + "</span></div>" +
        '<div class="cat-cuerpo"><h3>' + c.nombre + "</h3>" +
        '<p class="cat-res">' + c.resumen + "</p>" +
        '<span class="cat-go">Ver productos' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
        "</span></div></a>";
    }).join("");
  }

  /* ---------------------------------------------------------------- marcas */

  /*
   * El PDF del catalogo no trae logotipos de marca: solo fotos de producto.
   * Cada marca se dibuja con su nombre en un wordmark. La variante sale del
   * puesto que ocupa en el ranking (ciclo de 6), asi ninguna fila queda llena
   * de logos iguales y el mismo aspecto se repite en la banda y en las fichas.
   */
  function hashMarca(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }

  /* "ORIX / MEGAPRO" -> "ORIX": en la banda compacta solo cabe la marca base */
  function nombreCorto(nombre) {
    return String(nombre).split("/")[0].replace(/\s+/g, " ").trim();
  }

  var cacheMarcas = null;
  function marcasOrdenadas() {
    if (!cacheMarcas) {
      cacheMarcas = (window.EXXOMAX_MARCAS || [])
        .filter(function (m) { return m.n; })
        .slice()
        .sort(function (a, b) { return b.t - a.t; });
    }
    return cacheMarcas;
  }

  function marcasTop(n) { return marcasOrdenadas().slice(0, n || 16); }

  function varianteMarca(nombre) {
    var todas = marcasOrdenadas();
    for (var i = 0; i < todas.length; i++) {
      if (todas[i].n === nombre) return i % 6;
    }
    return hashMarca(nombre) % 6;
  }

  function wordmark(nombre) {
    var corto = nombreCorto(nombre);
    var ini = (corto.replace(/[^A-Za-z0-9]/g, "").charAt(0) || "M").toUpperCase();
    return '<span class="marca-word v' + varianteMarca(nombre) + '" data-ini="' + esc(ini) + '">' +
      esc(corto) + "</span>";
  }

  function rutaLogo(nombre) {
    return (window.EXXOMAX_LOGOS_MARCAS || {})[String(nombre).toUpperCase()] || "";
  }

  /** Logotipo oficial si existe en assets/img/marcas/, si no, el wordmark. */
  function logoMarca(nombre) {
    var ruta = rutaLogo(nombre);
    if (ruta) return '<img src="' + ruta + '" alt="' + esc(nombre) + '" loading="lazy">';
    return wordmark(nombre);
  }

  function pintarMarcasBanda() {
    var cont = $("[data-marcas-banda]");
    if (!cont) return;
    var lista = marcasTop(24);
    if (!lista.length) { cont.style.display = "none"; return; }

    function item(m, copia) {
      return '<span class="marca-logo' + (m.n === "MEGAPRO" ? " propia" : "") + '"' +
        ' title="' + esc(m.n) + '" aria-label="' + esc(m.n) + '"' +
        (copia ? ' aria-hidden="true"' : "") + ">" + logoMarca(m.n) + "</span>";
    }

    /* la pista se duplica para que la vuelta sea infinita; la copia queda
       oculta para lectores de pantalla y se anima en sentido contrario */
    function pista(brands, invertida) {
      function bloque(copia) {
        return brands.map(function (m) { return item(m, copia); }).join("");
      }
      return '<div class="carrusel"><div class="pista' + (invertida ? " pista-inv" : "") + '">' +
        bloque(false) + bloque(true) + "</div></div>";
    }

    var mitad = Math.ceil(lista.length / 2);
    /* sin rótulo interno: el título ya lo pone la sección */
    cont.innerHTML = pista(lista.slice(0, mitad), false) + pista(lista.slice(mitad), true);
  }

  /* -------------------------------------------------- franja de confianza */

  var CONFIANZA = [
    { i: "i-certificado", n: "1.081", t: "referencias activas" },
    { i: "i-capas", n: "101", t: "marcas en catálogo" },
    { i: "i-camion", n: "4", t: "estados con ruta" },
    { i: "i-usuarios", n: "12", t: "vendedores en zona" },
  ];

  function pintarConfianza() {
    var cont = $("[data-confianza]");
    if (!cont) return;
    cont.innerHTML = CONFIANZA.map(function (c) {
      return '<div class="conf-item"><span class="ico">' + window.EXXOMAX_ico(c.i) + "</span>" +
        '<b data-contar="' + c.n + '">' + c.n + "</b><span>" + c.t + "</span></div>";
    }).join("");
  }

  /* ------------------------------------------------------------ WhatsApp */

  function montarWaFlotante() {
    var cont = $("[data-wa-flotante]");
    if (!cont) return;
    cont.innerHTML = window.EXXOMAX_ico("i-whatsapp", "") +
      '<span class="txt">Escríbenos<small>Respuesta rápida</small></span>';
    cont.setAttribute("href", enlaceWa("Hola EXXOMAX, quiero información sobre sus productos."));
    cont.setAttribute("target", E.CONTACTO_PENDIENTE ? "_self" : "_blank");
    if (!E.CONTACTO_PENDIENTE) cont.setAttribute("rel", "noopener");
  }

  /* ------------------------------------------------ orbes decorativos */

  function initOrbitas() {
    var orbes = $$(".sec-orbe");
    if (!orbes.length || !("IntersectionObserver" in window)) {
      orbes.forEach(function (o) { o.classList.add("visible"); });
      return;
    }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
        } else {
          e.target.classList.remove("visible");
        }
      });
    }, { threshold: 0 });
    orbes.forEach(function (o) { obs.observe(o); });
  }

  /* --------------------------------------------------------------- init */

  function direccionTexto() {
    return E.direccion + ", " + E.ciudad + ", estado " + E.estado + " (" + E.zip + ")";
  }
  window.EXXOMAX_direccion = direccionTexto;

  /* --------------------------------------------- transiciones entre páginas */

  /* El enlace interno no navega en seco: el contenido sale hacia arriba
     (body.saliendo, ver CSS) y la nueva página entra desde abajo. Los enlaces
     externos (WhatsApp, tel:, mailto:) y los anclajes se saltan la transición. */
  function transicionesPagina() {
    var saliendo = false;
    var anima = !window.matchMedia || !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest("a") : null;
      if (!a || saliendo) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#") return;
      if (a.protocol !== location.protocol || a.host !== location.host) return;
      if (a.pathname === location.pathname && a.search === location.search) return;
      e.preventDefault();
      if (!anima) { location.href = a.href; return; }
      saliendo = true;
      document.body.classList.add("saliendo");
      setTimeout(function () { location.href = a.href; }, 210);
    });

    /* volver con el botón atrás (caché bfcache) no debe dejar la página en blanco */
    window.addEventListener("pageshow", function (ev) {
      if (ev.persisted) { saliendo = false; document.body.classList.remove("saliendo"); }
    });
  }

  function init() {
    transicionesPagina();
    menuMovil();
    sombraCabecera();
    barraProgreso();
    parallaxHerramientas();
    marcarActivo();

    pintarMetricas();
    pintarZonas();
    pintarVendedores();
    pintarCategorias("[data-categorias-todas]");
    pintarCategorias("[data-categorias-top]", limiteCategorias());
    pintarMarcasBanda();
    pintarConfianza();
    montarWaFlotante();

    revelarPalabras();
    revelar();
    initOrbitas();
    animarContadores();
    initTiltCards();

    var y = $("[data-anio]");
    if (y) y.textContent = new Date().getFullYear();

    $$("[data-direccion-texto]").forEach(function (n) { n.textContent = direccionTexto(); });

    $$("[data-wa-enlace]").forEach(function (n) {
      n.setAttribute("href", enlaceWa(n.getAttribute("data-wa-enlace")));
      if (!E.CONTACTO_PENDIENTE) { n.setAttribute("target", "_blank"); n.setAttribute("rel", "noopener"); }
    });

    $$("[data-tel-enlace]").forEach(function (n) {
      var t = E.telefono;
      if (t) { n.setAttribute("href", "tel:" + t.replace(/[^\d+]/g, "")); n.textContent = t; }
    });

    initCursor();
  }

  function initCursor() {
    /* Solo en escritorio */
    if (window.innerWidth <= 900) return;

    /* Inyectamos los elementos si aún no existen (funciona en todas las páginas) */
    var cursorDot = document.querySelector('.cursor-dot');
    var cursorOutline = document.querySelector('.cursor-outline');

    if (!cursorDot) {
      cursorDot = document.createElement('div');
      cursorDot.className = 'cursor-dot';
      document.body.appendChild(cursorDot);
    }
    if (!cursorOutline) {
      cursorOutline = document.createElement('div');
      cursorOutline.className = 'cursor-outline';
      document.body.appendChild(cursorOutline);
    }

    window.addEventListener('mousemove', function(e) {
      cursorDot.style.transform     = 'translate(' + e.clientX + 'px, ' + e.clientY + 'px) translate(-50%, -50%)';
      cursorOutline.style.transform = 'translate(' + e.clientX + 'px, ' + e.clientY + 'px) translate(-50%, -50%)';
    });

    document.querySelectorAll('a, button').forEach(function(el) {
      el.addEventListener('mouseenter', function() {
        cursorOutline.style.width = '60px';
        cursorOutline.style.height = '60px';
        cursorOutline.style.backgroundColor = 'rgba(123, 192, 67, 0.15)';
      });
      el.addEventListener('mouseleave', function() {
        cursorOutline.style.width = '40px';
        cursorOutline.style.height = '40px';
        cursorOutline.style.backgroundColor = 'transparent';
      });
    });
  }


  /* ---- Efecto magnético 3D en tarjetas ---- */
  function initTiltCards() {
    if (window.innerWidth <= 768) return; /* No en móvil */
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var selectores = ".cat-card, .vendedor, .paso";

    function ligar(card) {
      if (card.dataset.tilt) return;
      card.dataset.tilt = "1";
      card.style.transition = card.style.transition
        ? card.style.transition + ", transform .18s ease-out, box-shadow .18s ease-out"
        : "transform .18s ease-out, box-shadow .18s ease-out";

      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        dx = Math.max(-1, Math.min(1, dx));
        dy = Math.max(-1, Math.min(1, dy));
        card.style.transform = "perspective(700px) rotateX(" + (dy * -8).toFixed(2) +
          "deg) rotateY(" + (dx * 10).toFixed(2) + "deg) scale(1.03)";
        card.style.boxShadow = "0 24px 48px rgba(0,0,0,.14), " +
          (-dx * 8).toFixed(1) + "px " + (-dy * 8).toFixed(1) + "px 20px rgba(0,166,62,.12)";
      });

      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
        card.style.boxShadow = "";
      });
    }

    $$(".cat-card, .vendedor, .paso").forEach(ligar);

    /* el catalogo pinta sus tarjetas al vuelo: se enganchan cuando aparecen */
    var obs = new MutationObserver(function (mut) {
      mut.forEach(function (m) {
        $$(".cat-card, .vendedor, .paso", m.target).forEach(ligar);
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function limiteCategorias() {
    return 8;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
