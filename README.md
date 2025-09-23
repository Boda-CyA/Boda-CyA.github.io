# Boda Carmen & Alfredo — Invitación personalizada

Este sitio está optimizado para GitHub Pages y permite personalizar la invitación en función del invitado que visita la URL.

## Personalización automática

- La app detecta el slug a partir de `window.location.pathname` y busca una coincidencia exacta (sin distinguir mayúsculas/minúsculas) en `data/invitados.json`.
- Cuando se encuentra un invitado, se genera automáticamente el saludo, el cuerpo del mensaje y el llamado a la acción combinando los campos `relation`, `treatment`, `seats`, `displayName` y `whatsapp`.
  - Las familias reciben un saludo en plural (“Querida Familia…”) y las amistades un saludo cercano (“Hola…”).
  - El cuerpo del mensaje adapta el tono para grupos, parejas o invitaciones individuales y menciona la cantidad de lugares asignados cuando existe ese dato.
  - Si hay un número de WhatsApp válido se habilita un botón que abre `wa.me` con un mensaje personalizado; en caso contrario se muestra un botón para copiar el enlace y un aviso para compartir datos de contacto.
- El texto para WhatsApp se construye a partir de la plantilla configurable en el panel de administración usando los marcadores `{name}`, `{url}`, `{seats}`, `{fecha}` y `{lugar}` además de `{greeting}` y `{body}`.
- Cuando no hay slug, no existe coincidencia o ocurre un error de red, se muestra la versión genérica sin interrumpir la experiencia.
- Los datos se guardan en `sessionStorage` al usar rutas bonitas. Un `404.html` redirige al `index.html` conservando la ruta, para que refrescar en `/slug` siga funcionando.

## Estructura de datos (`data/invitados.json`)

Cada invitado es un objeto con los campos:

- `slug` (string, obligatorio): identificador único en minúsculas y con guiones.
- `displayName` (string, opcional): nombre a mostrar en la invitación. Si falta, se utiliza “Invitad@”.
- `relation` (string, opcional): permite distinguir entre `familia` y `amigo`. Cualquier otro valor se trata como `amigo`.
- `treatment` (string, opcional): define si la invitación es `grupal`, `acompanado` o `individual`. Los valores desconocidos se consideran `individual`.
- `seats` (number, opcional): número de lugares asignados. Si no existe, simplemente se omite esa línea del mensaje.
- `whatsapp` (string en formato E.164, opcional): teléfono que se convierte en enlace `wa.me/52XXXXXXXXXX`. Si no se puede normalizar se considera inexistente.
- `note` (string, opcional): mensaje adicional que aparece debajo del saludo personalizado.
- `token` (string o array de strings, opcional): si se define, la URL debe incluir `?t=TOKEN` para que se aplique la personalización.

### Reglas de copy

- **Saludo.** Las familias reciben “Querida Familia {Apellido(s)}” salvo que el nombre ya incluya la palabra “Familia”. Las amistades reciben “Hola {displayName}”. Si no hay nombre se utiliza “Invitad@”.
- **Tratamiento.**
  - `grupal`: el mensaje se redacta en plural y, cuando existen lugares, se indica “Tienen {seats} lugares reservados…”.
  - `acompanado`: se comunica que la invitación es para dos personas (“tú y tu acompañante”) y, si hay dato de lugares, se especifica cuántos están reservados.
  - `individual`: se enfatiza que la invitación es personal; si hay un lugar se menciona “1 lugar reservado especialmente para ti”.
- **Fecha y sede.** Siempre se cierra con “La cita es el 8 de noviembre de 2025 en Villa La Perla (Reserva La Calixtina, Calvillo). 💍”.
- **CTA.**
  - Con número válido de WhatsApp se muestra el botón “Confirmar por WhatsApp” y se genera un enlace `wa.me` con un mensaje prellenado.
  - Sin número de WhatsApp se oculta dicho botón, se ofrece “Copiar enlace” y se invita a compartir datos de contacto.

### Plantilla de WhatsApp

- El panel de administración permite editar la plantilla que se usa para el mensaje de `wa.me`.
- Están disponibles los marcadores `{greeting}`, `{body}`, `{name}`, `{url}`, `{seats}`, `{fecha}` y `{lugar}`. Las líneas vacías duplicadas se limpian automáticamente.
- Por defecto la plantilla es:

  ```text
  {greeting}

  {body}

  Confirma tu asistencia aquí: {url}
  ```

- Si la plantilla resultante no contiene texto, el botón de WhatsApp se deshabilita automáticamente.

## Panel de administración

- `admin-invitados.html` permite cargar el JSON desde la web o desde un archivo local, filtrar invitados y visualizar la información relevante de cada fila.
- La vista previa se actualiza al seleccionar un invitado, mostrando el saludo, el cuerpo del mensaje, los lugares asignados, el enlace personalizado y el texto final de WhatsApp.
- La columna “Acciones” mantiene los botones para abrir la URL personalizada, copiarla o lanzar el mensaje de WhatsApp ya prellenado.
- El campo “Base URL del sitio” controla la raíz utilizada para construir `{baseUrl}/{slug}`; se recomienda ingresar la URL sin la barra final.

## Cómo añadir o editar invitados

1. Edita `data/invitados.json` y agrega un nuevo objeto siguiendo la estructura anterior.
2. Cuida que cada `slug` sea único y evita exponer datos sensibles adicionales.
3. Mantén el archivo por debajo de 50–100 KB; si la lista crece demasiado, considera dividirla por inicial.
4. Guarda el archivo con codificación UTF-8 para conservar acentos y caracteres especiales.

### Construcción del slug

1. Parte del nombre del invitado o familia.
2. Convierte el texto a minúsculas.
3. Sustituye espacios y caracteres especiales por guiones (`-`).
4. Elimina acentos y símbolos no alfanuméricos.
5. (Recomendado) Añade un sufijo corto aleatorio para que el slug no sea trivial, por ejemplo `familia-guzman-cuellar-9k7a`.

## Configuración de rutas (basePath)

- El atributo `data-base-path` del elemento `<html>` en `index.html` y `404.html` permite indicar si el sitio se publica en una subcarpeta (p. ej. `/mi-sitio`).
- Déjalo vacío (`""`) cuando se despliega en la raíz de GitHub Pages (caso de repositorios `<usuario>.github.io`).
- Si cambias el valor, usa el mismo en ambos archivos para que la detección de slug y la redirección del `404.html` se mantengan sincronizadas.

## URLs de prueba

- `/` → vista genérica.
- `/familia-guzman-cuellar` → invitación personalizada completa.
- `/maria-y-luis` → invitado sin nota, con botón de WhatsApp.
- `/familia-ramirez-ortega-9k7a` → invitado con nota y botón.
- `/amigos-ana-y-paco` → invitado sin número de WhatsApp (botón oculto).
- `/slug-inexistente` → se muestra la versión genérica.

## Recomendaciones para el deploy

- Verifica que GitHub Pages sirva `data/invitados.json` con MIME `application/json`.
- Gracias al `fetch` con `cache: 'no-store'`, el navegador consulta la última versión del archivo en cada visita.
- Comprueba en móviles iOS/Android y navegadores principales que las rutas directas (`/slug`) carguen correctamente tras el redirect del `404.html`.
