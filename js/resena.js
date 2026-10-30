// Página del cliente: primero estrellas; con calificación alta va directo a Google
// y con calificación baja se le guía con opciones para contar qué pasó.
(function () {
  const C = window.CONFIG;
  const $ = (sel) => document.querySelector(sel);

  const ETIQUETAS = { 1: "Muy mala", 2: "Mala", 3: "Regular" };
  const googleUrl = Datos.googleUrl();

  let calificacion = 0;
  let subpaso = 1;
  let quiereContacto = null;
  let meseroElegido = "";
  const categorias = new Set();
  const detalles = new Set(); // claves "categoría|opción"

  $("#pie").textContent = C.negocio + " · " + C.telefono;

  function mostrarSeccion(id) {
    ["#paso-estrellas", "#paso-google", "#paso-queja", "#paso-gracias"].forEach((s) => {
      $(s).hidden = s !== id;
    });
    window.scrollTo(0, 0);
  }

  function mostrarError(texto) {
    $("#error").textContent = texto;
    $("#error").hidden = !texto;
  }

  function boton(clase, contenido, alTocar) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = clase;
    b.setAttribute("aria-pressed", "false");
    b.append(...contenido);
    b.addEventListener("click", () => {
      mostrarError("");
      alTocar(b);
    });
    return b;
  }

  function alternar(conjunto, valor, b) {
    if (conjunto.has(valor)) conjunto.delete(valor);
    else conjunto.add(valor);
    b.setAttribute("aria-pressed", String(conjunto.has(valor)));
  }

  function icono(texto) {
    const s = document.createElement("span");
    s.setAttribute("aria-hidden", "true");
    s.textContent = texto;
    return s;
  }

  // ---------- Paso 1: estrellas ----------

  function conLimite(promesa, ms) {
    return Promise.race([promesa, new Promise((r) => setTimeout(r, ms))]);
  }

  async function irAGoogle() {
    $("#boton-google").href = googleUrl;
    mostrarSeccion("#paso-google");
    // Se guarda la calificación para el panel, pero sin hacer esperar al cliente.
    await conLimite(Datos.guardarResena({ calificacion }).catch(console.error), 2000);
    window.location.href = googleUrl;
  }

  document.querySelectorAll("input[name=calificacion]").forEach((input) =>
    input.addEventListener("change", () => {
      calificacion = Number(input.value);
      if (calificacion >= C.calificacionMinimaGoogle) {
        irAGoogle();
        return;
      }
      $("#resumen-estrellas").textContent =
        "★".repeat(calificacion) + "☆".repeat(5 - calificacion) + "  " + ETIQUETAS[calificacion];
      mostrarSeccion("#paso-queja");
      irASubpaso(1);
    })
  );

  $("#cambiar-estrellas").addEventListener("click", () => {
    document.querySelectorAll("input[name=calificacion]").forEach((i) => (i.checked = false));
    mostrarSeccion("#paso-estrellas");
  });

  // ---------- Queja: categorías ----------

  C.problemas.forEach((p) => {
    $("#categorias").appendChild(
      boton("opcion", [icono(p.icono), p.categoria], (b) => alternar(categorias, p.categoria, b))
    );
  });

  // ---------- Queja: detalles de cada categoría elegida ----------

  function pintarDetalles() {
    const grupos = C.problemas
      .filter((p) => categorias.has(p.categoria))
      .map((p) => {
        const grupo = document.createElement("div");
        grupo.className = "grupo-detalles";
        const titulo = document.createElement("p");
        titulo.className = "pregunta";
        titulo.append(icono(p.icono + " "), p.categoria);
        grupo.appendChild(titulo);

        if (p.opciones.length === 0) {
          const pista = document.createElement("p");
          pista.className = "texto-suave";
          pista.textContent = "Cuéntanos abajo qué pasó.";
          grupo.appendChild(pista);
          return grupo;
        }
        const chips = document.createElement("div");
        chips.className = "chips";
        p.opciones.forEach((opcion) => {
          const clave = p.categoria + "|" + opcion;
          const b = boton("chip", [opcion], (el) => alternar(detalles, clave, el));
          b.setAttribute("aria-pressed", String(detalles.has(clave)));
          chips.appendChild(b);
        });
        grupo.appendChild(chips);
        return grupo;
      });
    $("#detalles").replaceChildren(...grupos);

    // Si quitó una categoría, se olvidan sus detalles.
    [...detalles].forEach((clave) => {
      if (!categorias.has(clave.split("|")[0])) detalles.delete(clave);
    });
  }

  if (C.meseros.length) {
    $("#mesero").hidden = true;
    C.meseros.concat("No recuerdo").forEach((nombre) => {
      $("#meseros").appendChild(
        boton("chip", [nombre], (b) => {
          meseroElegido = meseroElegido === nombre ? "" : nombre;
          $("#meseros").querySelectorAll(".chip").forEach((c) =>
            c.setAttribute("aria-pressed", String(c === b && meseroElegido !== ""))
          );
        })
      );
    });
  } else {
    $("#meseros").hidden = true;
  }

  // ---------- Queja: ¿quiere que lo contacten? ----------

  function elegirContacto(si) {
    quiereContacto = si;
    $("#contacto-si").setAttribute("aria-pressed", String(si));
    $("#contacto-no").setAttribute("aria-pressed", String(!si));
    $("#datos-contacto").hidden = !si;
    $("#siguiente").hidden = !si;
    if (si) $("#contacto").focus();
    else enviarQueja();
  }
  $("#contacto-si").addEventListener("click", () => { mostrarError(""); elegirContacto(true); });
  $("#contacto-no").addEventListener("click", () => { mostrarError(""); elegirContacto(false); });

  // ---------- Navegación entre subpasos ----------

  function irASubpaso(n) {
    subpaso = n;
    mostrarError("");
    document.querySelectorAll(".subpaso").forEach((s) => (s.hidden = Number(s.dataset.subpaso) !== n));
    document.querySelectorAll(".progreso li").forEach((li) =>
      li.classList.toggle("activo", Number(li.dataset.paso) <= n)
    );
    if (n === 2) pintarDetalles();
    $("#siguiente").textContent = n === 3 ? "Enviar" : "Siguiente";
    $("#siguiente").hidden = n === 3 && quiereContacto !== true;
    window.scrollTo(0, 0);
  }

  $("#atras").addEventListener("click", () => {
    if (subpaso === 1) $("#cambiar-estrellas").click();
    else irASubpaso(subpaso - 1);
  });

  $("#siguiente").addEventListener("click", () => {
    if (subpaso === 1) {
      if (categorias.size === 0) return mostrarError("Elige al menos una opción.");
      irASubpaso(2);
    } else if (subpaso === 2) {
      if (detalles.size === 0 && !$("#comentario").value.trim()) {
        return mostrarError("Toca al menos una opción o escribe qué pasó.");
      }
      irASubpaso(3);
    } else {
      const contacto = $("#contacto").value.trim();
      if (contacto.replace(/\D/g, "").length < 7 && !contacto.includes("@")) {
        return mostrarError("Escribe tu teléfono o WhatsApp para poder contactarte.");
      }
      enviarQueja();
    }
  });

  document.querySelector("#paso-queja").addEventListener("input", () => mostrarError(""));

  async function enviarQueja() {
    const texto = (sel) => $(sel).value.trim() || null;
    const resena = {
      calificacion,
      categorias: C.problemas.map((p) => p.categoria).filter((c) => categorias.has(c)),
      detalles: C.problemas.flatMap((p) =>
        p.opciones.filter((o) => detalles.has(p.categoria + "|" + o))
      ),
      comentario: texto("#comentario"),
      mesero: C.meseros.length ? meseroElegido || null : texto("#mesero"),
      nombre: quiereContacto ? texto("#nombre") : null,
      contacto: quiereContacto ? texto("#contacto") : null,
    };

    const botones = [$("#siguiente"), $("#atras"), $("#contacto-si"), $("#contacto-no")];
    botones.forEach((b) => (b.disabled = true));
    try {
      // Si un bot llenó el campo trampa fingimos éxito sin guardar nada.
      if (!$("#sitio").value) await Datos.guardarResena(resena);
    } catch (err) {
      console.error(err);
      botones.forEach((b) => (b.disabled = false));
      mostrarError("No pudimos enviar tu comentario. Revisa tu conexión e inténtalo de nuevo.");
      return;
    }

    $("#aviso-contacto").hidden = !resena.contacto;
    if (C.ofrecerGoogleATodos) {
      $("#google-opcional").hidden = false;
      $("#enlace-google-opcional").href = googleUrl;
    }
    mostrarSeccion("#paso-gracias");
  }
})();
