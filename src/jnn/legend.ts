import { JNN, INeuron } from './fm';

const BG_COLOR = '#0a0e17';
const GRID_COLOR = 'rgba(0, 255, 242, 0.03)';
const INPUT_COLOR = '#00fff2';
const HIDDEN_COLOR = '#b44dff';
const OUTPUT_COLOR = '#ff2d75';
const POSITIVE_WEIGHT_COLOR = '#00fff2';
const NEGATIVE_WEIGHT_COLOR = '#ff2d75';
const LABEL_COLOR = 'rgba(255, 255, 255, 0.7)';
const LABEL_FONT = '10px monospace';

let canvas: HTMLCanvasElement = null;
let ctx: CanvasRenderingContext2D = null;
let lastUpdateTime = 0;
const THROTTLE_MS = 100;

interface NodePos {
  x: number;
  y: number;
  radius: number;
}

export function create(canvasElement: HTMLCanvasElement) {
  canvas = canvasElement;
  if (!canvas) return;

  const container = canvas.parentElement;
  const w = container.clientWidth - 600;
  const h = container.clientHeight || 800;

  canvas.width = Math.max(w, 400);
  canvas.height = h;

  ctx = canvas.getContext('2d');
}

function getNodePositions(
  nn: JNN,
  inputs: Array<number>
): { layers: NodePos[][]; inputNodes: NodePos[] } {
  const { network, options } = nn;
  const totalLayers = 1 + network.length; // input + hidden+output
  const padding = 60;
  const layerSpacing = (canvas.width - padding * 2) / (totalLayers - 1);

  const maxNeurons = Math.max(
    options.inputCount,
    ...network.map((l) => l.length)
  );
  const nodeRadius = Math.min(20, (canvas.height - padding * 2) / (maxNeurons * 3));

  const inputNodes: NodePos[] = inputs.map((_, i, arr) => ({
    x: padding,
    y: canvas.height / 2 + (i - (arr.length - 1) / 2) * (nodeRadius * 3 + 8),
    radius: nodeRadius,
  }));

  const layers: NodePos[][] = network.map((layer, li) => {
    const x = padding + layerSpacing * (li + 1);
    return layer.map((_, ni, arr) => ({
      x,
      y: canvas.height / 2 + (ni - (arr.length - 1) / 2) * (nodeRadius * 3 + 8),
      radius: nodeRadius,
    }));
  });

  return { layers, inputNodes };
}

function drawGrid() {
  const step = 30;
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawEdge(x1: number, y1: number, x2: number, y2: number, weight: number) {
  const absWeight = Math.min(Math.abs(weight), 2);
  const alpha = 0.1 + (absWeight / 2) * 0.5;
  ctx.strokeStyle =
    weight >= 0
      ? POSITIVE_WEIGHT_COLOR.replace(')', `, ${alpha})`).replace('rgb', 'rgba')
      : NEGATIVE_WEIGHT_COLOR.replace(')', `, ${alpha})`).replace('rgb', 'rgba');

  if (ctx.strokeStyle.startsWith('#')) {
    const hex = ctx.strokeStyle;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  ctx.lineWidth = 0.5 + absWeight * 0.8;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawNode(x: number, y: number, radius: number, color: string, activation?: number) {
  const intensity = activation != null ? 0.3 + activation * 0.7 : 0.5;

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 12 + (activation != null ? activation * 15 : 0);

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = BG_COLOR;
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = intensity;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.beginPath();
  ctx.arc(x, y, radius - 2, 0, Math.PI * 2);
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${intensity * 0.15})`;
  ctx.fill();
}

function drawLabel(x: number, y: number, text: string, align: CanvasTextAlign = 'center') {
  ctx.fillStyle = LABEL_COLOR;
  ctx.font = LABEL_FONT;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

export function update(nn: JNN, inputs: Array<number>) {
  const now = Date.now();
  if (now - lastUpdateTime < THROTTLE_MS) return;
  lastUpdateTime = now;

  if (!ctx || !canvas) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();

  const { layers, inputNodes } = getNodePositions(nn, inputs);

  // draw edges: input -> first network layer
  if (layers[0]) {
    inputNodes.forEach((inp, ii) => {
      layers[0].forEach((target, ti) => {
        drawEdge(inp.x, inp.y, target.x, target.y, nn.network[0][ti].weights[ii]);
      });
    });
  }

  // draw edges: between network layers
  for (let li = 1; li < layers.length; li++) {
    layers[li].forEach((target, ti) => {
      layers[li - 1].forEach((source, si) => {
        drawEdge(source.x, source.y, target.x, target.y, nn.network[li][ti].weights[si]);
      });
    });
  }

  // draw input nodes
  inputNodes.forEach((node, i) => {
    drawNode(node.x, node.y, node.radius, INPUT_COLOR);
    const val = inputs[i];
    drawLabel(node.x, node.y - node.radius - 10, val != null ? `in: ${typeof val === 'number' ? val.toFixed(3) : val}` : 'in: -');
  });

  // draw network nodes
  layers.forEach((layer, li) => {
    const isOutput = li === layers.length - 1;
    const color = isOutput ? OUTPUT_COLOR : HIDDEN_COLOR;

    layer.forEach((node, ni) => {
      const neuron: INeuron = nn.network[li][ni];
      drawNode(node.x, node.y, node.radius, color, neuron.output);

      const labelY = node.y + node.radius + 14;
      if (isOutput) {
        drawLabel(node.x, node.y - node.radius - 10, `out[${ni}]: ${neuron.output?.toFixed(3) ?? '-'}`);
      } else {
        drawLabel(node.x, labelY, `b:${neuron.bias.toFixed(2)} o:${neuron.output?.toFixed(2) ?? '-'}`);
      }
    });
  });
}
