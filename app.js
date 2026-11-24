(function () {
  'use strict';

  const exprEl = document.getElementById('expr');
  const resultEl = document.getElementById('result');
  const keys = document.querySelector('.keys');

  const MAX_LEN = 40;     // इनपुट की सीमा, ताकि display न टूटे
  let expr = '';          // ASCII expression: digits . ( ) + - * /
  let justEvaluated = false;

  // ---------- Display ----------
  function pretty(s) {
    return s.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−');
  }

  function show() {
    const text = expr ? pretty(expr) : '0';
    exprEl.textContent = '';
    resultEl.textContent = text;
    resultEl.classList.remove('error');
    resultEl.classList.toggle('long', text.length > 10);
  }

  function showError(msg) {
    exprEl.textContent = '';
    resultEl.textContent = msg;
    resultEl.classList.add('error');
    resultEl.classList.remove('long');
  }

  // ---------- Input ----------
  function input(v) {
    if (expr.length >= MAX_LEN) return;
    if (justEvaluated && /[0-9.(]/.test(v)) expr = '';   // result के बाद नया नंबर
    justEvaluated = false;
    expr += v;
    show();
  }

  function backspace() {
    if (justEvaluated) expr = '';
    else expr = expr.slice(0, -1);
    justEvaluated = false;
    show();
  }

  function clearAll() {
    expr = '';
    justEvaluated = false;
    show();
  }

  // expression के आखिर वाला नंबर (जिसमें . हो सकता है) और उसकी शुरुआत
  function lastNumber(s) {
    const m = /(\d*\.?\d*)$/.exec(s);
    return m && m[1] !== '' ? { text: m[1], index: m.index } : null;
  }

  // ± : नंबर का चिन्ह बदलें
  function toggleSign() {
    if (!expr) return;
    justEvaluated = false;

    // पूरा expression सिर्फ़ एक नंबर है: 5 ↔ -5
    if (/^-?\d*\.?\d*$/.test(expr)) {
      expr = expr.startsWith('-') ? expr.slice(1) : '-' + expr;
      show();
      return;
    }

    // (-3) को वापस 3 करें
    const wrapped = /\(-(\d*\.?\d*)\)$/.exec(expr);
    if (wrapped) {
      expr = expr.slice(0, wrapped.index) + wrapped[1];
      show();
      return;
    }

    // आखिरी नंबर को (-n) में बदलें, ताकि 5-(-3) जैसे expression सही चलें
    const num = lastNumber(expr);
    if (!num) return;
    expr = expr.slice(0, num.index) + '(-' + num.text + ')';
    show();
  }

  // % : आखिरी नंबर को 100 से भाग दें
  function percent() {
    if (!expr) return;
    const num = lastNumber(expr);
    if (!num) return;
    try {
      const v = Number(num.text) / 100;
      expr = expr.slice(0, num.index) + fmt(v);
      justEvaluated = false;
      show();
    } catch (err) {
      showError(err.message);
    }
  }

  // ---------- Result formatting ----------
  // exponent (1e+21) वाला नंबर वापस expression में नहीं जा सकता, इसलिए उसे रोकते हैं
  function fmt(v) {
    if (!Number.isFinite(v)) throw new Error('Result बहुत बड़ा है');
    let s = String(Number(v.toPrecision(12)));   // 0.1+0.2 → 0.3
    if (s.includes('e')) s = v.toFixed(12).replace(/\.?0+$/, '');   // बहुत छोटे नंबर
    if (s.includes('e')) throw new Error('Result बहुत बड़ा है');
    return s;
  }

  // = : evaluate करें
  function equals() {
    if (!expr) return;
    try {
      const value = evaluate(expr);
      const text = pretty(fmt(value));
      exprEl.textContent = pretty(expr) + ' =';
      resultEl.textContent = text;
      resultEl.classList.remove('error');
      resultEl.classList.toggle('long', text.length > 10);
      expr = fmt(value);
      justEvaluated = true;
    } catch (err) {
      // expression वैसा ही रहता है ताकि यूज़र उसे ठीक कर सके
      showError(err.message);
    }
  }

  // ---------- Safe evaluator (eval का इस्तेमाल नहीं) ----------
  // Grammar:
  //   expr   := term (('+'|'-') term)*
  //   term   := factor (('*'|'/') factor)*
  //   factor := ('-'|'+') factor | '(' expr ')' | number
  function evaluate(src) {
    let i = 0;
    const peek = () => src[i];

    function parseExpr() {
      let v = parseTerm();
      while (peek() === '+' || peek() === '-') {
        const op = src[i++];
        const r = parseTerm();
        v = op === '+' ? v + r : v - r;
      }
      return v;
    }

    function parseTerm() {
      let v = parseFactor();
      while (peek() === '*' || peek() === '/') {
        const op = src[i++];
        const r = parseFactor();
        if (op === '/') {
          if (r === 0) throw new Error('0 से भाग नहीं हो सकता');
          v /= r;
        } else {
          v *= r;
        }
      }
      return v;
    }

    function parseFactor() {
      if (peek() === '-') { i++; return -parseFactor(); }
      if (peek() === '+') { i++; return parseFactor(); }
      if (peek() === '(') {
        i++;
        const v = parseExpr();
        if (peek() !== ')') throw new Error('")" गायब है');
        i++;
        return v;
      }
      const start = i;
      while (i < src.length && /[0-9.]/.test(src[i])) i++;
      if (start === i) throw new Error('गलत expression');
      const n = Number(src.slice(start, i));
      if (Number.isNaN(n)) throw new Error('गलत नंबर');
      return n;
    }

    const result = parseExpr();
    if (i !== src.length) throw new Error('गलत expression');
    return result;
  }

  // ---------- Buttons ----------
  const ACTIONS = {
    clear: clearAll,
    back: backspace,
    equals: equals,
    sign: toggleSign,
    percent: percent
  };

  keys.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.value !== undefined) input(btn.dataset.value);
    else if (ACTIONS[btn.dataset.action]) ACTIONS[btn.dataset.action]();
  });

  // ---------- Keyboard ----------
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (/^[0-9.()+\-*\/]$/.test(k)) { e.preventDefault(); input(k); }
    else if (k === 'x' || k === 'X') { e.preventDefault(); input('*'); }
    else if (k === '%') { e.preventDefault(); percent(); }
    else if (k === 'Enter' || k === '=') { e.preventDefault(); equals(); }
    else if (k === 'Backspace') { e.preventDefault(); backspace(); }
    else if (k === 'Escape' || k === 'Delete') { clearAll(); }
  });

  show();
})();
