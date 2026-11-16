/**
 * <thinking-spark> — zero-dependency animated "thinking" indicators.
 * Independent implementation. Not affiliated with Anthropic.
 * MIT License.
 */

const VARIANTS = ["breathe", "orbit", "shimmer", "pulse", "typing"];
const SVG_NS = "http://www.w3.org/2000/svg";

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build a procedural starburst path (100x100 box, centred at 50,50).
 * @param {object} [opts]
 * @param {number} [opts.rays=11]     number of long rays
 * @param {number} [opts.inner=0.46]  inner radius ratio
 * @param {number} [opts.jitter=0.14] length jitter (0 keeps it perfectly regular)
 * @param {number} [opts.seed=7]      PRNG seed
 * @param {number} [opts.outer=46]    outer radius
 */
export function starPath(opts = {}) {
  const rays = opts.rays == null ? 11 : opts.rays;
  const inner = opts.inner == null ? 0.46 : opts.inner;
  const jitter = opts.jitter == null ? 0.14 : opts.jitter;
  const seed = opts.seed == null ? 7 : opts.seed;
  const outer = opts.outer == null ? 46 : opts.outer;
  const rand = mulberry32(seed);
  const points = [];
  for (let i = 0; i < rays * 2; i++) {
    const angle = (Math.PI * i) / rays - Math.PI / 2;
    const base = i % 2 === 0 ? outer : outer * inner;
    const radius = base * (1 + (rand() - 0.5) * jitter * 2);
    points.push([50 + Math.cos(angle) * radius, 50 + Math.sin(angle) * radius]);
  }
  return "M" + points.map(function (p) { return p[0].toFixed(2) + " " + p[1].toFixed(2); }).join("L") + "Z";
}

function el(name, attrs) {
  const node = document.createElementNS(SVG_NS, name);
  if (attrs) for (const k in attrs) node.setAttribute(k, String(attrs[k]));
  return node;
}

function arcPath(fromDeg, toDeg, radius) {
  const rad = function (d) { return ((d - 90) * Math.PI) / 180; };
  const x1 = 50 + Math.cos(rad(fromDeg)) * radius;
  const y1 = 50 + Math.sin(rad(fromDeg)) * radius;
  const x2 = 50 + Math.cos(rad(toDeg)) * radius;
  const y2 = 50 + Math.sin(rad(toDeg)) * radius;
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  return "M" + x1.toFixed(2) + " " + y1.toFixed(2) + "A" + radius + " " + radius + " 0 " + large + " 1 " + x2.toFixed(2) + " " + y2.toFixed(2);
}

const STYLE = [
  ":host {",
  "  --ts-color: #d97757;",
  "  --ts-size: 24px;",
  "  display: inline-flex;",
  "  width: var(--ts-size);",
  "  height: var(--ts-size);",
  "  color: var(--ts-color);",
  "  vertical-align: -0.15em;",
  "  line-height: 0;",
  "}",
  ":host([hidden]) { display: none; }",
  "svg { display: block; width: 100%; height: 100%; overflow: visible; }",
  ".fill { fill: currentColor; }",
  ".stroke { fill: none; stroke: currentColor; stroke-linecap: round; }",
  "[transform-box] { transform-box: view-box; transform-origin: 50% 50%; }",
  ".hide { display: none; }",
].join("\n");

const HTMLElementBase = typeof HTMLElement === "undefined" ? class {} : HTMLElement;

