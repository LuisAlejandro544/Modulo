import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { validateScriptSecurity, classifyAbi, MODULE_SCRIPTS } from './moduleData.ts';
import {
  buildModuleZipBlob,
  getUnixPermissionsForPath,
  normalizeZipEntries,
} from './zipGenerator.ts';

function collectAxModuleFiles(dir = 'ax_module'): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(dir)) return result;

  const walk = (currentDir: string) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        const unixKey = '/' + fullPath.replace(/\\/g, '/');
        result[unixKey] = fs.readFileSync(fullPath, 'utf-8');
      }
    }
  };

  walk(dir);
  return result;
}

test('Seguridad: detecta y prohíbe el uso de propiedades persistentes no permitidas', () => {
  const unsafeScript = `
    setprop ${['pers', 'ist', '.sys.', 'game_boost 1'].join('')}
  `;
  const result = validateScriptSecurity(unsafeScript);
  assert.equal(result.isValid, false);
});

test('Seguridad: todos los archivos físicos de ax_module/ están libres de propiedades prohibidas y placebos removidos', () => {
  const files = collectAxModuleFiles();
  const entries = Object.entries(files);
  assert.ok(entries.length >= 17, 'Deben existir los archivos reales de ax_module/');

  const removedPlacebos = [
    'view.touch_slop',
    'view.scroll_friction',
    'debug.input.velocitytracker.strategy',
    'touch.pressure.',
    'debug.mali.render_scale',
    'debug.mali.dvfs_floor',
    'debug.thermal.throttle',
    'ro.surface_flinger.supports_background_blur',
    'compact_memory',
  ];

  for (const [filePath, content] of entries) {
    assert.equal(
      validateScriptSecurity(content).isValid,
      true,
      `El archivo ${filePath} no debe contener propiedades permanentes prohibidas`
    );

    const executableLines = filePath.endsWith('.sh')
      ? content
          .split('\n')
          .filter((line) => !line.trimStart().startsWith('#'))
          .join('\n')
      : content;

    for (const placebo of removedPlacebos) {
      assert.equal(
        executableLines.includes(placebo),
        false,
        `El archivo ${filePath} no debe ejecutar el placebo eliminado "${placebo}"`
      );
    }
  }
});

test('Scripts reales: verificaciones críticas de lógica en touch_boost, fps_boost, ram_tweak, governor, angle y service.sh', () => {
  const touchContent = fs.readFileSync('ax_module/scripts/touch_boost.sh', 'utf-8');
  assert.ok(touchContent.includes('has_root'), 'touch_boost.sh debe distinguir Root de ADB');
  assert.ok(touchContent.includes('glove_mode'), 'touch_boost.sh debe incluir soporte de Glove Mode');
  assert.ok(touchContent.includes('/sys/module/ged/parameters/'), 'touch_boost.sh debe soportar MediaTek GED boost');
  assert.ok(touchContent.includes('/sys/kernel/fpsgo/'), 'touch_boost.sh debe soportar MediaTek FPSGO boost');

  const fpsContent = fs.readFileSync('ax_module/scripts/fps_boost.sh', 'utf-8');
  assert.ok(fpsContent.includes('RenderThread'), 'fps_boost.sh debe priorizar RenderThread');
  assert.ok(fpsContent.includes('chrt -f -p 99'), 'fps_boost.sh debe usar SCHED_FIFO 99');
  assert.ok(fpsContent.includes('disable_window_blurs'), 'fps_boost.sh debe usar disable_window_blurs');
  assert.ok(fpsContent.includes('BLUR=$(getprop debug.hwui.disable_draw_blur'), 'fps_boost.sh debe inicializar BLUR antes de imprimirlo');

  const ramContent = fs.readFileSync('ax_module/scripts/ram_tweak.sh', 'utf-8');
  assert.ok(ramContent.includes('freeze_background_apps'), 'ram_tweak.sh debe incluir freeze_background_apps');
  assert.ok(ramContent.includes('kill -STOP'), 'ram_tweak.sh debe usar SIGSTOP para pausar apps');
  assert.ok(ramContent.includes('kill -CONT'), 'ram_tweak.sh debe usar SIGCONT para reanudar apps');
  assert.ok(ramContent.includes('vm|boot'), 'ram_tweak.sh debe separar el modo vm para arranque seguro');

  const serviceContent = fs.readFileSync('ax_module/service.sh', 'utf-8');
  assert.ok(serviceContent.includes('ram_tweak.sh" vm 50'), 'service.sh debe usar modo vm y nunca congelar apps en el arranque');

  const govContent = fs.readFileSync('ax_module/scripts/governor_tweak.sh', 'utf-8');
  const govExecLines = govContent
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n');
  assert.equal(
    govExecLines.includes('custom_upbound_gpu_freq'),
    false,
    'governor_tweak.sh no debe escribir el techo custom_upbound_gpu_freq como piso'
  );
  assert.ok(govExecLines.includes('custom_boost_gpu_freq'), 'governor_tweak.sh debe usar custom_boost_gpu_freq');

  const angleContent = fs.readFileSync('ax_module/scripts/angle_tweak.sh', 'utf-8');
  assert.ok(angleContent.includes('4198400'), 'angle_tweak.sh debe validar el umbral 4198400 (Vulkan 1.1)');
  assert.ok(angleContent.includes('0x*'), 'angle_tweak.sh debe soportar valores Vulkan en hexadecimal');
});

