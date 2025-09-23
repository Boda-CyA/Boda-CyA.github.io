# Boda Carmen & Alfredo — Invitación personalizada

Este sitio está optimizado para GitHub Pages y permite personalizar la invitación en función del invitado que visita la URL.

## Personalización automática

- La app detecta el slug a partir de `window.location.pathname` y busca una coincidencia exacta (sin distinguir mayúsculas/minúsculas) en `data/invitados.json`.
- Si el slug existe, se muestran nombre, lugares reservados, nota especial y un botón de confirmación por WhatsApp con mensaje prellenado.
- Cuando no hay slug, no existe coincidencia o ocurre un error de red, se muestra la versión genérica sin interrumpir la experiencia.
- Los datos se guardan en `sessionStorage` al usar rutas bonitas. Un `404.html` redirige al `index.html` conservando la ruta, para que refrescar en `/slug` siga funcionando.

## Estructura de datos (`data/invitados.json`)

Cada invitado es un objeto con los campos:

- `slug` (string, obligatorio): identificador único en minúsculas y con guiones.
- `displayName` (string, obligatorio): nombre que se mostrará en la invitación.
- `seats` (number, obligatorio): cantidad de lugares reservados.
- `note` (string, opcional): mensaje adicional que aparecerá debajo del saludo.
- `whatsapp` (string en formato E.164, opcional): teléfono para el botón "Confirmar por WhatsApp". Si no se especifica, el botón no se muestra.
- `token` (string o array de strings, opcional): si se define, la URL debe incluir `?t=TOKEN` para que se aplique la personalización.

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
