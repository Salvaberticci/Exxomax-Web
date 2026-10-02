/* ==========================================================================
   EXXOMAX - Formulario de contacto
   Sin backend: compila la consulta y la envia por WhatsApp o correo,
   que son los canales reales de la empresa.
   ========================================================================== */
(function () {
  "use strict";

  var E = window.EXXOMAX_EMPRESA || {};
  var $ = function (s) { return document.querySelector(s); };

  function valor(id) {
    var n = document.getElementById(id);
    return n && n.value ? n.value.trim() : "";
  }

  function mensaje() {
    var l = [];
    l.push("Hola EXXOMAX, quiero hacer una consulta.");
    l.push("");
    l.push("*Nombre:* " + valor("nombre"));
    var emp = valor("empresa");
    if (emp) l.push("*Empresa:* " + emp);
    l.push("*Teléfono:* " + valor("telefono"));
    l.push("*Estado:* " + valor("estado"));
    var cat = valor("categoria");
    if (cat) l.push("*Categoría de interés:* " + cat);
    var cod = valor("codigo");
    if (cod) l.push("*Código de producto:* " + cod);
    l.push("");
    l.push("*Mensaje:* " + valor("mensaje"));
    return l.join("\n");
  }

  function esValido() {
    var ok = true;
    ["nombre", "telefono", "mensaje"].forEach(function (id) {
      var n = document.getElementById(id);
      var v = n.value.trim();
      var malo = !v;
      if (id === "telefono" && v) malo = !/[\d]{7,}/.test(v.replace(/\D/g, ""));
      if (id === "mensaje" && v.length < 10) malo = true;
      n.classList.toggle("invalido", malo);
      n.setAttribute("aria-invalid", malo ? "true" : "false");
      if (malo && ok) n.focus();
      ok = ok && !malo;
    });
    return ok;
  }

  function init() {
    var form = $("#form-contacto");
    if (!form) return;

    /* prellenar el estado segun la zona elegida en el mapa */
    var sel = document.getElementById("estado");
    (window.EXXOMAX_ZONAS || []).forEach(function (z) {
      var o = document.createElement("option");
      o.value = z.nombre;
      o.textContent = z.nombre;
      sel.appendChild(o);
    });
    var otra = document.createElement("option");
    otra.value = "Otra zona";
    otra.textContent = "Otra zona";
    sel.appendChild(otra);

    /* producto del catalogo: "?producto=ADPT-02" */
    var p = new URLSearchParams(location.search);
    if (p.get("producto")) {
      var n = document.getElementById("codigo");
      if (n) {
        n.value = p.get("producto");
        var c = document.getElementById("categoria");
        if (c) c.value = "";
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var aviso = $("#aviso");

      if (!esValido()) {
        aviso.className = "aviso visible";
        aviso.style.background = "#fdecec";
        aviso.style.color = "#8a1f1f";
        aviso.style.borderColor = "#f3c6c6";
        aviso.textContent = "Revisa los campos marcados: necesitamos tu nombre, un teléfono válido y un mensaje de al menos 10 caracteres.";
        return;
      }

      var texto = mensaje();
      var pendiente = E.CONTACTO_PENDIENTE || !E.whatsapp || E.whatsapp.indexOf("0000") > -1;

      aviso.className = "aviso visible";
      aviso.style.background = "";
      aviso.style.color = "";
      aviso.style.borderColor = "";
      aviso.textContent = "Gracias, " + valor("nombre") + ". " +
        (pendiente
          ? "Pulsa el botón verde para copiar tu consulta y envíala por el canal que prefieras."
          : "Te enviamos tu consulta por WhatsApp ahora mismo.");

      $("#copiar").classList.remove("oculto");
      window.__exxConsulta = texto;
    });

    /* copiar al portapapeles */
    var btn = $("#copiar");
    if (btn) {
      btn.addEventListener("click", function () {
        var texto = window.__exxConsulta || "";
        if (!texto) return;
        var t = texto;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(t).then(function () {
            btn.textContent = "✓ Copiado. Ya puedes pegarla en WhatsApp o correo.";
            window.abrirWa(t);
          });
        } else {
          var ta = document.createElement("textarea");
          ta.value = t;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); } catch (err) { /* ignora */ }
          document.body.removeChild(ta);
          btn.textContent = "✓ Copiado. Ya puedes pegarla en WhatsApp o correo.";
          window.abrirWa(t);
        }
      });
    }
  }

  /* al enviar, ofrece abrir WhatsApp con la consulta ya escrita */
  window.abrirWa = function (texto) {
    var pendiente = E.CONTACTO_PENDIENTE || !E.whatsapp || E.whatsapp.indexOf("0000") > -1;
    var enlace;
    if (pendiente) {
      enlace = "https://wa.me/?text=" + encodeURIComponent(texto);
    } else {
      enlace = "https://wa.me/" + E.whatsapp + "?text=" + encodeURIComponent(texto);
    }
    window.open(enlace, "_blank", "noopener");
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