class ThinkingSpark extends HTMLElementBase {
  static get observedAttributes() {
    return ["variant", "size", "color", "speed", "label", "paused"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._anims = [];
    this._ready = false;
  }

  get variant() {
    const v = this.getAttribute("variant") || "breathe";
    return VARIANTS.indexOf(v) >= 0 ? v : "breathe";
  }
  get speed() {
    const n = Number(this.getAttribute("speed"));
    return Number.isFinite(n) && n > 0 ? n : 1;
  }
  get paused() {
    return this.hasAttribute("paused");
  }

  connectedCallback() {
    if (!this._ready) this._build();
    this._applyAttrs();
    this._play();
  }

  disconnectedCallback() {
    this._stop();
  }

  attributeChangedCallback(name) {
    if (!this._ready) return;
    if (name === "variant") {
      this._applyAttrs();
      this._play();
      return;
    }
    this._applyAttrs();
    if (name === "paused") {
      for (const a of this._anims) this.paused ? a.pause() : a.play();
    }
  }

  _build() {
    this._ready = true;
    const style = document.createElement("style");
    style.textContent = STYLE;

    const svg = el("svg", { viewBox: "0 0 100 100", role: "img", focusable: "false" });
    this._svg = svg;

    const star = el("g", { "class": "star", "transform-box": "fill-box" });
    star.appendChild(el("path", { "class": "fill", d: starPath({ seed: 7 }) }));
    this._star = star;

    const ring = el("g", { "class": "ring", "transform-box": "fill-box" });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ring.appendChild(el("circle", { "class": "fill", cx: (50 + Math.cos(a) * 39).toFixed(2), cy: (50 + Math.sin(a) * 39).toFixed(2), r: 2.1 }));
    }
    this._ring = ring;

    const orbit = el("g", { "class": "orbit", "transform-box": "fill-box" });
    for (let i = 0; i < 3; i++) {
      const a0 = i * 120;
      orbit.appendChild(el("path", { "class": "stroke tail", d: arcPath(a0 - 64, a0 - 6, 34), "stroke-width": 3, opacity: 0.35 }));
    }
    for (let i = 0; i < 3; i++) {
      const a = ((i * 120 - 90) * Math.PI) / 180;
      orbit.appendChild(el("circle", { "class": "fill odot", cx: (50 + Math.cos(a) * 34).toFixed(2), cy: (50 + Math.sin(a) * 34).toFixed(2), r: 5.4 }));
    }
    this._orbit = orbit;

    const dot = el("circle", { "class": "fill dot", cx: 50, cy: 50, r: 9 });
    this._dot = dot;

    const pulse = el("g", { "class": "pulse" });
    for (let i = 0; i < 3; i++) pulse.appendChild(el("circle", { "class": "fill pdot", cx: 22 + i * 28, cy: 50, r: 7 }));
    this._pulse = pulse;

    const typing = el("g", { "class": "typing" });
    for (let i = 0; i < 3; i++) typing.appendChild(el("circle", { "class": "fill tdot", cx: 22 + i * 28, cy: 54, r: 7 }));
    this._typing = typing;

    svg.append(star, ring, orbit, dot, pulse, typing);
    this.shadowRoot.append(style, svg);
  }

  _applyAttrs() {
    const size = this.getAttribute("size");
    this.style.setProperty("--ts-size", size ? (/^\d+$/.test(size) ? size + "px" : size) : "24px");
    if (this.getAttribute("color")) this.style.setProperty("--ts-color", this.getAttribute("color"));

    const label = this.getAttribute("label");
    const ariaLabel = label == null ? "Thinking" : label;
    this._svg.setAttribute("aria-label", ariaLabel);
    this._svg.setAttribute("role", ariaLabel === "none" ? "presentation" : "img");

    const show = { star: false, ring: false, orbit: false, dot: false, pulse: false, typing: false };
    switch (this.variant) {
      case "orbit": show.star = show.orbit = show.dot = true; break;
      case "shimmer": show.star = show.ring = true; break;
      case "pulse": show.pulse = true; break;
      case "typing": show.typing = true; break;
      default: show.star = true; break;
    }
    const map = [["star", this._star], ["ring", this._ring], ["orbit", this._orbit], ["dot", this._dot], ["pulse", this._pulse], ["typing", this._typing]];
    for (const pair of map) pair[1].classList.toggle("hide", !show[pair[0]]);
  }

  _stop() {
    for (const a of this._anims) a.cancel();
    this._anims = [];
  }

  _animate(node, keyframes, options) {
    const opts = Object.assign({ easing: "ease-in-out" }, options);
    const anim = node.animate(keyframes, opts);
    anim.playbackRate = this.speed;
    if (this.paused) anim.pause();
    this._anims.push(anim);
    return anim;
  }

