(function () {
  const exprEl = document.getElementById('expr');
  const resultEl = document.getElementById('result');

  let expr = '';            // इंटरनल expression, जिसमें * / - + होते हैं
  let justEvaluated = false;

  // ---------- Display ----------
  function pretty(s) {
    return s.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−');
  }

  function showInput() {
    exprEl.textContent = '';
    resultEl.textContent = expr ? pretty(expr) : '0';
    resultEl.classList.remove('error');
  }

  // ---------- Input actions ----------
  function input(v) {
    if (justEvaluated && /[0-9.(]/.test(v)) expr = '';  // नया नंबर शुरू
    justEvaluated = false;
    expr += v;
    showInput();
  }

  function backspace() {
    if (justEvaluated) { expr = ''; justEvaluated = false; }
    else expr = expr.slice(0, -1);
    showInput();
  }

  function clearAll() {
    expr = '';
    justEvaluated = false;
    showInput();
  }

  function equals() {
    if (!expr) return;
    try {
      const value = evaluate(expr);
      const text = formatNumber(value);
      exprEl.textContent = pretty(expr) + ' =';
      resultEl.textContent = pretty(text);
      resultEl.classList.remove('error');
      expr = text;
      justEvaluated = true;
    } catch (err) {
      // expression वैसा ही रहता है ताकि यूज़र उसे ठीक कर सके
      exprEl.textContent = '';
      resultEl.textContent = err.message;
      resultEl.classList.add('error');
    }
  }

  function formatNumber(v) {
    if (!Number.isFinite(v)) throw new Error('Result बहुत बड़ा है');
    return String(Number(v.toPrecision(12)));   // 0.1+0.2 → 0.3
  }

  // ---------- Safe evaluator (eval का इस्तेमाल नहीं) ----------
  // Grammar:
  //   expr   := term (('+'|'-') term)*
  //   term   := factor (('*'|'/') factor)*
  //   factor := '-' factor | '(' expr ')' | number
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
          v = v / r;
        } else {
          v = v * r;
        }
      }
      return v;
    }

    function parseFactor() {
      if (peek() === '-') { i++; return -parseFactor(); }
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
  document.querySelector('.keys').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.value !== undefined) input(btn.dataset.value);
    else if (btn.dataset.action === 'clear') clearAll();
    else if (btn.dataset.action === 'back') backspace();
    else if (btn.dataset.action === 'equals') equals();
  });

  // ---------- Keyboard ----------
  document.addEventListener('keydown', (e) => {
    if (e.key.length === 1 && /[0-9+\-*/().]/.test(e.key)) {
      e.preventDefault();
      input(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      equals();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      backspace();
    } else if (e.key === 'Escape' || e.key === 'Delete') {
      clearAll();
    }
  });

  showInput();
})();
