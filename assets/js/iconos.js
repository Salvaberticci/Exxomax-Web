/* ==========================================================================
   EXXOMAX - Sprite de iconos SVG
   Se inyecta una sola vez al inicio del <body>. Despues se usan asi:
     <svg class="ico"><use href="#i-buscar"></use></svg>
   Todos heredan el color del texto (currentColor).
   ========================================================================== */
(function () {
  "use strict";

  if (document.getElementById("exx-sprite")) return;

  var s = function (d, extra) {
    return '<symbol id="' + d.id + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + d.p + "</symbol>";
  };

  var I = [
    /* ---------------------------------------------------------- interfaz */
    { id: "i-buscar", p: '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4-4"/>' },
    { id: "i-filtros", p: '<path d="M3 6h18M7 12h10M11 18h2"/>' },
    { id: "i-menu", p: '<path d="M3 6h18M3 12h18M3 18h18"/>' },
    { id: "i-cerrar", p: '<path d="M18 6 6 18M6 6l12 12"/>' },
    { id: "i-mas", p: '<path d="m6 9 6 6 6-6"/>' },
    { id: "i-flecha-d", p: '<path d="M4 12h15M13 6l6 6-6 6"/>' },
    { id: "i-flecha-i", p: '<path d="M20 12H5M11 18l-6-6 6-6"/>' },
    { id: "i-check", p: '<path d="M20 6 9 17l-5-5"/>' },
    { id: "i-check-circulo", p: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>' },
    { id: "i-whatsapp", p: '<path fill="currentColor" fill-rule="evenodd" stroke="none" d="M12.04 2.5c-5.24 0-9.5 4.26-9.5 9.5 0 1.68.44 3.32 1.28 4.77L2.5 21.5l4.87-1.28a9.46 9.46 0 0 0 4.67 1.19h.01c5.24 0 9.5-4.26 9.5-9.5 0-2.53-.99-4.91-2.78-6.7a9.42 9.42 0 0 0-6.73-2.71zm5.43 11.88c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35z"/>' },
    { id: "i-telefono", p: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>' },
    { id: "i-mail", p: '<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 6.5 9 6.5 9-6.5"/>' },
    { id: "i-ubicacion", p: '<path d="M20 10.5c0 6-8 11.5-8 11.5S4 16.5 4 10.5a8 8 0 1 1 16 0z"/><circle cx="12" cy="10.2" r="2.8"/>' },
    { id: "i-reloj", p: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>' },
    { id: "i-usuarios", p: '<path d="M16 21v-1.8a4 4 0 0 0-4-4H6.5a4 4 0 0 0-4 4V21"/><circle cx="9.25" cy="7" r="3.75"/><path d="M21.5 21v-1.8a4 4 0 0 0-3-3.87M16.2 3.3a3.75 3.75 0 0 1 0 7.4"/>' },
    { id: "i-premio", p: '<circle cx="12" cy="8.5" r="5.5"/><path d="m15.4 13.2 1.6 8-5-2.9-5 2.9 1.6-8"/>' },
    { id: "i-globo", p: '<circle cx="12" cy="12" r="9"/><path d="M3.2 12h17.6"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>' },
    { id: "i-camion", p: '<path d="M2.5 6h11v10.5h-11z"/><path d="M13.5 10h4l3.5 3.5v3h-7.5z"/><circle cx="7" cy="18.5" r="1.9"/><circle cx="17.5" cy="18.5" r="1.9"/>' },
    { id: "i-capa", p: '<path d="M12 2.6 4.5 6v6.2c0 4.9 3.3 8.4 7.5 9.2 4.2-.8 7.5-4.3 7.5-9.2V6z"/><path d="m9.2 12 2 2 3.6-3.8"/>' },
    { id: "i-rayo", p: '<path d="M13.2 2.5 4.5 14h6.4l-1.1 7.5L19.5 10h-6.9z"/>' },
    { id: "i-capas", p: '<path d="m12 2.6 9.2 4.7-9.2 4.7-9.2-4.7z"/><path d="m2.8 12 9.2 4.7 9.2-4.7"/><path d="m2.8 16.5 9.2 4.7 9.2-4.7"/>' },
    { id: "i-chat", p: '<path d="M20.5 11.6a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5a8.4 8.4 0 0 1-3.4-7 8.4 8.4 0 0 1 8.5-8.4 8.4 8.4 0 0 1 8 8z"/>' },
    { id: "i-ojo", p: '<path d="M2.2 12S5.7 5.6 12 5.6 21.8 12 21.8 12 18.3 18.4 12 18.4 2.2 12 2.2 12z"/><circle cx="12" cy="12" r="3"/>' },
    { id: "i-documento", p: '<path d="M14 2.5H6.5v19h11V6z"/><path d="M14 2.5V6h3.5"/><path d="M9 12.5h6M9 16.5h6"/>' },
    { id: "i-certificado", p: '<circle cx="12" cy="9" r="5.5"/><path d="m8.5 13.8-1 7.7 4.5-2.4 4.5 2.4-1-7.7"/>' },
    { id: "i-bolsa", p: '<path d="M4.5 8h15l-1 12.5h-13z"/><path d="M9 8V5.5a3 3 0 0 1 6 0V8"/>' },

    /* --------------------------------------------------------- categorias */
    { id: "i-electrica", p: '<circle cx="12" cy="12" r="3.4"/><path d="M12 2.6v3M12 18.4v3M21.4 12h-3M5.6 12h-3M18.6 5.4l-2.1 2.1M7.5 16.5l-2.1 2.1M18.6 18.6l-2.1-2.1M7.5 7.5 5.4 5.4"/>' },
    { id: "i-manuales", p: '<path d="M14.8 6.2a3.9 3.9 0 0 0 5.1 5.1l-8.3 8.3a2.6 2.6 0 0 1-3.7-3.7z"/><path d="m13.2 7.8 3 3"/><path d="M6.6 12.4 4 9.8a2.6 2.6 0 0 1 3.7-3.7l1.4 1.4"/><path d="m9.9 15.7-1.7 1.7"/>' },
    { id: "i-abrasivos", p: '<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="3.2"/><path d="M12 3.4v3.4M12 17.2v3.4M3.4 12h3.4M17.2 12h3.4"/>' },
    { id: "i-tornilleria", p: '<path d="M8.2 3h7.6"/><path d="M12 3v18.5"/><path d="M8.6 6.6h6.8M8.6 10h6.8M8.6 13.4h6.8M8.6 16.8h6.8"/>' },
    { id: "i-plomeria", p: '<path d="M2.5 9.5h19v5h-19z"/><path d="M5.5 9.5V6.5h3v3M15.5 9.5v-3h3v3"/><path d="M12 9.5v5"/>' },
    { id: "i-banos", p: '<path d="M12 2.8s5.6 6.2 5.6 10a5.6 5.6 0 0 1-11.2 0c0-3.8 5.6-10 5.6-10z"/><path d="M9.4 14.2a2.7 2.7 0 0 0 2.6 2.7"/>' },
    { id: "i-cerrajeria", p: '<circle cx="7.8" cy="12" r="4.2"/><path d="M12 12h9.2"/><path d="M17.6 12v3.2M20.4 12v2.2"/>' },
    { id: "i-electricidad", p: '<path d="M9.2 18.4h5.6M10.4 21.3h3.2"/><path d="M12 2.5a6.2 6.2 0 0 0-3.6 11.3c.5.4.8 1 .8 1.6h5.6c0-.6.3-1.2.8-1.6A6.2 6.2 0 0 0 12 2.5z"/>' },
    { id: "i-pinturas", p: '<rect x="2.2" y="3.6" width="11.2" height="6" rx="1.5"/><path d="M13.4 6.6h3.8a3 3 0 0 1 3 3v2.6"/><path d="M20.2 12.2v4.3a2 2 0 0 1-2 2H8.4a2 2 0 0 1-2-2V9.4"/>' },
    { id: "i-adhesivos", p: '<path d="M9.4 2.8h5.2v3.9l3.2 3.6v8.8a2 2 0 0 1-2 2H8.2a2 2 0 0 1-2-2v-8.8l3.2-3.6z"/><path d="M6.2 13.4h11.6"/><path d="M10.2 2.8V1.6h3.6v1.2"/>' },
    { id: "i-seguridad", p: '<path d="M3.8 14.6a8.2 8.2 0 0 1 16.4 0"/><path d="M2.4 14.6h19.2v3.2a2 2 0 0 1-2 2H4.4a2 2 0 0 1-2-2z"/><path d="M9.6 7.6V6a2.4 2.4 0 0 1 4.8 0v1.6"/>' },
    { id: "i-jardin", p: '<path d="M11 20.5A7.2 7.2 0 0 1 3.8 13c0-5.1 4-9.2 16.4-9.2 0 8.3-4 16.7-9.2 16.7z"/><path d="M3.8 21.2c2-6.1 6.2-9.2 11.4-11.4"/>' },
    { id: "i-construccion", p: '<rect x="2.8" y="3.8" width="18.4" height="16.4" rx="1.8"/><path d="M2.8 9.2h18.4M2.8 14.6h18.4M9.2 3.8v5.4M14.8 9.2v5.4M9.2 14.6v5.6"/>' },
    { id: "i-ferreteria", p: '<path d="m12 2.6 9.2 4.8v9.2L12 21.4l-9.2-4.8V7.4z"/><path d="m2.8 7.4 9.2 4.8 9.2-4.8M12 12.2v9.2"/>' },
  ];

  var html = '<svg id="exx-sprite" aria-hidden="true" focusable="false" ' +
    'style="position:absolute;width:0;height:0;overflow:hidden" ' +
    'xmlns="http://www.w3.org/2000/svg">' +
    I.map(s).join("") + "</svg>";

  function insertar() {
    if (document.getElementById("exx-sprite")) return;
    document.body.insertAdjacentHTML("afterbegin", html);
  }

  if (document.body) insertar();
  else document.addEventListener("DOMContentLoaded", insertar);
})();
