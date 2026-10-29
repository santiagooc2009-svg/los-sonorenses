// Capa de datos: guarda y lee reseñas en Supabase o, si no está configurado,
// en el localStorage del navegador (modo demostración).
(function () {
  const C = window.CONFIG;
  const TABLA = "resenas";
  const CLAVE_DEMO = "sonorenses_resenas_demo";

  const usarSupabase = Boolean(C.supabaseUrl && C.supabaseAnonKey && window.supabase);
  const cliente = usarSupabase
    ? window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey)
    : null;

  function leerDemo() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_DEMO)) || [];
    } catch (e) {
      return [];
    }
  }

  function escribirDemo(lista) {
    localStorage.setItem(CLAVE_DEMO, JSON.stringify(lista));
  }

  function lanzar(error) {
    if (error) throw new Error(error.message || String(error));
  }

  window.Datos = {
    modo: usarSupabase ? "supabase" : "demo",

    googleUrl() {
      return "https://search.google.com/local/writereview?placeid=" + encodeURIComponent(C.googlePlaceId);
    },

    async guardarResena(resena) {
      if (cliente) {
        const { error } = await cliente.from(TABLA).insert(resena);
        lanzar(error);
        return;
      }
      const lista = leerDemo();
      const id = lista.reduce((max, r) => Math.max(max, r.id), 0) + 1;
      lista.push({ id, creada_en: new Date().toISOString(), atendida: false, nota_interna: null, ...resena });
      escribirDemo(lista);
    },

    async sesionActiva() {
      if (!cliente) return true;
      const { data } = await cliente.auth.getSession();
      return Boolean(data.session);
    },

    async iniciarSesion(email, password) {
      const { error } = await cliente.auth.signInWithPassword({ email, password });
      lanzar(error);
    },

    async cerrarSesion() {
      if (cliente) await cliente.auth.signOut();
    },

    async listarResenas() {
      if (cliente) {
        const { data, error } = await cliente
          .from(TABLA)
          .select("*")
          .order("creada_en", { ascending: false })
          .limit(2000);
        lanzar(error);
        return data;
      }
      return leerDemo().sort((a, b) => b.creada_en.localeCompare(a.creada_en));
    },

    async actualizarResena(id, cambios) {
      if (cliente) {
        const { error } = await cliente.from(TABLA).update(cambios).eq("id", id);
        lanzar(error);
        return;
      }
      escribirDemo(leerDemo().map((r) => (r.id === id ? { ...r, ...cambios } : r)));
    },
  };
})();
