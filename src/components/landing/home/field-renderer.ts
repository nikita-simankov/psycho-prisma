import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, Vector3, Vector4, WebGLRenderer } from "three";

// The hero's ridgeline: stacked score distributions, one line per team, drawn in a single
// fragment shader. Front rows hide the rows behind them, and one row (a single person's) is drawn
// in the accent colour with a tick at their score.
//
// The field is laid out inside a "slot" element, so the page's layout decides where it sits on
// every screen size. It moves on its own: with no input the rows lean towards a slowly wandering
// point, so the field is alive on phones too. A mouse, a finger dragged across the hero, or a tap
// (which sends a ripple through the rows) takes over from the wander; scrolling past the hero
// flattens the crowd until only the person's line stands.

const ROWS = 30;
// The highlighted row, counted from the front.
const PERSON_ROW = 6;
// Rendering cost grows with the square of this. Phones get more, since their canvas is small.
const MAX_PIXEL_RATIO = { small: 2, large: 1.5 };

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Per-row randomness comes from JavaScript as a uniform, not from a sin() hash, which breaks down
// on phone GPUs with low float precision.
const fragmentShader = /* glsl */ `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform vec4 uField;
  uniform vec2 uPointer;
  uniform float uPointerStrength;
  uniform vec3 uPulse;
  uniform float uTime;
  uniform float uReveal;
  uniform float uSettle;
  uniform vec3 uInk;
  uniform vec3 uAccent;
  uniform vec4 uRows[${ROWS}];

  const int ROWS = ${ROWS};
  const int PERSON = ${PERSON_ROW};

  float gauss(float x, float mu, float s) { float d = (x - mu) / s; return exp(-0.5 * d * d); }

  void main() {
    // Into the slot's coordinates: 0..1 across its width and from its bottom to its top.
    vec2 p = vec2((vUv.x - uField.x) / (uField.y - uField.x), (vUv.y - uField.z) / (uField.w - uField.z));
    if (p.y > 1.3 || p.y < -0.05 || p.x < 0.0 || p.x > 1.0) discard;
    float fieldHeight = uResolution.y * (uField.w - uField.z);
    float px = 1.0 / fieldHeight;
    float lineWidth = 1.1 * px;
    vec4 color = vec4(0.0);

    for (int i = 0; i < ROWS; i++) {
      float fi = float(i);
      vec4 row = uRows[i];
      float depth = fi / float(ROWS - 1);
      float baseline = mix(0.04, 0.78, pow(depth, 0.9));
      // Back rows are narrower, which reads as distance.
      float x = (p.x - 0.5) / mix(1.0, 0.74, depth) + 0.5;

      float isPerson = i == PERSON ? 1.0 : 0.0;
      float mu = mix(0.5 + (row.x - 0.5) * 0.26, 0.6, isPerson) + 0.014 * sin(uTime * 0.35 + row.w * 6.28);
      float lean = exp(-pow((baseline - uPointer.y) / 0.16, 2.0)) * uPointerStrength;
      mu = mix(mu, uPointer.x, lean * 0.45);
      float spread = 0.075 + row.y * 0.06;
      float shoulder = 0.28 * gauss(x, mu + (row.z - 0.5) * 0.3, spread * 1.6);
      // Rows rise from flat, front first.
      float rise = smoothstep(depth * 0.55, depth * 0.55 + 0.45, uReveal);
      // A tap sends a ring outwards through the rows.
      float ring = length(vec2(x - uPulse.x, (baseline - uPulse.y) * 1.6)) - uPulse.z * 0.7;
      float pulse = exp(-uPulse.z * 1.6) * gauss(ring, 0.0, 0.05) * step(0.0, uPulse.z);
      // Scrolling away settles the crowd; the person's line stays and grows.
      float settle = mix(1.0 - uSettle * 0.8, 1.0 + uSettle * 0.7, isPerson);
      float height = (mix(0.26, 0.13, depth) * (gauss(x, mu, spread) + shoulder) * (1.0 + isPerson * 0.45) + pulse * 0.07) * rise * settle;

      float top = baseline + height;
      if (p.y < baseline - lineWidth) break;
      if (p.y <= top + lineWidth * 2.0) {
        float distance = abs(p.y - top);
        float width = lineWidth * (1.0 + isPerson * 0.9);
        float alpha = 1.0 - smoothstep(width - px * 0.5, width + px * 0.5, distance);
        // The person's score: a tick from the baseline up to their curve.
        float tickDistance = abs(x - mu - 0.085) * mix(1.0, 0.74, depth) * uResolution.x * (uField.y - uField.x);
        float tick = isPerson * (1.0 - smoothstep(0.8, 1.8, tickDistance)) * step(p.y, top);
        alpha = max(alpha, tick * 0.9);
        float fade = mix(0.7, 0.24, depth) * (1.0 - uSettle * 0.55);
        vec3 ink = mix(uInk, uAccent, isPerson);
        color = vec4(ink, alpha * mix(fade, 1.0, isPerson));
        break;
      }
    }

    // Fade out towards the slot's sides and top so the field sits in the page rather than on it.
    float edge = smoothstep(0.0, 0.22, p.x) * (1.0 - smoothstep(0.84, 1.0, p.x)) * (1.0 - smoothstep(1.0, 1.25, p.y));
    color.a *= edge;
    gl_FragColor = vec4(color.rgb * color.a, color.a);
  }
`;

