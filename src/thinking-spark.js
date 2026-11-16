/**
 * <thinking-spark> — zero-dependency animated "thinking" indicators.
 * Starburst artwork: original vector by the thinking-spark author (MIT).
 * Independent implementation. Not affiliated with Anthropic.
 */

const VARIANTS = ["breathe", "orbit", "shimmer", "pulse", "typing"];
const SVG_NS = "http://www.w3.org/2000/svg";

// Hand-drawn 30-unit starburst, placed with scale(3.05) translate(-12 -12) at (64,64).
const DRAWN_STAR = "m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z";

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

const KEY_TIMES = [0, 0.08, 0.12, 0.2, 0.245, 0.27, 0.34, 0.72, 0.78, 0.815, 0.84, 0.91, 0.97, 1];
const ORBIT_DUR = 3600;

function keys(values, render) {
  return values.map(function (v, i) { return Object.assign({ offset: KEY_TIMES[i] }, render(v)); });
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
  ".stroke-tail { fill: none; stroke: url(#ts-tail); stroke-width: 4.5; stroke-linecap: round; opacity: 0.86; }",
  ".spin, .grow, .star { transform-box: view-box; transform-origin: 64px 64px; }",
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
  get paused() { return this.hasAttribute("paused"); }

  connectedCallback() {
    if (!this._ready) this._build();
    this._applyAttrs();
    this._play();
  }
  disconnectedCallback() { this._stop(); }

  attributeChangedCallback(name) {
    if (!this._ready) return;
    if (name === "variant") { this._applyAttrs(); this._play(); return; }
    this._applyAttrs();
    if (name === "paused") for (const a of this._anims) this.paused ? a.pause() : a.play();
  }

  _build() {
    this._ready = true;
    const style = document.createElement("style");
    style.textContent = STYLE;

    const svg = el("svg", { viewBox: "0 0 128 128", role: "img", focusable: "false" });
    this._svg = svg;

    const defs = el("defs");
    const grad = el("linearGradient", { id: "ts-tail", x1: -18, y1: -11, x2: 0, y2: -21, gradientUnits: "userSpaceOnUse" });
    grad.appendChild(el("stop", { offset: 0, "stop-color": "currentColor", "stop-opacity": 0 }));
    grad.appendChild(el("stop", { offset: 0.55, "stop-color": "currentColor", "stop-opacity": 0.21 }));
    grad.appendChild(el("stop", { offset: 1, "stop-color": "currentColor", "stop-opacity": 0.72 }));
    defs.appendChild(grad);
    svg.appendChild(defs);

    const star = el("g", { "class": "star" });
    const starInner = el("g", { transform: "translate(64 64)" });
    starInner.appendChild(el("path", { "class": "fill", d: DRAWN_STAR, transform: "scale(3.05) translate(-12 -12)" }));
    star.appendChild(starInner);
    this._star = star;

    const dot = el("circle", { "class": "fill", cx: 64, cy: 64, r: 4 });
    this._dot = dot;

    const ring = el("g", { "class": "ring" });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ring.appendChild(el("circle", { "class": "fill", cx: (64 + Math.cos(a) * 50).toFixed(2), cy: (64 + Math.sin(a) * 50).toFixed(2), r: 2.7 }));
    }
    this._ring = ring;

    const orbit = el("g", { "class": "orbit" });
    const grow = el("g", { "class": "grow" });
    const spin = el("g", { "class": "spin" });
    for (let i = 0; i < 3; i++) {
      const arm = el("g", { transform: "translate(64 64) rotate(" + i * 120 + ")" });
      arm.appendChild(el("path", { "class": "stroke-tail", d: "M -17.9,-10.7 A 20.7,20.7 0 0 1 0,-20.7" }));
      arm.appendChild(el("circle", { "class": "fill", cx: 0, cy: -20.7, r: 4.2 }));
      spin.appendChild(arm);
    }
    grow.appendChild(spin);
    orbit.appendChild(grow);
    this._orbit = orbit;
    this._grow = grow;
    this._spin = spin;

    const pulse = el("g", { "class": "pulse" });
    for (let i = 0; i < 3; i++) pulse.appendChild(el("circle", { "class": "fill pdot", cx: 28 + i * 36, cy: 64, r: 9 }));
    this._pulse = pulse;

    const typing = el("g", { "class": "typing" });
    for (let i = 0; i < 3; i++) typing.appendChild(el("circle", { "class": "fill tdot", cx: 28 + i * 36, cy: 69, r: 9 }));
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
      default: show.star = show.dot = true; break;
    }
    const map = [["star", this._star], ["ring", this._ring], ["orbit", this._orbit], ["dot", this._dot], ["pulse", this._pulse], ["typing", this._typing]];
    for (const pair of map) pair[1].classList.toggle("hide", !show[pair[0]]);
  }

  _stop() { for (const a of this._anims) a.cancel(); this._anims = []; }

  _animate(node, keyframes, options) {
    const anim = node.animate(keyframes, Object.assign({ easing: "linear" }, options));
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
    const S = function (v) { return "scale(" + v + ")"; };

    switch (this.variant) {
      case "orbit": {
        this._animate(this._star, keys([1, 1, 1.028, 0.52, 0.1, 0.028, 0.028, 0.028, 0.028, 0.028, 0.1, 0.73, 1, 1], function (v) { return { transform: S(v) }; }), loop(ORBIT_DUR));
        this._animate(this._star, keys([1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0.9, 1, 1, 1], function (v) { return { opacity: v }; }), loop(ORBIT_DUR));
        this._animate(this._dot, keys([0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0], function (v) { return { opacity: v }; }), loop(ORBIT_DUR));
        this._animate(this._grow, keys([0, 0, 0, 0, 0, 0.02, 1, 1, 0.65, 0.02, 0, 0, 0, 0], function (v) { return { transform: S(v) }; }), loop(ORBIT_DUR));
        this._animate(this._orbit, keys([0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0], function (v) { return { opacity: v }; }), loop(ORBIT_DUR));
        this._animate(this._spin, keys([0, 0, 0, 0, 0, 0, 24, 660, 775, 790, 790, 790, 790, 790], function (v) { return { transform: "rotate(" + v + "deg)" }; }), loop(ORBIT_DUR));
        break;
      }
      case "shimmer": {
        const D = 1800;
        this._animate(this._star, [
          { transform: S(1), opacity: 1, offset: 0 },
          { transform: S(0.55), opacity: 0, offset: 0.3 },
          { transform: S(0.55), opacity: 0, offset: 0.7 },
          { transform: S(1), opacity: 1, offset: 1 },
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
            { transform: S(0.5), opacity: 0.35, offset: 0 },
            { transform: S(1), opacity: 1, offset: 0.35 },
            { transform: S(0.5), opacity: 0.35, offset: 0.7 },
            { transform: S(0.5), opacity: 0.35, offset: 1 },
          ], Object.assign({}, loop(1400), { delay: i * 160 }));
        }
        break;
      }
      case "typing": {
        const dots = this.shadowRoot.querySelectorAll(".tdot");
        for (let i = 0; i < dots.length; i++) {
          this._animate(dots[i], [
            { transform: "translateY(0px)", opacity: 0.4, offset: 0 },
            { transform: "translateY(-9px)", opacity: 1, offset: 0.3 },
            { transform: "translateY(0px)", opacity: 0.4, offset: 0.6 },
            { transform: "translateY(0px)", opacity: 0.4, offset: 1 },
          ], Object.assign({}, loop(900), { delay: i * 140 }));
        }
        break;
      }
      default: {
        this._animate(this._star, [
          { transform: S(1), opacity: 1, offset: 0 },
          { transform: S(0.42), opacity: 0.95, offset: 0.5 },
          { transform: S(1), opacity: 1, offset: 1 },
        ], loop(2200));
        this._animate(this._dot, [
          { transform: S(0.4), opacity: 0, offset: 0 },
          { transform: S(1), opacity: 0, offset: 0.35 },
          { transform: S(1), opacity: 0.9, offset: 0.5 },
          { transform: S(1), opacity: 0, offset: 0.65 },
          { transform: S(0.4), opacity: 0, offset: 1 },
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
