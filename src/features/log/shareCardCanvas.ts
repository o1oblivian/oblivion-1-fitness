export interface ProgressCardInput {
  name: string;
  before: HTMLImageElement | null;
  after: HTMLImageElement | null;
  rows: Array<{ label: string; value: string }>;
}

const W = 1080;
const H = 1350;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function coverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function emptyFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string) {
  ctx.fillStyle = '#161616';
  roundRect(ctx, x, y, w, h, 28);
  ctx.fill();
  ctx.strokeStyle = 'rgba(242,239,230,0.18)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#A39E92';
  ctx.font = '500 28px Manrope, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 10);
}

export async function renderProgressCard(input: ProgressCardInput): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#F2EFE6';
  ctx.textAlign = 'left';
  ctx.font = '600 28px Manrope, sans-serif';
  ctx.fillText('Oblivion 1', 72, 96);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 64px Manrope, sans-serif';
  const name = input.name.trim() || 'Athlete';
  ctx.fillText(name.slice(0, 22), 72, 176);

  const frameY = 230;
  const frameH = 620;
  const frameW = 444;
  const gap = 24;
  const left = 72;
  const right = left + frameW + gap;

  ctx.save();
  roundRect(ctx, left, frameY, frameW, frameH, 28);
  ctx.clip();
  if (input.before) coverImage(ctx, input.before, left, frameY, frameW, frameH);
  else emptyFrame(ctx, left, frameY, frameW, frameH, 'Before');
  ctx.restore();

  ctx.save();
  roundRect(ctx, right, frameY, frameW, frameH, 28);
  ctx.clip();
  if (input.after) coverImage(ctx, input.after, right, frameY, frameW, frameH);
  else emptyFrame(ctx, right, frameY, frameW, frameH, 'After');
  ctx.restore();

  if (input.before) {
    ctx.fillStyle = '#F2EFE6';
    ctx.font = '600 22px Manrope, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Before', left + 20, frameY + frameH - 24);
  }
  if (input.after) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F2EFE6';
    ctx.fillText('After', right + 20, frameY + frameH - 24);
  }

  let y = 920;
  ctx.textAlign = 'left';
  input.rows.slice(0, 5).forEach((row) => {
    ctx.fillStyle = '#A39E92';
    ctx.font = '500 28px Manrope, sans-serif';
    ctx.fillText(row.label, 72, y);
    ctx.fillStyle = '#F2EFE6';
    ctx.font = '600 32px Manrope, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(row.value || '--', W - 72, y);
    ctx.textAlign = 'left';
    y += 58;
  });

  ctx.fillStyle = '#A39E92';
  ctx.font = '500 24px Manrope, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('oblivion1.club', 72, H - 72);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not build the card');
  return new File([blob], 'oblivion-progress.png', { type: 'image/png' });
}

export function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Photo could not be read'));
    };
    img.src = url;
  });
}
