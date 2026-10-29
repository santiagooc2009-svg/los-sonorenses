// Panel del local: lista de reseñas, quejas pendientes y QR para mesas.
(function () {
  const C = window.CONFIG;
  const $ = (sel) => document.querySelector(sel);
  const DIA_MS = 24 * 60 * 60 * 1000;

  let resenas = [];
  let filtro = "pendientes";

  // Crea elementos con texto seguro (nunca se inserta HTML del cliente).
  function el(tag, props, ...hijos) {
    const nodo = document.createElement(tag);
    Object.assign(nodo, props || {});
    hijos.flat().forEach((h) => {
      if (h != null && h !== false) nodo.append(h);
    });
    return nodo;
  }

  const esQueja = (r) => r.calificacion < C.calificacionMinimaGoogle;
  const estrellas = (n) => "★".repeat(n) + "☆".repeat(5 - n);
  const formatoFecha = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });

  function enPeriodo(r) {
    const dias = Number($("#periodo").value);
    return !dias || Date.now() - new Date(r.creada_en).getTime() <= dias * DIA_MS;
  }

  function coincideBusqueda(r) {
    const q = $("#buscar").value.trim().toLowerCase();
    if (!q) return true;
    return [r.comentario, r.mesero, r.nombre, r.contacto, r.nota_interna, (r.categorias || []).join(" ")]
      .some((v) => v && v.toLowerCase().includes(q));
  }

  function filtradas() {
    return resenas.filter((r) => {
      // Las quejas pendientes se muestran sin importar el periodo para que ninguna se pierda.
      if (filtro === "pendientes") return esQueja(r) && !r.atendida && coincideBusqueda(r);
      if (!enPeriodo(r) || !coincideBusqueda(r)) return false;
      if (filtro === "quejas") return esQueja(r);
      if (filtro === "positivas") return !esQueja(r);
      return true;
    });
  }

  function enlaceContacto(contacto) {
    if (contacto.includes("@")) {
      return [el("a", { href: "mailto:" + contacto, textContent: "Enviar correo" })];
    }
    let digitos = contacto.replace(/\D/g, "");
    if (digitos.length < 10) return [];
    if (digitos.length === 10) digitos = "52" + digitos;
    return [
      el("a", { href: "https://wa.me/" + digitos, target: "_blank", rel: "noopener", textContent: "WhatsApp" }),
      el("a", { href: "tel:+" + digitos, textContent: "Llamar" }),
    ];
  }

  async function actualizar(r, cambios) {
    try {
      await Datos.actualizarResena(r.id, cambios);
      Object.assign(r, cambios);
      pintar();
    } catch (err) {
      mostrarError("No se pudo guardar el cambio: " + err.message);
    }
  }

  function tarjetaResena(r) {
    const queja = esQueja(r);
    const nota = el("textarea", { rows: 2, maxLength: 1000, placeholder: "Nota interna (ej. le llamamos y…)", value: r.nota_interna || "" });

    return el("li", { className: "resena" + (queja ? " resena-queja" : "") + (r.atendida ? " resena-atendida" : "") },
      el("div", { className: "resena-cabeza" },
        el("span", { className: "resena-estrellas", textContent: estrellas(r.calificacion), title: r.calificacion + " de 5" }),
        el("span", { className: "texto-suave", textContent: formatoFecha.format(new Date(r.creada_en)) }),
        queja && el("span", { className: "etiqueta " + (r.atendida ? "etiqueta-ok" : "etiqueta-alerta"), textContent: r.atendida ? "Atendida" : "Pendiente" })
      ),
      (r.categorias || []).length > 0 && el("div", { className: "chips chips-chicos" },
        r.categorias.map((c) => el("span", { className: "chip chip-fijo", textContent: c }))
      ),
      el("p", { className: "resena-texto" + (r.comentario ? "" : " texto-suave"), textContent: r.comentario || "Sin comentario" }),
      el("dl", { className: "resena-datos" },
        r.mesero && [el("dt", { textContent: "Atendió" }), el("dd", { textContent: r.mesero })],
        r.nombre && [el("dt", { textContent: "Cliente" }), el("dd", { textContent: r.nombre })],
        r.contacto && [el("dt", { textContent: "Contacto" }), el("dd", {}, r.contacto, " ", enlaceContacto(r.contacto))]
      ),
      queja && el("div", { className: "resena-acciones" },
        nota,
        el("div", { className: "botones" },
          el("button", { className: "boton-sec", textContent: "Guardar nota", onclick: () => actualizar(r, { nota_interna: nota.value.trim() || null }) }),
          el("button", {
            className: r.atendida ? "boton-sec" : "boton boton-chico",
            textContent: r.atendida ? "Marcar como pendiente" : "Marcar como atendida",
            onclick: () => actualizar(r, { atendida: !r.atendida, nota_interna: nota.value.trim() || null }),
          })
        )
      )
    );
  }

  function pintarResumen() {
    const delPeriodo = resenas.filter(enPeriodo);
    const promedio = delPeriodo.length
      ? delPeriodo.reduce((s, r) => s + r.calificacion, 0) / delPeriodo.length
      : null;
    $("#t-promedio").textContent = promedio === null ? "–" : promedio.toFixed(1) + " ★";
    $("#t-total").textContent = delPeriodo.length;
    $("#t-google").textContent = delPeriodo.filter((r) => !esQueja(r)).length;
    $("#t-pendientes").textContent = resenas.filter((r) => esQueja(r) && !r.atendida).length;

    const conteo = {};
    delPeriodo.filter(esQueja).forEach((r) =>
      (r.categorias || []).forEach((c) => (conteo[c] = (conteo[c] || 0) + 1))
    );
    const orden = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
    $("#resumen-problemas").hidden = orden.length === 0;
    $("#periodo-texto").textContent = "· " + $("#periodo").selectedOptions[0].textContent.toLowerCase();
    const maximo = orden.length ? orden[0][1] : 1;
    $("#barras").replaceChildren(
      ...orden.map(([nombre, n]) =>
        el("li", {},
          el("span", { className: "barra-nombre", textContent: nombre }),
          el("span", { className: "barra-pista" }, el("span", { className: "barra-relleno", style: "width:" + (n / maximo) * 100 + "%" })),
          el("span", { className: "barra-num", textContent: n })
        )
      )
    );
  }

  function pintar() {
    pintarResumen();
    const lista = filtradas();
    $("#lista").replaceChildren(...lista.map(tarjetaResena));
    $("#vacio").hidden = lista.length > 0;
  }

  function mostrarError(texto) {
    $("#error-panel").textContent = texto;
    $("#error-panel").hidden = !texto;
  }

  async function cargar() {
    try {
      resenas = await Datos.listarResenas();
      mostrarError("");
      pintar();
    } catch (err) {
      mostrarError("No se pudieron cargar las reseñas: " + err.message);
    }
  }

  function exportarCsv() {
    const columnas = ["creada_en", "calificacion", "comentario", "categorias", "mesero", "nombre", "contacto", "atendida", "nota_interna"];
    const celda = (v) => {
      let t = Array.isArray(v) ? v.join(", ") : v == null ? "" : String(v);
      if (/^[=+\-@]/.test(t)) t = "'" + t; // evita fórmulas al abrir en Excel
      return '"' + t.replace(/"/g, '""') + '"';
    };
    const filas = [columnas.join(",")].concat(filtradas().map((r) => columnas.map((c) => celda(r[c])).join(",")));
    const blob = new Blob(["﻿" + filas.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = el("a", { href: URL.createObjectURL(blob), download: "resenas-los-sonorenses.csv" });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function abrirQr() {
    const url = new URL("./", window.location.href).href;
    const contenedor = $("#qr");
    contenedor.replaceChildren();
    if (window.QRCode) {
      new QRCode(contenedor, { text: url, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
    } else {
      contenedor.textContent = "No se pudo cargar el generador de QR. Revisa tu conexión.";
    }
    $("#qr-url").textContent = url;
    $("#dialogo-qr").showModal();
  }

  async function mostrarPanel() {
    $("#vista-login").hidden = true;
    $("#vista-panel").hidden = false;
    $("#salir").hidden = Datos.modo === "demo";
    await cargar();
    // Revisa reseñas nuevas cada minuto, salvo mientras se escribe una nota.
    setInterval(() => {
      if (document.activeElement && document.activeElement.tagName === "TEXTAREA") return;
      if (!$("#dialogo-qr").open) cargar();
    }, 60 * 1000);
  }

  document.querySelectorAll(".filtro").forEach((boton) =>
    boton.addEventListener("click", () => {
      filtro = boton.dataset.filtro;
      document.querySelectorAll(".filtro").forEach((b) => b.setAttribute("aria-pressed", String(b === boton)));
      pintar();
    })
  );
  $("#periodo").addEventListener("change", pintar);
  $("#buscar").addEventListener("input", pintar);
  $("#exportar").addEventListener("click", exportarCsv);
  $("#ver-qr").addEventListener("click", abrirQr);
  $("#cerrar-qr").addEventListener("click", () => $("#dialogo-qr").close());
  $("#imprimir-qr").addEventListener("click", () => window.print());

  $("#salir").addEventListener("click", async () => {
    await Datos.cerrarSesion();
    window.location.reload();
  });

  $("#form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const datos = new FormData(e.target);
    const error = $("#error-login");
    error.hidden = true;
    try {
      await Datos.iniciarSesion(datos.get("email"), datos.get("password"));
      mostrarPanel();
    } catch (err) {
      error.textContent = "Correo o contraseña incorrectos.";
      error.hidden = false;
    }
  });

  (async function iniciar() {
    if (Datos.modo === "demo") $("#aviso-demo").hidden = false;
    if (await Datos.sesionActiva()) mostrarPanel();
    else $("#vista-login").hidden = false;
  })();
})();
