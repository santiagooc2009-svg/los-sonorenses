# Reseñas · Los Sonorenses Parrilla

Página para que los clientes califiquen su visita y dejen un comentario.

- **4 o 5 estrellas:** se guarda la reseña, se copia el comentario y se abre la página de Google para que la publiquen (solo tienen que pegar).
- **1 a 3 estrellas:** la reseña se queda en privado para el local. El cliente marca qué falló (comida, servicio, tiempo de espera…) y puede dejar su teléfono para que lo contacten.
- **Panel del local (`admin.html`):** quejas pendientes, promedio, qué es lo que más falla, botón de WhatsApp para contactar al cliente, notas internas, marcar como atendida, descarga en CSV y **QR para imprimir y poner en las mesas**.

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | Página que abre el cliente (la del QR) |
| `admin.html` | Panel del local |
| `js/config.js` | **Lo único que normalmente se edita**: enlace de Google, desde cuántas estrellas se manda a Google, categorías, llaves de Supabase |
| `supabase/esquema.sql` | Crea la base de datos y sus permisos |

## 1. Probarlo ya (modo demostración)

Sin configurar nada, el sitio funciona guardando las reseñas solo en tu navegador:

```bash
python3 -m http.server 8000
```

Abre <http://localhost:8000> para calificar y <http://localhost:8000/admin.html> para ver el panel.

## 2. Guardar las reseñas de verdad (Supabase, gratis)

1. Crea una cuenta y un proyecto en <https://supabase.com>.
2. Abre **SQL Editor → New query**, pega todo `supabase/esquema.sql`, **cambia el correo de la última línea** por el del dueño o gerente y presiona **Run**.
3. En **Authentication → Users → Add user** crea ese mismo correo con una contraseña (marca *Auto Confirm User*). Con ese correo y contraseña se entra al panel.
4. En **Authentication → Sign In / Providers** desactiva **Allow new users to sign up** para que nadie más pueda crear cuentas.
5. En **Project Settings → API Keys** copia la *Project URL* y la llave *publishable* (o *anon public*) y pégalas en `js/config.js`:

   ```js
   supabaseUrl: "https://xxxxxxxx.supabase.co",
   supabaseAnonKey: "sb_publishable_...",
   ```

   Esa llave es pública a propósito: la base de datos solo deja **enviar** reseñas a los clientes; leerlas, marcarlas como atendidas o escribir notas solo lo puede hacer alguien cuyo correo esté en la tabla `staff`. Para agregar a otra persona, crea su usuario (paso 3) y corre:

   ```sql
   insert into public.staff (email) values ('gerente2@correo.com');
   ```

## 3. Publicarlo (GitHub Pages, gratis)

1. Junta esta rama con `main` (o elige directamente esta rama en el paso 2).
2. En GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` → Save**.
3. En un par de minutos queda en línea:
   - Clientes: `https://santiagooc2009-svg.github.io/los-sonorenses/`
   - Panel: `https://santiagooc2009-svg.github.io/los-sonorenses/admin.html`
4. Entra al panel → **QR para mesas** → **Imprimir**. El QR apunta a la página de clientes.

## Ajustes en `js/config.js`

- `calificacionMinimaGoogle`: `4` manda a Google a quien da 4 o 5 estrellas. Pon `5` si solo quieres las de 5.
- `segundosAntesDeGoogle`: cuánto se muestra el "¡Gracias!" antes de abrir Google.
- `categoriasProblema`: las opciones de "¿Qué falló?".
- `ofrecerGoogleATodos`: ver la nota siguiente.

### ⚠️ Política de Google

Google prohíbe "solicitar selectivamente reseñas positivas" (práctica conocida como *review gating*): si detecta que solo se invita a publicar a los clientes contentos, puede borrar reseñas del perfil. Con `ofrecerGoogleATodos: true`, a quien califica bajo también se le muestra un enlace discreto a Google después de enviar su queja al local; los clientes contentos siguen yendo directo. Así todos los clientes tienen la opción de publicar en Google, que es lo que pide la política, y el local sigue enterándose primero de las quejas.

## Datos del negocio usados

| Dato | Valor | Fuente |
| --- | --- | --- |
| Nombre en Google | Los Sonorenses Parrilla (4.6 ★) | Google Maps |
| Dirección | Lateral Sur, Recta a Cholula 1002, Santiago Momoxpan, 72760 San Andrés Cholula, Pue. | Google Maps |
| Teléfono | +52 222 403 8215 | Google Maps, OpenTable |
| Google Place ID | `ChIJx97Phd3Gz4URxQ35fzo0TQo` | Verificado abriéndolo en Google Maps |
| Enlace para reseñar | <https://search.google.com/local/writereview?placeid=ChIJx97Phd3Gz4URxQ35fzo0TQo> | Construido con el Place ID |

Si el local cambia de perfil en Google, solo actualiza `googlePlaceId` en `js/config.js` (se obtiene con el [Place ID Finder de Google](https://developers.google.com/maps/documentation/places/web-service/place-id)).
