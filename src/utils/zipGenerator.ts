/**
 * @file zipGenerator.ts
 * @description Generador client-side del archivo ZIP del módulo para AX Manager, KernelSU, APatch y Magisk.
 * Lee dinámicamente los archivos reales de /ax_module/ mediante import.meta.glob(?raw) en Vite
 * (sin copias hardcodeadas desincronizadas), normaliza saltos de línea a UNIX (LF), valida seguridad
 * y asigna permisos POSIX (0755 para scripts/update-binary y 0644 para configuraciones/WebUI).
 */

import JSZip from 'jszip';
import { validateScriptSecurity } from './moduleData';

export const MODULE_ZIP_FILENAME = 'ax_mali_core_optimizer_v1.4.0.zip';

/**
 * Carga en tiempo de build todos los archivos reales dentro de /ax_module/.
 * En entornos Node.js puros (como node:test / tsx), import.meta.glob no existe,
 * por lo que se captura la excepción y las pruebas pueden pasar un mapa explícito a buildModuleZipBlob.
 */
let bundledAxModuleFiles: Record<string, string> = {};
try {
  bundledAxModuleFiles = import.meta.glob('/ax_module/**/*', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;
} catch {
  bundledAxModuleFiles = {};
}

/**
 * Normaliza las rutas eliminando el prefijo '/ax_module/' para que todos los archivos
 * queden en la raíz del ZIP y convierte finales de línea CRLF a LF (formato UNIX obligatorio en Android).
 */
export function normalizeZipEntries(rawEntries: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [rawPath, content] of Object.entries(rawEntries)) {
    const cleanPath = rawPath
      .replace(/\\/g, '/')
      .replace(/^\/?ax_module\//, '')
      .replace(/^\/+/, '');

    if (!cleanPath) continue;
    normalized[cleanPath] = content.replace(/\r\n/g, '\n');
  }

  return normalized;
}

/**
 * Determina los permisos POSIX UNIX adecuados para cada archivo del módulo Android.
 */
export function getUnixPermissionsForPath(relativePath: string): string {
  if (
    relativePath.endsWith('.sh') ||
    relativePath === 'META-INF/com/google/android/update-binary'
  ) {
    return '755';
  }
  return '644';
}

/**
 * Lista ordenada de rutas relativas incluidas desde /ax_module/.
 */
export function getBundledModulePaths(): string[] {
  return Object.keys(normalizeZipEntries(bundledAxModuleFiles)).sort();
}

/**
 * Construye el Blob del archivo ZIP a partir de un diccionario de archivos reales de /ax_module/.
 * Verifica integridad mínima (module.prop en raíz, scripts principales, update-binary y WebUI)
 * y ejecuta validación de seguridad antes de empaquetar.
 */
export async function buildModuleZipBlob(rawEntries: Record<string, string>): Promise<Blob> {
  const entries = normalizeZipEntries(rawEntries);
  const paths = Object.keys(entries).sort();

  if (paths.length === 0) {
    throw new Error('No se encontraron archivos reales de /ax_module/ para empaquetar.');
  }

  if (!entries['module.prop']) {
    throw new Error('Falta module.prop en la raíz del módulo.');
  }

  if (!entries['module.prop'].startsWith('id=')) {
    throw new Error('module.prop debe comenzar estrictamente con "id=" en la línea 1.');
  }

  if (!entries['META-INF/com/google/android/update-binary']) {
    throw new Error('Falta META-INF/com/google/android/update-binary en el paquete.');
  }

  if (!entries['webroot/index.html']) {
    throw new Error('Falta webroot/index.html en el paquete.');
  }

  const zip = new JSZip();

  for (const relativePath of paths) {
    const content = entries[relativePath];
    const security = validateScriptSecurity(content);
    if (!security.isValid) {
      throw new Error(`Archivo bloqueado por seguridad (${relativePath}): ${security.reason}`);
    }

    zip.file(relativePath, content, {
      unixPermissions: getUnixPermissionsForPath(relativePath),
    });
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
    platform: 'UNIX',
  });
}

/**
 * Genera el Blob ZIP usando directamente los archivos reales empaquetados desde /ax_module/.
 */
export async function generateModuleZipBlob(): Promise<Blob> {
  return await buildModuleZipBlob(bundledAxModuleFiles);
}

/**
 * Genera y dispara la descarga directa del archivo ZIP del módulo en el navegador móvil/desktop.
 */
export async function downloadModuleZip(): Promise<void> {
  const blob = await generateModuleZipBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = MODULE_ZIP_FILENAME;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
