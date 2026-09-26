import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderer } from "three";

// The hero's ridgeline: stacked score distributions, one line per team, drawn in a single
// fragment shader. Front rows hide the rows behind them, one row (a single person's) is drawn in
// the accent colour with a tick at their score, and rows near the pointer lean towards it.

const ROWS = 30;
// The highlighted row, counted from the front.
const PERSON_ROW = 6;
// Rendering cost grows with the square of this; the lines stay crisp at 1.5.
const MAX_PIXEL_RATIO = 1.5;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uPointerStrength;
  uniform float uTime;
  uniform float uReveal;
  uniform vec3 uInk;
  uniform vec3 uAccent;

  const int ROWS = ${ROWS};
  const int PERSON = ${PERSON_ROW};

  float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }
  float gauss(float x, float mu, float s) { float d = (x - mu) / s; return exp(-0.5 * d * d); }

  void main() {
    vec2 p = vUv;
    float px = 1.0 / uResolution.y;
    float lineWidth = 1.1 * px;
    vec4 color = vec4(0.0);

    for (int i = 0; i < ROWS; i++) {
      float fi = float(i);
      float depth = fi / float(ROWS - 1);
      float baseline = mix(0.06, 0.74, pow(depth, 0.9));
      // Back rows are narrower, which reads as distance.
      float x = (p.x - 0.5) / mix(1.0, 0.74, depth) + 0.5;

      float isPerson = i == PERSON ? 1.0 : 0.0;
      float mu = mix(0.5 + (hash(fi) - 0.5) * 0.26, 0.6, isPerson) + 0.012 * sin(uTime * 0.35 + fi * 1.7);
      float lean = exp(-pow((baseline - uPointer.y) / 0.14, 2.0)) * uPointerStrength;
      mu = mix(mu, uPointer.x, lean * 0.45);
      float spread = 0.075 + hash(fi + 7.0) * 0.06;
      float shoulder = 0.28 * gauss(x, mu + (hash(fi + 3.0) - 0.5) * 0.3, spread * 1.6);
      // Rows rise from flat, front first.
      float rise = smoothstep(depth * 0.55, depth * 0.55 + 0.45, uReveal);
      float height = mix(0.26, 0.13, depth) * (gauss(x, mu, spread) + shoulder) * rise * (1.0 + isPerson * 0.45);

      float top = baseline + height;
      if (p.y < baseline - lineWidth) break;
      if (p.y <= top + lineWidth * 2.0) {
        float distance = abs(p.y - top);
        float width = lineWidth * (1.0 + isPerson * 0.9);
        float alpha = 1.0 - smoothstep(width - px * 0.5, width + px * 0.5, distance);
        // The person's score: a tick from the baseline up to their curve.
        float tickDistance = abs(x - mu - 0.085) * mix(1.0, 0.74, depth) * uResolution.x;
        float tick = isPerson * (1.0 - smoothstep(0.8, 1.8, tickDistance)) * step(p.y, top);
        alpha = max(alpha, tick * 0.9);
        float fade = mix(0.7, 0.24, depth);
        vec3 ink = mix(uInk, uAccent, isPerson);
        color = vec4(ink, alpha * mix(fade, 1.0, isPerson));
        break;
      }
    }

    // Fade out towards the edges so the field sits in the page rather than on it.
    float edge = smoothstep(0.02, 0.34, vUv.x) * (1.0 - smoothstep(0.84, 1.0, vUv.x)) * (1.0 - smoothstep(0.9, 1.0, vUv.y));
    color.a *= edge;
    gl_FragColor = vec4(color.rgb * color.a, color.a);
  }
`;

export type FieldRenderer = {
  setReveal(value: number): void;
  setColors(): void;
  destroy(): void;
};

// Reads a CSS colour token as linear-ish RGB in 0..1, through a probe so var() chains resolve.
function readColor(host: HTMLElement, token: string) {
  const probe = document.createElement("span");
  probe.style.color = `var(${token})`;
  probe.style.display = "none";
  host.append(probe);
  const [r, g, b] = (getComputedStyle(probe).color.match(/[\d.]+/g) ?? ["0", "0", "0"]).map(Number);
  probe.remove();
  return new Vector3(r / 255, g / 255, b / 255);
}

export function createFieldRenderer(canvas: HTMLCanvasElement, { onFail }: { onFail: () => void }): FieldRenderer | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "low-power" });
  } catch {
    return null;
  }
  const host = canvas.parentElement ?? document.body;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);

  const uniforms = {
    uResolution: { value: new Vector2(1, 1) },
    uPointer: { value: new Vector2(0.62, 0.35) },
    uPointerStrength: { value: 0 },
    uTime: { value: 0 },
    uReveal: { value: 0 },
    uInk: { value: readColor(host, "--foreground") },
    uAccent: { value: readColor(host, "--primary") },
  };
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthTest: false });
  scene.add(new Mesh(geometry, material));

  // The pointer target; the uniforms ease towards it every frame, so input is sampled, not queued.
  const target = { x: 0.62, y: 0.35, strength: 0 };
  let frame = 0;
  let visible = true;
  let running = false;
  let last = performance.now();

  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    uniforms.uResolution.value.set(width * pixelRatio, height * pixelRatio);
    if (!running) renderer.render(scene, camera);
  };

  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    const delta = Math.min(0.05, (now - last) / 1000);
    last = now;
    uniforms.uTime.value += delta;
    const ease = 1 - Math.exp(-delta * 4);
    const pointer = uniforms.uPointer.value;
    pointer.x += (target.x - pointer.x) * ease;
    pointer.y += (target.y - pointer.y) * ease;
    uniforms.uPointerStrength.value += (target.strength - uniforms.uPointerStrength.value) * ease;
    renderer.render(scene, camera);
  };

  const start = () => {
    if (running || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(frame);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const rect = canvas.getBoundingClientRect();
    target.x = (event.clientX - rect.left) / rect.width;
    target.y = 1 - (event.clientY - rect.top) / rect.height;
    target.strength = target.x > -0.2 && target.x < 1.2 && target.y > -0.2 && target.y < 1.2 ? 1 : 0;
  };
  const release = () => {
    target.strength = 0;
  };
  const onVisibility = () => (document.hidden ? stop() : start());
  const onContextLost = (event: Event) => {
    event.preventDefault();
    stop();
    onFail();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
    else stop();
  });
  intersection.observe(canvas);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("blur", release);
  document.documentElement.addEventListener("pointerleave", release);
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onContextLost);

  resize();
  start();

  return {
    setReveal(value) {
      uniforms.uReveal.value = value;
    },
    setColors() {
      uniforms.uInk.value = readColor(host, "--foreground");
      uniforms.uAccent.value = readColor(host, "--primary");
      if (!running) renderer.render(scene, camera);
    },
    destroy() {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
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
