<p align="center">
  <img src="assets/banner.jpg?v=2" alt="ClawCore Banner" width="100%" />
</p>

# ClawCore 🦐

> Una versión core de [OpenClaw](https://github.com/openclaw/openclaw) — un asistente IA con alma.

[English](README.md) | [中文](README_CN.md) | [日本語](README_JA.md) | [한국어](README_KO.md) | [Español](README_ES.md)

ClawCore extrae el alma de OpenClaw en un asistente personal de IA mínimo y autónomo. Mantiene el sistema de personalidad que hace que la IA se sienta viva, eliminando la complejidad de infraestructura.

## 🎯 ¿Por qué ClawCore?

### Diferencias principales con OpenClaw

| 🦐 ClawCore | 🦞 OpenClaw |
|------------|------------|
| **Memoria basada en índice** — `MEMORY_INDEX.md` como tabla de contenidos, sin BD vectorial | Búsqueda vectorial híbrida + modelos de embedding |
| **Heartbeat ligero** — Simple temporizador `setInterval` | Sistema cron completo + sub-agentes |
| **Carpetas humano-IA separadas** — Archivos del usuario son de solo lectura | Espacio de trabajo compartido |
| **Banco de trabajo por tareas** — Una carpeta por tarea con gestión de ciclo de vida | Sin concepto de carpeta de tareas |
| **Seguridad de archivos por diseño** — La IA nunca modifica originales, solo copias | Acceso más amplio al sistema de archivos |
| **Funciona en tu PC diario** — Sin necesidad de máquina dedicada | Diseñado para servidores |

### 🔒 Seguro para tu computadora personal

- **`user/` es de solo lectura.** La IA puede leer tus PDFs y documentos Word, pero físicamente no puede escribir en ellos.
- **El procesamiento ocurre en `workbench/`.** ¿Necesita editar un archivo? La IA lo copia primero a una carpeta de tarea.
- **Cada acción tiene límites de permisos.** Aplicado a nivel de código — no por confianza, sino por código.

## 🚀 Inicio rápido

```bash
git clone https://github.com/dataelement/ClawCore.git
cd ClawCore
npm install
npm run dev
```

En la primera ejecución:
1. Configura tu clave API del LLM
2. Conversación de "despertar" del AI para autodescubrimiento
3. Crea el espacio de trabajo en `~/Desktop/ClawCore/`

## ✨ Características

| Característica | Descripción |
|---------------|-------------|
| 🧬 **Sistema de Alma** | La IA desarrolla su personalidad vía `SOUL.md` |
| 🪪 **Despertar de Identidad** | Ritual de autodescubrimiento en la primera ejecución |
| 🧠 **Memoria basada en índice** | `MEMORY_INDEX.md` como índice, carga bajo demanda |
| 🔧 **Sistema de Habilidades** | La IA puede crear y evolucionar habilidades, registrado en `SKILL_LOG.md` |
| 📁 **Bóveda de Usuario** | Archivos de usuario solo lectura |
| 🛠️ **Banco de Trabajo** | Carpetas por tarea + gestión de ciclo de vida |
| 💓 **Escaneo Heartbeat** | Escaneos autónomos periódicos, tareas con prefijo 🤖 |

## 🛡️ Seguridad

- **Acceso a archivos** — Resuelve enlaces simbólicos antes de verificar rutas
- **Comandos shell** — Lista blanca (`ls`,`cat`) / Lista negra (`rm`,`curl`) / Confirmación del usuario

## 🤝 Agradecimientos

Inspirado por [OpenClaw](https://github.com/openclaw/openclaw) y su visión de asistentes IA con personalidad genuina.

## 📜 Licencia

MIT
