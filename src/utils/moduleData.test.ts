import test from 'node:test';
import assert from 'node:assert/strict';
import { validateScriptSecurity, classifyAbi, MODULE_SCRIPTS } from './moduleData.ts';

test('Seguridad: detecta y prohíbe el uso de persist.sys.*', () => {
  const unsafeScript = `
    setprop persist.sys.game_boost 1
  `;
  const result = validateScriptSecurity(unsafeScript);
  assert.equal(result.isValid, false);
  assert.match(result.reason || '', /persist\.sys\./);
});

test('Seguridad: valida que touch_boost.sh esté 100% libre de persist.sys.*', () => {
  const touchScript = MODULE_SCRIPTS.find(s => s.name === 'touch_boost.sh');
  assert.ok(touchScript, 'touch_boost.sh debe existir');
  const result = validateScriptSecurity(touchScript.codeSnippet);
  assert.equal(result.isValid, true);
});

test('Arquitectura: clasifica correctamente 32-bit y 64-bit', () => {
  assert.equal(classifyAbi('arm64-v8a'), '64-bit');
  assert.equal(classifyAbi('armeabi-v7a'), '32-bit');
  assert.equal(classifyAbi('x86_64'), '64-bit');
  assert.equal(classifyAbi('desconocido'), 'unknown');
});

test('Módulo: contiene los 9 archivos completos incluyendo touch_boost.sh', () => {
  assert.equal(MODULE_SCRIPTS.length, 9);
  const names = MODULE_SCRIPTS.map(s => s.name);
  assert.ok(names.includes('touch_boost.sh'));
  assert.ok(names.includes('module.prop'));
  assert.ok(names.includes('customize.sh'));
  assert.ok(names.includes('service.sh'));
  assert.ok(names.includes('mali_common.sh'));
  assert.ok(names.includes('detect_gpu.sh'));
  assert.ok(names.includes('governor_tweak.sh'));
  assert.ok(names.includes('surface_tweak.sh'));
  assert.ok(names.includes('uninstall.sh'));
});
