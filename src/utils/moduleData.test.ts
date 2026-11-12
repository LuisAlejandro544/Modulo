import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateScriptSecurity, classifyAbi, MODULE_SCRIPTS } from './moduleData.ts';

test('Seguridad: detecta y prohíbe el uso de propiedades persistentes no permitidas', () => {
  const unsafeScript = `
    setprop ${['pers', 'ist', '.sys.', 'game_boost 1'].join('')}
  `;
  const result = validateScriptSecurity(unsafeScript);
  assert.equal(result.isValid, false);
});

test('Seguridad: valida que fps_boost.sh esté 100% libre de propiedades no permitidas', () => {
  const fpsScript = MODULE_SCRIPTS.find(s => s.name === 'fps_boost.sh');
  assert.ok(fpsScript, 'fps_boost.sh debe existir');
  const result = validateScriptSecurity(fpsScript.codeSnippet);
  assert.equal(result.isValid, true);

  if (fs.existsSync('ax_module/scripts/fps_boost.sh')) {
    const fileContent = fs.readFileSync('ax_module/scripts/fps_boost.sh', 'utf-8');
    const fileResult = validateScriptSecurity(fileContent);
    assert.equal(fileResult.isValid, true, 'El archivo físico fps_boost.sh no debe contener persist.sys');
  }
});

test('Seguridad: valida que ram_tweak.sh esté 100% libre de propiedades no permitidas', () => {
  const ramScript = MODULE_SCRIPTS.find(s => s.name === 'ram_tweak.sh');
  assert.ok(ramScript, 'ram_tweak.sh debe existir');
  const result = validateScriptSecurity(ramScript.codeSnippet);
  assert.equal(result.isValid, true);

  if (fs.existsSync('ax_module/scripts/ram_tweak.sh')) {
    const fileContent = fs.readFileSync('ax_module/scripts/ram_tweak.sh', 'utf-8');
    const fileResult = validateScriptSecurity(fileContent);
    assert.equal(fileResult.isValid, true, 'El archivo físico ram_tweak.sh no debe contener persist.sys');
    assert.ok(fileContent.includes('freeze_background_apps'), 'ram_tweak.sh debe incluir freeze_background_apps');
    assert.ok(fileContent.includes('kill -STOP'), 'ram_tweak.sh debe usar SIGSTOP para pausar apps');
    assert.ok(fileContent.includes('kill -CONT'), 'ram_tweak.sh debe usar SIGCONT para reanudar apps');
  }
});

test('Seguridad: valida que governor_tweak.sh esté 100% libre de propiedades no permitidas', () => {
  const govScript = MODULE_SCRIPTS.find(s => s.name === 'governor_tweak.sh');
  assert.ok(govScript, 'governor_tweak.sh debe existir');
  const result = validateScriptSecurity(govScript.codeSnippet);
  assert.equal(result.isValid, true);

  if (fs.existsSync('ax_module/scripts/governor_tweak.sh')) {
    const fileContent = fs.readFileSync('ax_module/scripts/governor_tweak.sh', 'utf-8');
    const fileResult = validateScriptSecurity(fileContent);
    assert.equal(fileResult.isValid, true, 'El archivo físico governor_tweak.sh no debe contener persist.sys');
  }
});

test('Seguridad: valida que gms_shield.sh esté 100% libre de propiedades no permitidas', () => {
  const gmsScript = MODULE_SCRIPTS.find(s => s.name === 'gms_shield.sh');
  assert.ok(gmsScript, 'gms_shield.sh debe existir');
  const result = validateScriptSecurity(gmsScript.codeSnippet);
  assert.equal(result.isValid, true);

  if (fs.existsSync('ax_module/scripts/gms_shield.sh')) {
    const fileContent = fs.readFileSync('ax_module/scripts/gms_shield.sh', 'utf-8');
    const fileResult = validateScriptSecurity(fileContent);
    assert.equal(fileResult.isValid, true, 'El archivo físico gms_shield.sh no debe contener persist.sys');
  }
});

test('Seguridad: valida que angle_tweak.sh esté 100% libre de propiedades no permitidas y requiera Vulkan 1.1', () => {
  const angleScript = MODULE_SCRIPTS.find(s => s.name === 'angle_tweak.sh');
  assert.ok(angleScript, 'angle_tweak.sh debe existir');
  const result = validateScriptSecurity(angleScript.codeSnippet);
  assert.equal(result.isValid, true);

  if (fs.existsSync('ax_module/scripts/angle_tweak.sh')) {
    const fileContent = fs.readFileSync('ax_module/scripts/angle_tweak.sh', 'utf-8');
    const fileResult = validateScriptSecurity(fileContent);
    assert.equal(fileResult.isValid, true, 'El archivo físico angle_tweak.sh no debe contener persist.sys');
    assert.ok(fileContent.includes('4198400'), 'angle_tweak.sh debe validar el umbral 4198400 (Vulkan 1.1)');
  }
});