test('WebUI ax_module/webroot/index.html: etiquetas section balanceadas, 10 pestañas reales y sin window.alert', () => {
  const html = fs.readFileSync('ax_module/webroot/index.html', 'utf-8');
  const openSections = (html.match(/<section\b/g) || []).length;
  const closeSections = (html.match(/<\/section>/g) || []).length;
  assert.equal(openSections, 10, 'Deben existir exactamente 10 secciones de pestañas en WebUI');
  assert.equal(openSections, closeSections, 'Las etiquetas <section> y </section> deben estar balanceadas');
  assert.equal(/\balert\s*\(/.test(html), false, 'WebUI no debe usar window.alert');
});

test('Arquitectura: clasifica correctamente 32-bit y 64-bit', () => {
  assert.equal(classifyAbi('arm64-v8a'), '64-bit');
  assert.equal(classifyAbi('armeabi-v7a'), '32-bit');
  assert.equal(classifyAbi('x86_64'), '64-bit');
  assert.equal(classifyAbi('desconocido'), 'unknown');
});

test('Módulo: MODULE_SCRIPTS contiene los 15 archivos documentados libres de placebos', () => {
  assert.equal(MODULE_SCRIPTS.length, 15);
  for (const script of MODULE_SCRIPTS) {
    assert.equal(validateScriptSecurity(script.codeSnippet).isValid, true);
  }
});

test('ZIP Generator: empaqueta los archivos reales de ax_module/ con rutas raíz, LF y permisos UNIX', async () => {
  const realFiles = collectAxModuleFiles();
  const normalized = normalizeZipEntries(realFiles);
  assert.ok(normalized['module.prop'], 'Debe normalizar module.prop en raíz');
  assert.equal(getUnixPermissionsForPath('scripts/fps_boost.sh'), '755');
  assert.equal(getUnixPermissionsForPath('META-INF/com/google/android/update-binary'), '755');
  assert.equal(getUnixPermissionsForPath('webroot/index.html'), '644');

  const blob = await buildModuleZipBlob(realFiles);
  const buffer = Buffer.from(await blob.arrayBuffer());
  const loadedZip = await JSZip.loadAsync(buffer);

  for (const [relPath, expectedContent] of Object.entries(normalized)) {
    const zipEntry = loadedZip.file(relPath);
    assert.ok(zipEntry, `El ZIP debe incluir el archivo real ${relPath}`);
    const actualContent = await zipEntry.async('string');
    assert.equal(
      actualContent,
      expectedContent.replace(/\r\n/g, '\n'),
      `El contenido empaquetado de ${relPath} debe coincidir exactamente con ax_module/`
    );
  }
});
