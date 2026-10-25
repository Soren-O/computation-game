// Where each basis state sits on screen. n qubits -> the corners of one
// n-dimensional cube, drawn once and never moved: qubit 0 runs left-right,
// qubit 1 bottom-top, qubit 2 front-back, and qubit 3 outer-to-inner (the
// usual cube-inside-a-cube picture of a tesseract). A gate on qubit k moves
// amplitude along the k-th direction, so over time it looks like one face
// sliding onto the opposite face.

export interface View {
  /** Rotation about the vertical axis, radians. */
  yaw: number;
  /** Tilt toward the viewer, radians. */
  pitch: number;
}

export const DEFAULT_VIEW: View = { yaw: -0.55, pitch: 0.41 };
/** Chosen so none of the tesseract's 16 circles overlap and its three cube directions stay distinct. */
const TESSERACT_VIEW: View = { yaw: -0.43, pitch: 0.27 };

export const defaultView = (n: number): View => (n >= 4 ? TESSERACT_VIEW : DEFAULT_VIEW);

export interface Edge {
  a: number;
  b: number;
  /** The qubit whose value differs between the two corners. */
  axis: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
  /** Larger = closer to the viewer. */
  depth: number;
  /** Perspective size factor (1 for flat layouts). */
  scale: number;
}

export interface Layout {
  points: ProjectedPoint[];
  edges: Edge[];
  /** Node radius in px before the perspective factor. */
  radius: number;
}

export function hypercubeEdges(n: number): Edge[] {
  const edges: Edge[] = [];
  for (let v = 0; v < 1 << n; v++)
    for (let axis = 0; axis < n; axis++) if (!(v & (1 << axis))) edges.push({ a: v, b: v | (1 << axis), axis });
  return edges;
}

/** Node radius in layout units (an unscaled edge is 1), by qubit count. */
const RADIUS_FRACTION = [0.3, 0.3, 0.27, 0.21, 0.13];
const MAX_RADIUS_PX = 74;
const CAMERA_DISTANCE = 3.6;
/** 4D camera distance: the inner (q3 = 1) cube is drawn at (D-½)/(D+½) ≈ 0.47 of the outer one. */
const CAMERA_DISTANCE_4D = 1.4;
/** Room under each node for its label, in units of node radius. */
const LABEL_ROOM = 1.9;

export interface LayoutOptions {
  /** Empty border around the drawing, px. */
  margin?: number;
  /** Leave room under the nodes for ket labels. */
  labels?: boolean;
}

export function layoutHypercube(n: number, view: View, width: number, height: number, options: LayoutOptions = {}): Layout {
  const { margin = 12, labels = true } = options;
  const count = 1 << n;
  const cy = Math.cos(view.yaw), sy = Math.sin(view.yaw);
  const cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
  const rotate = n >= 3;

  const outer4D = CAMERA_DISTANCE_4D / (CAMERA_DISTANCE_4D - 0.5);

  // Unit-space positions (edge length 1, +y up).
  const unit = Array.from({ length: count }, (_, v) => {
    const bit = (k: number) => (k < n ? ((v >> k) & 1) - 0.5 : 0);
    // Four qubits: perspective in the fourth direction shrinks the q3 = 1 cube inside the q3 = 0 cube.
    const g = n >= 4 ? CAMERA_DISTANCE_4D / (CAMERA_DISTANCE_4D + bit(3)) : 1;
    // q2 = 1 points away from the viewer, so |000⟩ is the front-bottom-left corner.
    let x = bit(0) * g, y = bit(1) * g, z = -bit(2) * g;
    let f = 1;
    if (rotate) {
      // yaw about y, then pitch about x; +z faces the viewer
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const y2 = y * cp - z1 * sp;
      const z2 = y * sp + z1 * cp;
      x = x1;
      y = y2;
      z = z2;
      f = CAMERA_DISTANCE / (CAMERA_DISTANCE - z);
    }
    // Inner-cube circles are drawn a little smaller and further back, but not so small their arrows get hard to read.
    const shrink = n >= 4 ? 0.4 + 0.6 * (g / outer4D) : 1;
    const depth = n >= 4 ? z + (g - outer4D) * 0.5 : z;
    return { x: x * f, y: y * f, depth, scale: f * shrink };
  });

  const rFrac = RADIUS_FRACTION[Math.min(n, 4)];
  const xs = unit.map(p => p.x);
  const ys = unit.map(p => p.y);
  const pad = rFrac * 1.25;
  const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - (labels ? rFrac * LABEL_ROOM : pad), maxY = Math.max(...ys) + pad;
  let scale = Math.min((width - 2 * margin) / (maxX - minX), (height - 2 * margin) / (maxY - minY));
  scale = Math.max(1, Math.min(scale, MAX_RADIUS_PX / rFrac));

  const cxScreen = width / 2 - ((minX + maxX) / 2) * scale;
  const cyScreen = height / 2 + ((minY + maxY) / 2) * scale;

  return {
    points: unit.map(p => ({ x: cxScreen + p.x * scale, y: cyScreen - p.y * scale, depth: p.depth, scale: p.scale })),
    edges: hypercubeEdges(n),
    radius: rFrac * scale,
  };
}

/** Qubit colours, shared by the cube's edges and the circuit's wires. */
export const QUBIT_COLORS = ['#4cc9f0', '#f72585', '#fbbf24', '#34d399'];
