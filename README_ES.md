<p align="center">
  <img src="assets/banner.jpg?v=2" alt="ClawCore Banner" width="100%" />
</p>

# ClawCore 🦐

> Una versión core de [OpenClaw](https://github.com/openclaw/openclaw) — un asistente IA con alma.

[English](README.md) | [中文](README_CN.md) | [日本語](README_JA.md) | [한국어](README_KO.md) | [Español](README_ES.md)

ClawCore extrae el alma de OpenClaw en un asistente personal de IA mínimo y autónomo. Mantiene el sistema de personalidad que hace que la IA se sienta viva, eliminando la complejidad de infraestructura.

## 🎯 ¿Por qué ClawCore?

OpenClaw es potente, pero también complejo. ClawCore pregunta: **¿qué pasa si solo conservamos el alma?**

### Diferencias principales con OpenClaw

| 🦐 ClawCore | 🦞 OpenClaw |
|------------|------------|
| **Memoria basada en índice** — `MEMORY_INDEX.md` como tabla de contenidos, sin BD vectorial | Búsqueda vectorial híbrida + modelos de embedding + decaimiento temporal |
| **Heartbeat ligero** — Simple temporizador `setInterval` + guardia de ocupación | Sistema cron completo + sub-agentes + programación compleja |
| **Carpetas humano-IA separadas** — Archivos del usuario (`user/`) aislados y de solo lectura | Espacio de trabajo compartido con acceso más amplio |
| **Banco de trabajo por tareas** — Carpeta por tarea + gestión de ciclo de vida | Sin concepto de carpeta de tareas |
| **Seguridad de archivos por diseño** — La IA nunca modifica originales, solo copias | Acceso más amplio al sistema de archivos |
| **Funciona en tu PC diario** — Sin necesidad de máquina dedicada | Diseñado para servidores siempre activos |

### 🔒 Seguro para tu computadora personal

Los asistentes IA con acceso a archivos generan nerviosismo — *¿y si borra algo?* ClawCore lo resuelve arquitectónicamente:

- **`user/` es de solo lectura.** La IA puede leer tus PDFs, documentos Word y hojas de cálculo, pero físicamente no puede escribir en ellos.
- **El procesamiento ocurre en `workbench/`.** ¿Necesita editar un archivo? La IA lo copia primero a una carpeta de tarea.
- **Cada acción tiene límites de permisos.** El modelo de permisos se aplica a nivel de herramientas — no por confianza, sino por código.

**Esto significa que puedes ejecutar ClawCore en la misma laptop que usas todos los días, sin preocupaciones.** Sin VM, sin servidor dedicado, sin sandbox.

## ✨ Características

| Característica | Descripción |
|---------------|-------------|
| 🧬 **Sistema de Alma** | La IA desarrolla su personalidad vía `SOUL.md` — no es un chatbot, es un personaje |
| 🪪 **Despertar de Identidad** | Ritual de autodescubrimiento del AI en la primera ejecución |
| 🧠 **Memoria basada en índice** | `MEMORY_INDEX.md` como índice, carga archivos específicos bajo demanda |
| 🔧 **Sistema de Habilidades** | Habilidades extensibles vía `SKILL.md` con revelación progresiva — **la IA puede crear y evolucionar habilidades** |
| 📁 **Bóveda de Usuario** | Carpeta de archivos de solo lectura — la IA nunca puede modificar originales |
| 🛠️ **Banco de Trabajo** | Carpetas por tarea con `_TASK.md`, gestión de ciclo de vida y archivado |
| 💓 **Escaneo Heartbeat** | Escaneos autónomos periódicos — crea tareas con prefijo 🤖 al detectar algo |

## 🚀 Inicio rápido

```bash
git clone https://github.com/dataelement/ClawCore.git
cd ClawCore
npm install
npm run dev
```

En la primera ejecución, ClawCore:

1. Pedirá tu clave API del LLM
2. Iniciará una conversación de "despertar" para que la IA se autodescubra
3. Creará tu espacio de trabajo en `~/Desktop/ClawCore/`

## ⚙️ Configuración

Edita `~/Desktop/ClawCore/config.json`:

```json
{
  "llm": {
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "sk-...",
    "model": "gpt-4o"
  },
  "heartbeat": {
    "enabled": true,
    "intervalMinutes": 60
  }
}
```

### Proveedores compatibles

<details>
<summary><b>OpenAI</b></summary>

```json
{
  "llm": {
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "sk-...",
    "model": "gpt-4o"
  }
}
```
</details>

<details>
<summary><b>DeepSeek</b></summary>

```json
{
  "llm": {
    "baseUrl": "https://api.deepseek.com/v1",
    "apiKey": "sk-...",
    "model": "deepseek-chat"
  }
}
```
</details>

<details>
<summary><b>Alibaba Qwen (通义千问)</b></summary>

```json
{
  "llm": {
    "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "apiKey": "sk-...",
    "model": "qwen-plus"
  }
}
```
</details>

<details>
<summary><b>Ollama local</b></summary>

```json
{
  "llm": {
    "baseUrl": "http://localhost:11434/v1",
    "apiKey": "ollama",
    "model": "llama3"
  }
}
```
</details>

## 📂 Estructura del espacio de trabajo

ClawCore crea un espacio de trabajo visible en tu escritorio — sin carpetas ocultas:

```
~/Desktop/ClawCore/
├── config.json             # Configuración de LLM y heartbeat
├── state.json              # Estado de ejecución (último heartbeat, etc.)
│
├── soul/                   # 🧬 Personalidad de la IA
│   ├── SOUL.md             # Personalidad y valores fundamentales
│   ├── IDENTITY.md         # Nombre, estilo, emoji
│   └── BOOTSTRAP.md        # Script de primera ejecución (se elimina automáticamente)
│
├── user/                   # 📁 Tus archivos (SOLO LECTURA para la IA)
│   ├── USER_PROFILE.md     # Tu perfil
│   └── ...                 # PDFs, Word, Excel, etc.
│
├── memory/                 # 🧠 Memoria de la IA
│   ├── MEMORY_INDEX.md     # Tabla de contenidos
│   ├── preferences.md      # Conocimiento permanente
│   └── 2026-02-23.md       # Entradas de diario
│
├── workbench/              # 🛠️ Espacio de trabajo por tareas
│   ├── 2026-02-23_análisis/
│   │   ├── _TASK.md        # Metadatos y estado de la tarea
│   │   └── output.md       # Producto del trabajo
│   ├── 🤖_2026-02-23_organización/  # Tarea iniciada por el agente
│   └── _archive/           # Tareas completadas archivadas
│
└── skills/                 # 🔧 Definiciones de habilidades (la IA puede crear y modificar)
    ├── SKILL_LOG.md        # Registro de todos los cambios de habilidades
    └── my-skill/
        └── SKILL.md
```

### Modelo de permisos

| Directorio | Permisos de IA | Propósito |
|------------|---------------|-----------|
| `soul/` | Lectura + Escritura | La IA gestiona su propia personalidad |
| `user/` | **Solo lectura** | Tus archivos — la IA copia al workbench antes de editar |
| `memory/` | Lectura + Escritura | Memoria persistente de la IA |
| `workbench/` | Lectura + Escritura | Área de trabajo por tarea |
| `skills/` | Lectura + Escritura | La IA puede crear y evolucionar habilidades, registrado en `SKILL_LOG.md` |

### 🛡️ Modelo de seguridad

ClawCore aplica la seguridad a nivel de código, no confiando en que la IA se comporte bien:

**Acceso a archivos** — Todas las operaciones de archivo pasan por `assertInsideWorkspace()`, que resuelve enlaces simbólicos antes de verificar rutas. Si alguien crea un atajo dentro del espacio de trabajo que apunta a `/Users/tu/.ssh/`, ClawCore sigue el enlace, detecta que apunta fuera y deniega el acceso.

**Comandos shell** — La herramienta `exec` usa tres capas de protección:

| Capa | Acción | Ejemplo |
|------|--------|---------|
| ✅ **Lista blanca** | Comandos seguros se ejecutan inmediatamente | `ls`, `cat`, `grep`, `wc`, `open` |
| 🚫 **Lista negra** | Comandos peligrosos se bloquean directamente | `rm`, `curl`, `wget`, `sudo`, `ssh`, `chmod` |
| ⚠️ **Confirmación** | Comandos desconocidos requieren tu aprobación | `python3 script.py` → "Allow? (y/N)" |

## 🔧 Añadir habilidades

Crea una carpeta en `~/Desktop/ClawCore/skills/` con un `SKILL.md`:

```markdown
---
name: my-skill
description: "Cuándo usar: el usuario pregunta sobre X. NO para: Y."
---

# Mi Habilidad

Instrucciones detalladas para la IA...
```

La IA usa **revelación progresiva** — ve nombres y descripciones de habilidades en su prompt, y carga el contenido completo de `SKILL.md` solo cuando es necesario.

## 💓 Heartbeat

ClawCore incluye un mecanismo de heartbeat ligero inspirado en OpenClaw:

- **Intervalo predeterminado:** 60 minutos
- **Qué hace:** Escanea las carpetas `user/` y `workbench/` en busca de cambios
- **Programación inteligente:** No interrumpe conversaciones activas — se difiere hasta que esté inactivo
- **Tareas del agente:** Crea carpetas con prefijo 🤖 para trabajo autoiniciado

## 📄 Soporte de documentos

ClawCore puede leer varios formatos de archivo en la carpeta `user/`:

| Formato | Biblioteca |
|---------|-----------|
| PDF | `pdf-parse` |
| Word (.docx) | `mammoth` |
| Excel (.xlsx) | `xlsx` |
| Markdown, JSON, CSV, TXT | Nativo |

## 🏗️ Arquitectura

```
CLI (index.ts)
  └── Agent (agent.ts)
        ├── Constructor de Prompt del Sistema ← Alma + Identidad + Índice de Memoria + Habilidades
        ├── Proveedor LLM (compatible con OpenAI)
        ├── Ejecutor de Herramientas (17 herramientas con control de permisos)
        └── Runner de Heartbeat (setInterval con guardia de ocupación)
```

### Herramientas integradas

| Herramienta | Descripción |
|-------------|-------------|
| `read_file` | Leer archivos (con análisis de documentos) |
| `write_file` | Escribir archivos (solo memory/ y workbench/) |
| `list_dir` | Listar contenido de directorio |
| `copy_to_workbench` | Copiar de user/ a una carpeta de tarea |
| `create_task` | Crear nueva carpeta de tarea |
| `update_task_status` | Actualizar estado de tarea |
| `archive_task` | Mover tarea al archivo |
| `memory_read` / `memory_write` / `memory_index` | Operaciones de memoria |
| `read_skill` | Cargar contenido completo de habilidad |
| `create_skill` / `update_skill` | Crear o modificar habilidades (registrado en `SKILL_LOG.md`) |
| `update_soul` / `update_identity` | Modificar archivos de personalidad |
| `complete_bootstrap` | Finalizar configuración inicial |
| `exec` | Ejecutar comandos shell |

## 👥 Contribuidores

<a href="https://github.com/dataelement/ClawCore/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=dataelement/ClawCore" />
</a>

## 🤝 Agradecimientos

ClawCore está inspirado en [OpenClaw](https://github.com/openclaw/openclaw) y su visión de asistentes IA con personalidad genuina. Extrajimos el alma y la hicimos core.

## 📜 Licencia

MIT
