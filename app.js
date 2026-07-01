/* =========================================================
   Lançamentos — app.js
   Vanilla JS. No frameworks, no external libraries.
   ========================================================= */

'use strict';

/* -----------------------------------------------------------
   CONFIG
   Cole aqui a URL da sua API publicada no Google Apps Script.
   ----------------------------------------------------------- */
const API_URL = 'https://script.google.com/macros/s/AKfycbzNJlO7BguV86ev-8HLi3XKioMPh4RwjcHhG2RqBKr10ah3tpmFNWuYNAmWD-L3bDbQ8w/exec';

/* -----------------------------------------------------------
   Elements
   ----------------------------------------------------------- */
const card = document.getElementById('card');
const segments = Array.from(document.querySelectorAll('.segment'));
const segmentGlide = document.getElementById('segmentGlide');

const valorInput = document.getElementById('valor');
const descricaoInput = document.getElementById('descricao');
const categoriaSelect = document.getElementById('categoria');
const pessoaSelect = document.getElementById('pessoa');

const saveBtn = document.getElementById('saveBtn');
const spinner = document.getElementById('spinner');
const feedback = document.getElementById('feedback');

const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

let selectedTipo = null; // 'receita' | 'despesa'

/* -----------------------------------------------------------
   Theme (light / dark) — persisted in localStorage
   ----------------------------------------------------------- */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
  themeToggle.setAttribute(
    'aria-label',
    theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'
  );
}

function initTheme() {
  const saved = localStorage.getItem('lancamentos-theme');
  if (saved) {
    applyTheme(saved);
    return;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('lancamentos-theme', next);
});

initTheme();

/* -----------------------------------------------------------
   Tipo segmented control
   ----------------------------------------------------------- */
function selectTipo(tipo) {
  selectedTipo = tipo;
  card.setAttribute('data-tipo', tipo);

  segments.forEach((seg) => {
    const isActive = seg.dataset.tipo === tipo;
    seg.setAttribute('aria-checked', String(isActive));
  });

  segmentGlide.classList.add('is-active');
  segmentGlide.classList.toggle('pos-despesa', tipo === 'despesa');
  segmentGlide.classList.toggle('pos-receita', tipo === 'receita');

  clearFieldError(document.querySelector('.segmented'));
}

segments.forEach((seg) => {
  seg.addEventListener('click', () => selectTipo(seg.dataset.tipo));
});

/* -----------------------------------------------------------
   Currency mask (formato monetário brasileiro)
   User types digits only; we render as 0,00 -> 1.234,56
   ----------------------------------------------------------- */
function formatCentsToBRL(cents) {
  const value = (cents / 100).toFixed(2);
  const [intPart, decPart] = value.split('.');
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${withThousands},${decPart}`;
}

function centsFromInput(el) {
  const digits = el.value.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

valorInput.addEventListener('input', () => {
  const cents = centsFromInput(valorInput);
  valorInput.value = cents ? formatCentsToBRL(cents) : '';
  clearFieldError(valorInput.closest('.amount-field'));
});

valorInput.addEventListener('keydown', (e) => {
  const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
  if (allowed.includes(e.key)) return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
});

/* -----------------------------------------------------------
   Clear validation state as the person fixes a field
   ----------------------------------------------------------- */
[descricaoInput, categoriaSelect, pessoaSelect].forEach((el) => {
  const evt = el.tagName === 'SELECT' ? 'change' : 'input';
  el.addEventListener(evt, () => clearFieldError(el.closest('.field')));
});

function markFieldError(container) {
  if (!container) return;
  container.classList.add('field-invalid');
}

function clearFieldError(container) {
  if (!container) return;
  container.classList.remove('field-invalid');
}

function clearAllFieldErrors() {
  document.querySelectorAll('.field-invalid').forEach((el) => el.classList.remove('field-invalid'));
}

/* -----------------------------------------------------------
   Feedback banner
   ----------------------------------------------------------- */
let feedbackTimer = null;

function showFeedback(message, type) {
  clearTimeout(feedbackTimer);
  feedback.textContent = message;
  feedback.className = `feedback show ${type}`;

  feedbackTimer = setTimeout(() => {
    feedback.classList.remove('show');
  }, 4200);
}

/* -----------------------------------------------------------
   Validation
   ----------------------------------------------------------- */
function validate() {
  let firstInvalid = null;
  let ok = true;

  const cents = centsFromInput(valorInput);
  if (cents <= 0) {
    markFieldError(valorInput.closest('.amount-field'));
    firstInvalid = firstInvalid || valorInput;
    ok = false;
  }

  if (!descricaoInput.value.trim()) {
    markFieldError(descricaoInput.closest('.field'));
    firstInvalid = firstInvalid || descricaoInput;
    ok = false;
  }

  if (!categoriaSelect.value) {
    markFieldError(categoriaSelect.closest('.field'));
    firstInvalid = firstInvalid || categoriaSelect;
    ok = false;
  }

  if (!pessoaSelect.value) {
    markFieldError(pessoaSelect.closest('.field'));
    firstInvalid = firstInvalid || pessoaSelect;
    ok = false;
  }

  if (!selectedTipo) {
    markFieldError(document.querySelector('.segmented'));
    firstInvalid = firstInvalid || document.querySelector('.segmented');
    ok = false;
  }

  return { ok, firstInvalid };
}

/* -----------------------------------------------------------
   Date helper — AAAA-MM-DD, fuso local
   ----------------------------------------------------------- */
function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/* -----------------------------------------------------------
   Submit
   ----------------------------------------------------------- */
function setLoading(isLoading) {
  saveBtn.disabled = isLoading;
  saveBtn.classList.toggle('loading', isLoading);
}

async function handleSave() {
  const { ok, firstInvalid } = validate();

  if (!ok) {
    saveBtn.classList.remove('shake');
    void saveBtn.offsetWidth; // restart animation
    saveBtn.classList.add('shake');
    showFeedback('Confira os campos destacados antes de salvar.', 'error');
    if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
    return;
  }

  if (!API_URL || API_URL === 'COLE_AQUI_A_URL_DO_APPS_SCRIPT') {
    showFeedback('Configure a URL da API no arquivo app.js.', 'error');
    return;
  }

  const payload = {
    data: todayISO(),
    descricao: descricaoInput.value.trim(),
    categoria: categoriaSelect.value,
    pessoa: pessoaSelect.value,
    tipo: selectedTipo === 'receita' ? 'Receita' : 'Despesa',
    valor: (centsFromInput(valorInput) / 100).toFixed(2),
  };

  setLoading(true);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Resposta inesperada da API');

    showFeedback('Lançamento salvo com sucesso!', 'success');
    resetForm();
  } catch (err) {
    showFeedback('Não foi possível salvar agora. Tente novamente.', 'error');
  } finally {
    setLoading(false);
  }
}

saveBtn.addEventListener('click', handleSave);

/* -----------------------------------------------------------
   Reset form after a successful save
   ----------------------------------------------------------- */
function resetForm() {
  valorInput.value = '';
  descricaoInput.value = '';
  categoriaSelect.selectedIndex = 0;
  pessoaSelect.selectedIndex = 0;
  clearAllFieldErrors();
  descricaoInput.focus();
}

/* -----------------------------------------------------------
   PWA — register service worker
   ----------------------------------------------------------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {
      /* falha silenciosa: app continua funcionando online */
    });
  });
}
