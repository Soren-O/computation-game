// Where each basis state sits on screen. n qubits -> the corners of an
// n-dimensional cube: qubit 0 runs left-right, qubit 1 bottom-top, qubit 2
// front-back, and qubit 3 is a second copy of the cube beside the first.
// A gate on qubit k therefore moves amplitude along the k-th direction.

export interface View {
  /** Rotation about the vertical axis, radians. */
  yaw: number;
  /** Tilt toward the viewer, radians. */
  pitch: number;
}

export const DEFAULT_VIEW: View = { yaw: -0.52, pitch: 0.34 };

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
  /** Which way the second cube sits for four qubits. */
  splitDirection: 'horizontal' | 'vertical';
}

export function hypercubeEdges(n: number): Edge[] {
  const edges: Edge[] = [];
  for (let v = 0; v < 1 << n; v++)
    for (let axis = 0; axis < n; axis++) if (!(v & (1 << axis))) edges.push({ a: v, b: v | (1 << axis), axis });
  return edges;
}

/** Node radius as a fraction of the edge length, by qubit count. */
const RADIUS_FRACTION = [0.3, 0.3, 0.27, 0.23, 0.22];
const MAX_RADIUS_PX = 74;
const CAMERA_DISTANCE = 3.6;
/** Distance between the two cubes for four qubits, in edge lengths. */
const CUBE_GAP = 1.9;
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
  const splitDirection = width >= height * 1.15 ? 'horizontal' : 'vertical';
  const cy = Math.cos(view.yaw), sy = Math.sin(view.yaw);
  const cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
  const rotate = n >= 3;

  // Unit-space positions (edge length 1, +y up).
  const unit = Array.from({ length: count }, (_, v) => {
    const bit = (k: number) => (k < n ? ((v >> k) & 1) - 0.5 : 0);
    let x = bit(0), y = bit(1), z = bit(2);
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
    let px = x * f;
    let py = y * f;
    if (n >= 4) {
      const w = bit(3);
      if (splitDirection === 'horizontal') px += w * CUBE_GAP;
      else py -= w * CUBE_GAP; // second cube below the first
    }
    return { x: px, y: py, depth: z, scale: f };
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
    splitDirection,
  };
}

/** Qubit colours, shared by the cube's edges and the circuit's wires. */
export const QUBIT_COLORS = ['#4cc9f0', '#f72585', '#fbbf24', '#34d399'];