test('Seguridad: valida que touch_boost.sh y surface_tweak.sh estén 100% libres de propiedades no permitidas', () => {
  const touchScript = MODULE_SCRIPTS.find(s => s.name === 'touch_boost.sh');
  assert.ok(touchScript, 'touch_boost.sh debe existir');
  assert.equal(validateScriptSecurity(touchScript.codeSnippet).isValid, true);

  if (fs.existsSync('ax_module/scripts/touch_boost.sh')) {
    const fileContent = fs.readFileSync('ax_module/scripts/touch_boost.sh', 'utf-8');
    assert.equal(validateScriptSecurity(fileContent).isValid, true, 'touch_boost.sh no debe contener persist.sys');
    assert.ok(fileContent.includes('glove_mode'), 'touch_boost.sh debe incluir soporte de Glove Mode');
    assert.ok(fileContent.includes('impulse'), 'touch_boost.sh debe configurar VelocityTracker strategy impulse');
    assert.ok(fileContent.includes('scroll_friction'), 'touch_boost.sh debe ajustar view.scroll_friction a 0.005');
    assert.ok(fileContent.includes('/sys/module/ged/parameters/'), 'touch_boost.sh debe soportar MediaTek GED boost');
    assert.ok(fileContent.includes('/sys/kernel/fpsgo/'), 'touch_boost.sh debe soportar MediaTek FPSGO boost');
  }

  const surfaceScript = MODULE_SCRIPTS.find(s => s.name === 'surface_tweak.sh');
  assert.ok(surfaceScript, 'surface_tweak.sh debe existir');
  assert.equal(validateScriptSecurity(surfaceScript.codeSnippet).isValid, true);
});

test('Arquitectura: clasifica correctamente 32-bit y 64-bit', () => {
  assert.equal(classifyAbi('arm64-v8a'), '64-bit');
  assert.equal(classifyAbi('armeabi-v7a'), '32-bit');
  assert.equal(classifyAbi('x86_64'), '64-bit');
  assert.equal(classifyAbi('desconocido'), 'unknown');
});

test('Seguridad: valida que fps_boost.sh incluya SCHED_FIFO para RenderThread', () => {
  if (fs.existsSync('ax_module/scripts/fps_boost.sh')) {
    const fileContent = fs.readFileSync('ax_module/scripts/fps_boost.sh', 'utf-8');
    assert.ok(fileContent.includes('RenderThread'), 'fps_boost.sh debe priorizar RenderThread');
    assert.ok(fileContent.includes('chrt -f -p 99'), 'fps_boost.sh debe usar SCHED_FIFO 99');
  }
});

test('Seguridad: valida que io_aot_tweak.sh esté 100% libre de persist.sys y soporte AOT e I/O Readahead', () => {
  const ioScript = MODULE_SCRIPTS.find(s => s.name === 'io_aot_tweak.sh');
  assert.ok(ioScript, 'io_aot_tweak.sh debe existir en MODULE_SCRIPTS');
  assert.equal(validateScriptSecurity(ioScript.codeSnippet).isValid, true);

  if (fs.existsSync('ax_module/scripts/io_aot_tweak.sh')) {
    const fileContent = fs.readFileSync('ax_module/scripts/io_aot_tweak.sh', 'utf-8');
    assert.equal(validateScriptSecurity(fileContent).isValid, true, 'io_aot_tweak.sh no debe contener persist.sys');
    assert.ok(fileContent.includes('read_ahead_kb'), 'io_aot_tweak.sh debe configurar read_ahead_kb');
    assert.ok(fileContent.includes('iostats'), 'io_aot_tweak.sh debe desactivar iostats');
    assert.ok(fileContent.includes('cmd package compile -m'), 'io_aot_tweak.sh debe ejecutar compilación AOT');
  }
});

test('Seguridad: valida que thermal_tweak.sh esté 100% libre de persist.sys y anule limitadores de fabricante', () => {
  const thermalScript = MODULE_SCRIPTS.find(s => s.name === 'thermal_tweak.sh');
  assert.ok(thermalScript, 'thermal_tweak.sh debe existir en MODULE_SCRIPTS');
  assert.equal(validateScriptSecurity(thermalScript.codeSnippet).isValid, true);

  if (fs.existsSync('ax_module/scripts/thermal_tweak.sh')) {
    const fileContent = fs.readFileSync('ax_module/scripts/thermal_tweak.sh', 'utf-8');
    assert.equal(validateScriptSecurity(fileContent).isValid, true, 'thermal_tweak.sh no debe contener persist.sys');
    assert.ok(fileContent.includes('com.xiaomi.joyose'), 'thermal_tweak.sh debe apuntar a Joyose');
    assert.ok(fileContent.includes('dvfs_margin_value'), 'thermal_tweak.sh debe calibrar dvfs_margin_value');
    assert.ok(fileContent.includes('gpu_idle'), 'thermal_tweak.sh debe calibrar gpu_idle');
  }
});

test('Módulo: contiene los 15 archivos modulares completos', () => {
  assert.equal(MODULE_SCRIPTS.length, 15);
  const names = MODULE_SCRIPTS.map(s => s.name);
  assert.ok(names.includes('fps_boost.sh'));
  assert.ok(names.includes('touch_boost.sh'));
  assert.ok(names.includes('module.prop'));
  assert.ok(names.includes('customize.sh'));
  assert.ok(names.includes('service.sh'));
  assert.ok(names.includes('mali_common.sh'));
  assert.ok(names.includes('detect_gpu.sh'));
  assert.ok(names.includes('governor_tweak.sh'));
  assert.ok(names.includes('ram_tweak.sh'));
  assert.ok(names.includes('gms_shield.sh'));
  assert.ok(names.includes('angle_tweak.sh'));
  assert.ok(names.includes('io_aot_tweak.sh'));
  assert.ok(names.includes('thermal_tweak.sh'));
  assert.ok(names.includes('surface_tweak.sh'));
  assert.ok(names.includes('uninstall.sh'));
});
