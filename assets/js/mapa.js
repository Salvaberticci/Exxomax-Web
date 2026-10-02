/* ==========================================================================
   EXXOMAX - Mapa de cobertura con Leaflet + OpenStreetMap (sin API key)
   ========================================================================== */
(function () {
  "use strict";

  var zonas = window.EXXOMAX_ZONAS || [];
  var E = window.EXXOMAX_EMPRESA || {};
  var mapa = null;
  var capa = {};

  if (typeof L === "undefined" || !zonas.length) return;

  function icono(z, activo) {
    return L.divIcon({
      className: "marcador-zona" + (activo ? " activo" : ""),
      html: '<span>' + z.nombre.charAt(0) + "</span>",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -22],
    });
  }

  function contenido(z) {
    var esSede = z.id === "trujillo";
    return '<div style="min-width:210px">' +
      '<b style="font-family:Poppins,sans-serif;font-size:1rem;color:#0f2419">' + z.nombre + "</b>" +
      (esSede ? '<span class="pt" style="display:inline-block;margin-left:8px;background:#00a63e;color:#fff;font-size:.66rem;padding:2px 8px;border-radius:99px;font-weight:700">SEDE</span>' : "") +
      '<p style="margin:6px 0 0;font-size:.85rem;color:#5f7168">' + z.desc + "</p>" +
      '<p style="margin:8px 0 0;font-size:.78rem;color:#00752c;font-weight:600">' + z.rutas + "</p>" +
      (esSede ? '<p style="margin:8px 0 0;font-size:.8rem;color:#0f2419"><strong>' + E.direccion + "</strong><br>" + E.ciudad + ", estado " + E.estado + "</p>" : "") +
      '<a href="contacto.html" style="display:inline-block;margin-top:12px;background:#00a63e;color:#fff;padding:8px 16px;border-radius:99px;font-size:.8rem;font-weight:600">Consultar despacho</a>' +
      "</div>";
  }

  function centrar(z) {
    if (!mapa) return;
    mapa.flyTo(z.coords, 8, { duration: 0.8 });
    if (capa[z.id]) capa[z.id].openPopup();
  }

  function init() {
    mapa = L.map("mapa", { scrollWheelZoom: false, zoomControl: true })
      .setView([9.0, -71.0], 7);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapa);

    /* circulo de cobertura por zona */
    zonas.forEach(function (z) {
      L.circle(z.coords, {
        radius: z.radio,
        color: "#00a63e",
        weight: 1.5,
        opacity: 0.5,
        fillColor: "#7bc043",
        fillOpacity: 0.10,
      }).addTo(mapa).bindPopup(contenido(z));
    });

    /* marcadores por estado */
    zonas.forEach(function (z) {
      capa[z.id] = L.marker(z.coords, { icon: icono(z, false) })
        .addTo(mapa)
        .bindPopup(contenido(z));
    });

    /* sede de Exxomax */
    L.marker([9.3178, -70.6027], {
      icon: L.divIcon({
        className: "marcador-sede",
        html: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -32],
      }),
    }).addTo(mapa).bindPopup(
      '<b style="font-family:Poppins,sans-serif;font-size:1rem;color:#0f2419">EXXOMAX C.A.</b>' +
      '<p style="margin:6px 0 0;font-size:.85rem;color:#5f7168">' + E.direccion + "<br>" +
      E.ciudad + ", estado " + E.estado + " (" + E.zip + ")<br>RIF: " + E.rif + "</p>"
    );

    /* Enables scroll con clic para que el usuario no se quede atascado */
    mapa.on("click", function () { mapa.scrollWheelZoom.enable(); });
    mapa.on("mouseout", function () { mapa.scrollWheelZoom.disable(); });

    /* las tarjetas de zona centran el mapa */
    document.querySelectorAll("[data-zona]").forEach(function (card) {
      function activar() {
        var z = zonas.filter(function (x) { return x.id === card.getAttribute("data-zona"); })[0];
        if (!z) return;
        document.querySelectorAll("[data-zona]").forEach(function (o) { o.classList.remove("on"); });
        card.classList.add("on");
        zonas.forEach(function (o) {
          if (capa[o.id]) capa[o.id].setIcon(icono(o, o.id === z.id));
        });
        centrar(z);
      }
      card.addEventListener("click", activar);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activar(); }
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
