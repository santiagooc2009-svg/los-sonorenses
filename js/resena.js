// Formulario que llena el cliente.
(function () {
  const C = window.CONFIG;
  const $ = (sel) => document.querySelector(sel);

  const ETIQUETAS = { 1: "Muy mala", 2: "Mala", 3: "Regular", 4: "Buena", 5: "¡Excelente!" };
  const formulario = $("#formulario");
  const googleUrl = Datos.googleUrl();

  let categoriasElegidas = new Set();

  $("#pie").textContent = C.negocio + " · " + C.telefono;

  C.categoriasProblema.forEach((nombre) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = nombre;
    chip.setAttribute("aria-pressed", "false");
    chip.addEventListener("click", () => {
      const activo = !categoriasElegidas.has(nombre);
      if (activo) categoriasElegidas.add(nombre);
      else categoriasElegidas.delete(nombre);
      chip.setAttribute("aria-pressed", String(activo));
    });
    $("#categorias").appendChild(chip);
  });

  function calificacionElegida() {
    const marcada = formulario.querySelector("input[name=calificacion]:checked");
    return marcada ? Number(marcada.value) : 0;
  }

  function esPositiva(calificacion) {
    return calificacion >= C.calificacionMinimaGoogle;
  }

  formulario.addEventListener("change", (e) => {
    if (e.target.name !== "calificacion") return;
    const calificacion = calificacionElegida();
    const positiva = esPositiva(calificacion);
    $("#etiqueta-estrellas").textContent = ETIQUETAS[calificacion];
    $("#detalles").hidden = false;
    $("#bloque-problemas").hidden = positiva;
    $("#campo-contacto").hidden = positiva;
    $("#aviso-google").hidden = !positiva;
    $("#texto-comentario").textContent = positiva
      ? "¿Qué fue lo que más te gustó?"
      : "Cuéntanos qué pasó para corregirlo";
  });

  function mostrarError(texto) {
    const error = $("#error");
    error.textContent = texto;
    error.hidden = !texto;
  }

  formulario.addEventListener("input", () => mostrarError(""));
  $("#categorias").addEventListener("click", () => mostrarError(""));

  async function copiar(texto) {
    if (!texto || !navigator.clipboard) return false;
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (e) {
      return false;
    }
  }

  function irAGoogle(copiado) {
    $("#paso-formulario").hidden = true;
    $("#paso-positivo").hidden = false;
    $("#aviso-copiado").hidden = !copiado;
    $("#boton-google").href = googleUrl;

    let restantes = C.segundosAntesDeGoogle;
    const cuenta = $("#cuenta-regresiva");
    const tic = () => {
      if (restantes <= 0) {
        cuenta.textContent = "Abriendo Google…";
        window.location.href = googleUrl;
        return;
      }
      cuenta.textContent = "Abriendo Google en " + restantes + "…";
      restantes -= 1;
      setTimeout(tic, 1000);
    };
    tic();
  }

  function agradecerQueja(dejoContacto) {
    $("#paso-formulario").hidden = true;
    $("#paso-negativo").hidden = false;
    $("#aviso-contacto").hidden = !dejoContacto;
    if (C.ofrecerGoogleATodos) {
      $("#google-opcional").hidden = false;
      $("#enlace-google-opcional").href = googleUrl;
    }
  }

  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    mostrarError("");

    const calificacion = calificacionElegida();
    if (!calificacion) {
      mostrarError("Elige de 1 a 5 estrellas.");
      return;
    }

    const datos = new FormData(formulario);
    const texto = (nombre) => String(datos.get(nombre) || "").trim();
    const positiva = esPositiva(calificacion);

    // Si un bot llenó el campo trampa fingimos éxito sin guardar nada.
    if (texto("sitio")) {
      positiva ? irAGoogle(false) : agradecerQueja(false);
      return;
    }

    const resena = {
      calificacion,
      comentario: texto("comentario") || null,
      mesero: texto("mesero") || null,
      nombre: texto("nombre") || null,
      contacto: positiva ? null : texto("contacto") || null,
      categorias: positiva ? [] : [...categoriasElegidas],
    };

    if (!positiva && !resena.comentario && resena.categorias.length === 0) {
      mostrarError("Cuéntanos qué pasó o elige al menos una opción.");
      return;
    }

    // Copiar antes de esperar a la red: el navegador solo lo permite justo después del clic.
    const copiado = positiva ? await copiar(resena.comentario) : false;

    const boton = $("#enviar");
    boton.disabled = true;
    boton.textContent = "Enviando…";
    try {
      await Datos.guardarResena(resena);
    } catch (err) {
      console.error(err);
      // A un cliente contento lo mandamos a Google aunque no se haya guardado aquí.
      if (positiva) {
        irAGoogle(copiado);
        return;
      }
      boton.disabled = false;
      boton.textContent = "Enviar";
      mostrarError("No pudimos enviar tu reseña. Revisa tu conexión e inténtalo de nuevo.");
      return;
    }

    positiva ? irAGoogle(copiado) : agradecerQueja(Boolean(resena.contacto));
  });
})();
