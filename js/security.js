/**
 * سكربت حماية الموقع من الفحص وسرقة الكود
 * - منع كليك يمين (Right Click)
 * - تعطيل اختصارات المطورين (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S)
 * - تجميد أدوات المطورين في حال تم فتحها بالقوة (Debugger Loop)
 * - تنظيف وتعطيل الـ Console بالكامل
 */

(function () {
  'use strict';

  // 1. منع كليك يمين (Inspect Element)
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  }, { capture: true });

  // 2. منع اختصارات لوحة المفاتيح الخاصة بالمطورين
  document.addEventListener('keydown', function (e) {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // اختصارات مع Ctrl أو Meta
    if (e.ctrlKey || e.metaKey) {
      // Ctrl + Shift + I (Inspect)
      // Ctrl + Shift + J (Console)
      // Ctrl + Shift + C (Element Inspector)
      if (e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl + U (View Page Source)
      if (e.key === 'U' || e.key === 'u' || e.keyCode === 85) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl + S (Save Webpage)
      if (e.key === 'S' || e.key === 's' || e.keyCode === 83) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  }, { capture: true });

  // 3. تعطيل أدوات الـ Console بالكامل
  try {
    const noop = function () {};
    const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'dir', 'clear', 'trace'];
    methods.forEach(function (m) {
      window.console[m] = noop;
    });
  } catch (err) {}

  // 4. فخ تجميد DevTools (Debugger Trap) لمن يحاول فتح الـ Sources بالقوة
  setInterval(function () {
    const startTime = performance.now();
    (function () {}.constructor("debugger")());
    const endTime = performance.now();
    if (endTime - startTime > 100) {
      window.console.clear();
    }
  }, 1000);

})();