export type FieldRenderer = {
  setReveal(value: number): void;
  setSettle(value: number): void;
  setColors(): void;
  layout(): void;
  destroy(): void;
};

type Options = {
  // Where the field sits; it is measured against the canvas on every resize.
  slot: HTMLElement;
  // Touches and taps on this element steer the field. The canvas itself takes no input.
  surface: HTMLElement;
  onReady: () => void;
  onFail: () => void;
};

// Reads a CSS colour token as RGB in 0..1, through a probe so var() chains resolve.
function readColor(host: HTMLElement, token: string) {
  const probe = document.createElement("span");
  probe.style.color = `var(${token})`;
  probe.style.display = "none";
  host.append(probe);
  const [r, g, b] = (getComputedStyle(probe).color.match(/[\d.]+/g) ?? ["0", "0", "0"]).map(Number);
  probe.remove();
  return new Vector3(r / 255, g / 255, b / 255);
}

// A fixed sequence, so the field is the same picture on every visit and matches its posters.
function rowSeeds() {
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: ROWS }, () => new Vector4(next(), next(), next(), next()));
}

export function createFieldRenderer(canvas: HTMLCanvasElement, { slot, surface, onReady, onFail }: Options): FieldRenderer | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "low-power" });
  } catch {
    return null;
  }
  let failed = false;
  renderer.debug.onShaderError = () => {
    failed = true;
  };
  const host = canvas.parentElement ?? document.body;
  // Without a GPU (a software renderer), draw at 1x and every other frame so the page stays responsive.
  const gl = renderer.getContext();
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const software = /swiftshader|llvmpipe|software/i.test(String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : ""));
  const small = window.matchMedia("(max-width: 767px)").matches;
  const pixelRatio = software ? 1 : Math.min(window.devicePixelRatio || 1, small ? MAX_PIXEL_RATIO.small : MAX_PIXEL_RATIO.large);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);

  const uniforms = {
    uResolution: { value: new Vector2(1, 1) },
    uField: { value: new Vector4(0, 1, 0, 1) },
    uPointer: { value: new Vector2(0.62, 0.35) },
    uPointerStrength: { value: 0 },
    uPulse: { value: new Vector3(0.5, 0.3, -1) },
    uTime: { value: 0 },
    uReveal: { value: 0 },
    uSettle: { value: 0 },
    uInk: { value: readColor(host, "--foreground") },
    uAccent: { value: readColor(host, "--primary") },
    uRows: { value: rowSeeds() },
  };
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthTest: false });
  scene.add(new Mesh(geometry, material));

  // Where the rows lean. Input sets the target and the uniforms ease towards it every frame, so
  // pointer and touch events are sampled rather than queued.
  const target = { x: 0.62, y: 0.35, strength: 0 };
  // "wander" drifts on its own; "input" follows a mouse or finger until it goes idle.
  let steering: "wander" | "input" = "wander";
  let lastInput = 0;
  let frame = 0;
  let visible = true;
  let running = false;
  let ready = false;
  let last = performance.now();

  // Maps a viewport point into the slot's coordinates (0..1, bottom up).
  const toField = (clientX: number, clientY: number) => {
    const rect = slot.getBoundingClientRect();
    return { x: (clientX - rect.left) / rect.width, y: 1 - (clientY - rect.top) / rect.height };
  };

  const render = () => {
    renderer.render(scene, camera);
    if (ready) return;
    if (failed) {
      stop();
      onFail();
      return;
    }
    ready = true;
    onReady();
  };

  const layout = () => {
    const bounds = canvas.getBoundingClientRect();
    const field = slot.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0 || field.width === 0 || field.height === 0) return;
    renderer.setSize(bounds.width, bounds.height, false);
    uniforms.uResolution.value.set(bounds.width * pixelRatio, bounds.height * pixelRatio);
    uniforms.uField.value.set(
      (field.left - bounds.left) / bounds.width,
      (field.right - bounds.left) / bounds.width,
      (bounds.bottom - field.bottom) / bounds.height,
      (bounds.bottom - field.top) / bounds.height,
    );
    if (!running) render();
  };

  let skip = false;
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    if (software && (skip = !skip)) return;
    const delta = Math.min(0.05, (now - last) / 1000);
    last = now;
    const time = (uniforms.uTime.value += delta);
    if (steering === "input" && now - lastInput > 2600) steering = "wander";
    if (steering === "wander") {
      target.x = 0.55 + 0.3 * Math.sin(time * 0.21);
      target.y = 0.38 + 0.26 * Math.sin(time * 0.29 + 1.3);
      target.strength = 0.7;
    }
    const ease = 1 - Math.exp(-delta * (steering === "input" ? 5 : 1.5));
    const pointer = uniforms.uPointer.value;
    pointer.x += (target.x - pointer.x) * ease;
    pointer.y += (target.y - pointer.y) * ease;
    uniforms.uPointerStrength.value += (target.strength - uniforms.uPointerStrength.value) * ease;
    if (uniforms.uPulse.value.z >= 0) uniforms.uPulse.value.z = uniforms.uPulse.value.z > 3 ? -1 : uniforms.uPulse.value.z + delta;
    render();
  };

  const start = () => {
    if (running || !visible || document.hidden || failed) return;
    running = true;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };
  function stop() {
    running = false;
    cancelAnimationFrame(frame);
  }

  const steer = (clientX: number, clientY: number) => {
    const point = toField(clientX, clientY);
    const inside = point.x > -0.25 && point.x < 1.25 && point.y > -0.4 && point.y < 1.6;
    if (!inside) return;
    steering = "input";
    lastInput = performance.now();
    target.x = point.x;
    target.y = point.y;
    target.strength = 1;
  };
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === "mouse") steer(event.clientX, event.clientY);
  };
  // Touches keep firing while the page scrolls, unlike pointer events, so a finger passing over
  // the hero steers it even mid-scroll. Nothing here prevents the scroll.
  const onTouch = (event: TouchEvent) => {
    const touch = event.touches[0];
    if (touch) steer(touch.clientX, touch.clientY);
  };
  const onPointerDown = (event: PointerEvent) => {
    const point = toField(event.clientX, event.clientY);
    uniforms.uPulse.value.set(point.x, point.y, 0);
  };
  const release = () => {
    lastInput = 0;
  };
  const onVisibility = () => (document.hidden ? stop() : start());
  const onContextLost = (event: Event) => {
    event.preventDefault();
    stop();
    onFail();
  };

  const resizeObserver = new ResizeObserver(layout);
  resizeObserver.observe(canvas);
  resizeObserver.observe(slot);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
    else stop();
  });
  intersection.observe(canvas);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  surface.addEventListener("touchstart", onTouch, { passive: true });
  surface.addEventListener("touchmove", onTouch, { passive: true });
  surface.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("blur", release);
  document.documentElement.addEventListener("pointerleave", release);
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onContextLost);

  layout();
  start();

  return {
    setReveal(value) {
      uniforms.uReveal.value = value;
    },
    setSettle(value) {
      uniforms.uSettle.value = value;
    },
    setColors() {
      uniforms.uInk.value = readColor(host, "--foreground");
      uniforms.uAccent.value = readColor(host, "--primary");
      if (!running) render();
    },
    layout,
    destroy() {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      surface.removeEventListener("touchstart", onTouch);
      surface.removeEventListener("touchmove", onTouch);
      surface.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("blur", release);
      document.documentElement.removeEventListener("pointerleave", release);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