  _play() {
    this._stop();
    if (!this._ready) return;
    const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const loop = function (ms) { return { duration: ms, iterations: Infinity }; };
    const T = function (s) { return "scale(" + s + ")"; };

    switch (this.variant) {
      case "orbit": {
        const D = 3600;
        this._animate(this._star, [
          { transform: T(1), opacity: 1, offset: 0 },
          { transform: T(0.34), opacity: 1, offset: 0.1 },
          { transform: T(0.3), opacity: 0, offset: 0.16 },
          { transform: T(0.3), opacity: 0, offset: 0.8 },
          { transform: T(0.34), opacity: 1, offset: 0.86 },
          { transform: T(1), opacity: 1, offset: 1 },
        ], loop(D));
        this._animate(this._dot, [
          { transform: T(0.2), opacity: 0, offset: 0 },
          { transform: T(1), opacity: 1, offset: 0.1 },
          { transform: T(1), opacity: 1, offset: 0.78 },
          { transform: T(0.2), opacity: 0, offset: 0.86 },
          { transform: T(0.2), opacity: 0, offset: 1 },
        ], loop(D));
        this._animate(this._orbit, [
          { transform: "rotate(0deg) " + T(0.25), opacity: 0, offset: 0 },
          { transform: "rotate(0deg) " + T(1), opacity: 0, offset: 0.12 },
          { transform: "rotate(-40deg) " + T(1), opacity: 1, offset: 0.2 },
          { transform: "rotate(250deg) " + T(1), opacity: 1, offset: 0.72 },
          { transform: "rotate(300deg) " + T(0.25), opacity: 0, offset: 0.82 },
          { transform: "rotate(300deg) " + T(0.25), opacity: 0, offset: 1 },
        ], Object.assign({}, loop(D), { easing: "linear" }));
        break;
      }
      case "shimmer": {
        const D = 1800;
        this._animate(this._star, [
          { transform: T(1), opacity: 1, offset: 0 },
          { transform: T(0.55), opacity: 0, offset: 0.3 },
          { transform: T(0.55), opacity: 0, offset: 0.7 },
          { transform: T(1), opacity: 1, offset: 1 },
        ], loop(D));
        this._animate(this._ring, [
          { transform: "rotate(0deg)", opacity: 0, offset: 0 },
          { transform: "rotate(20deg)", opacity: 0, offset: 0.22 },
          { transform: "rotate(100deg)", opacity: 1, offset: 0.38 },
          { transform: "rotate(220deg)", opacity: 1, offset: 0.66 },
          { transform: "rotate(250deg)", opacity: 0, offset: 0.76 },
          { transform: "rotate(250deg)", opacity: 0, offset: 1 },
        ], loop(D));
        break;
      }
      case "pulse": {
        const dots = this.shadowRoot.querySelectorAll(".pdot");
        for (let i = 0; i < dots.length; i++) {
          this._animate(dots[i], [
            { transform: T(0.5), opacity: 0.35, offset: 0 },
            { transform: T(1), opacity: 1, offset: 0.35 },
            { transform: T(0.5), opacity: 0.35, offset: 0.7 },
            { transform: T(0.5), opacity: 0.35, offset: 1 },
          ], Object.assign({}, loop(1400), { delay: i * 160 }));
        }
        break;
      }
      case "typing": {
        const dots = this.shadowRoot.querySelectorAll(".tdot");
        for (let i = 0; i < dots.length; i++) {
          this._animate(dots[i], [
            { transform: "translateY(0px)", opacity: 0.4, offset: 0 },
            { transform: "translateY(-7px)", opacity: 1, offset: 0.3 },
            { transform: "translateY(0px)", opacity: 0.4, offset: 0.6 },
            { transform: "translateY(0px)", opacity: 0.4, offset: 1 },
          ], Object.assign({}, loop(900), { delay: i * 140 }));
        }
        break;
      }
      default: {
        this._animate(this._star, [
          { transform: T(1), opacity: 1, offset: 0 },
          { transform: T(0.42), opacity: 0.95, offset: 0.5 },
          { transform: T(1), opacity: 1, offset: 1 },
        ], loop(2200));
        break;
      }
    }
  }
}

if (typeof customElements !== "undefined" && !customElements.get("thinking-spark")) {
  customElements.define("thinking-spark", ThinkingSpark);
}

export { VARIANTS };
export default ThinkingSpark;
