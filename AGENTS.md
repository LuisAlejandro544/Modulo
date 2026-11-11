# 🤖 Guía de Directrices para Agentes de IA (AGENTS.md)

Este documento instruye a cualquier agente autónomo o ingeniero de software de IA que intervenga en este repositorio.

---

## 📋 Protocolo de Desarrollo y Ciclo de Vida

1. **Razonar antes de escribir:**
   - Analiza el impacto de cada cambio en los scripts de Android antes de tocar archivos.
   - Todo cambio en scripts debe preservar la compatibilidad con dispositivos de 32-bit (`armeabi-v7a`) y 64-bit (`arm64-v8a`).

2. **No cambiar el diseño visual a menos que el usuario lo solicite expresamente:**
   - Mantén la coherencia visual con Tailwind CSS, el esquema de colores de alto contraste (slate-950 con acentos en cyan/emerald) y la navegación por pestañas modulares.
   - Evita el minimalismo extremo: las pantallas deben tener contenido técnico denso, botones bien definidos y explicaciones pedagógicas de cada función.

3. **Desarrollo Modular (Evitar el colapso de la aplicación):**
   - No concentres lógica compleja en un solo archivo masivo.
   - Separa la lógica de utilidades en `src/utils/` y los componentes en `src/components/`.
   - Escribe comentarios claros en español explicando el "por qué" y el "para qué" de cada bloque de código.

4. **Reglas de Ejecución y Pruebas Unitarias:**
   - Antes de finalizar cualquier turno de código, ejecuta los unit tests desacoplados:
     ```bash
     npx --yes tsx --test src/utils/moduleData.test.ts
     ```
   - Ejecuta siempre `compile_applet` y `lint_applet` para garantizar que TypeScript no contenga errores de tipado o imports rotos.

5. **Regla de Auditoría de Seguridad Permanente:**
   - Antes de hacer commit o cerrar una respuesta, ejecuta un grep para comprobar que **NO exista ninguna referencia a `persist.sys.`**:
     ```bash
     grep -rnE "persist\.sys\." ax_module/ src/
     ```
   - Si se detecta alguna, debe ser eliminada de inmediato.

6. **Gestión del archivo commit_message.txt:**
   - Si existe un archivo `commit_message.txt`, asegúrate de que su información esté completamente en español. No lo modifiques ni lo actualices a menos que el usuario lo solicite explícitamente.
