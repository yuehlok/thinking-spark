import '../src/thinking-spark.js';

const VARIANTS = ['breathe', 'orbit', 'shimmer', 'pulse', 'typing'];
const LABELS = {
  breathe: 'breathe · 2.2s',
  orbit: 'orbit · 3.6s',
  shimmer: 'shimmer · 1.8s',
  pulse: 'pulse · 1.4s',
  typing: 'typing · 0.9s',
};

const grid = document.getElementById('grid');
for (const v of VARIANTS) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = '<div class="stage"></div><div class="name">' + LABELS[v] + '</div>';
  const stage = card.querySelector('.stage');
  const spark = document.createElement('thinking-spark');
  spark.setAttribute('variant', v);
  spark.setAttribute('size', '40');
  stage.appendChild(spark);
  grid.appendChild(card);
}

const sparks = () => Array.from(document.querySelectorAll('thinking-spark'));
const size = document.getElementById('size');
const sizeOut = document.getElementById('sizeOut');
const speed = document.getElementById('speed');
const speedOut = document.getElementById('speedOut');
const color = document.getElementById('color');
const pause = document.getElementById('pause');
const theme = document.getElementById('theme');

size.addEventListener('input', () => {
  sizeOut.value = size.value;
  for (const s of sparks()) { if (s.closest('.hero')) continue; s.setAttribute('size', size.value); }
});
speed.addEventListener('input', () => {
  speedOut.value = speed.value;
  for (const s of sparks()) s.setAttribute('speed', speed.value);
});
color.addEventListener('input', () => {
  for (const s of sparks()) s.setAttribute('color', color.value);
});
pause.addEventListener('click', () => {
  for (const s of sparks()) s.toggleAttribute('paused');
});
theme.addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'light' : 'dark';
});
