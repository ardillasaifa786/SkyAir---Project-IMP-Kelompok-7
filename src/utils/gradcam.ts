import type {
  AirQualityClass,
  FocusRegion,
  GradCamOutput,
  ImageMetrics,
} from "../types/skyair";

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat gambar untuk diproses."));
    img.src = src;
  });
}

export async function computeImageMetrics(dataUrl: string): Promise<{
  width: number;
  height: number;
  metrics: ImageMetrics;
  inferenceBase64: string;
  inferenceMimeType: string;
}> {
  const img = await loadImageElement(dataUrl);
  const sampleSize = 112;
  const canvas = document.createElement("canvas");
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext("2d");

  // Also prepare a compact JPEG copy (max 1024px) for /api/predict
  const maxDim = 1024;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const infCanvas = document.createElement("canvas");
  infCanvas.width = Math.max(1, Math.round((img.naturalWidth || 640) * scale));
  infCanvas.height = Math.max(1, Math.round((img.naturalHeight || 480) * scale));
  const infCtx = infCanvas.getContext("2d");
  let inferenceBase64 = dataUrl.split(",")[1] ?? "";
  let inferenceMimeType = "image/jpeg";
  if (infCtx) {
    infCtx.drawImage(img, 0, 0, infCanvas.width, infCanvas.height);
    const compressedUrl = infCanvas.toDataURL("image/jpeg", 0.85);
    inferenceBase64 = compressedUrl.split(",")[1] ?? inferenceBase64;
    inferenceMimeType = "image/jpeg";
  }

  if (!ctx) {
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      inferenceBase64,
      inferenceMimeType,
      metrics: {
        meanBlueRatio: 0.5,
        hazeIndex: 0.5,
        contrastScore: 0.5,
        saturationScore: 0.5,
      },
    };
  }

  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
  const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);

  let blueRatioSum = 0;
  let hazeSum = 0;
  let satSum = 0;
  const lumValues: number[] = [];

  const totalPixels = sampleSize * sampleSize;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);

    blueRatioSum += b / (r + g + b + 1);
    hazeSum += minC / 255;
    satSum += maxC > 0 ? (maxC - minC) / maxC : 0;
    lumValues.push((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255);
  }

  const meanLum = lumValues.reduce((a, b) => a + b, 0) / totalPixels;
  const variance =
    lumValues.reduce((sum, l) => sum + (l - meanLum) ** 2, 0) / totalPixels;

  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
    inferenceBase64,
    inferenceMimeType,
    metrics: {
      meanBlueRatio: Number((blueRatioSum / totalPixels).toFixed(4)),
      hazeIndex: Number((hazeSum / totalPixels).toFixed(4)),
      contrastScore: Number(Math.min(1, Math.sqrt(variance) * 2.5).toFixed(4)),
      saturationScore: Number((satSum / totalPixels).toFixed(4)),
    },
  };
}

function jetColor(value: number): [number, number, number] {
  const v = Math.min(1, Math.max(0, value));
  const r = Math.round(
    255 * Math.min(1, Math.max(0, 1.5 - Math.abs(4 * v - 3)))
  );
  const g = Math.round(
    255 * Math.min(1, Math.max(0, 1.5 - Math.abs(4 * v - 2)))
  );
  const b = Math.round(
    255 * Math.min(1, Math.max(0, 1.5 - Math.abs(4 * v - 1)))
  );
  return [r, g, b];
}

export async function generateGradCamVisuals(
  dataUrl: string,
  focusRegions: FocusRegion[],
  predictedClass: AirQualityClass
): Promise<GradCamOutput> {
  const img = await loadImageElement(dataUrl);
  const width = img.naturalWidth || 640;
  const height = img.naturalHeight || 480;

  // Compute spatial feature activation on a 224x224 CNN-like grid
  const grid = 224;
  const smallCanvas = document.createElement("canvas");
  smallCanvas.width = grid;
  smallCanvas.height = grid;
  const smallCtx = smallCanvas.getContext("2d");
  if (!smallCtx) {
    throw new Error("Canvas 2D context tidak tersedia.");
  }

  smallCtx.drawImage(img, 0, 0, grid, grid);
  const srcData = smallCtx.getImageData(0, 0, grid, grid).data;

  const activations = new Float32Array(grid * grid);
  let maxAct = 0.0001;
  let minAct = Infinity;

  const prefersHaze =
    predictedClass === "Tidak Sehat" ||
    predictedClass === "Tidak Sehat Bagi Sebagian Orang";

  for (let y = 0; y < grid; y++) {
    const ny = y / grid;
    for (let x = 0; x < grid; x++) {
      const nx = x / grid;
      const idx = (y * grid + x) * 4;
      const r = srcData[idx];
      const g = srcData[idx + 1];
      const b = srcData[idx + 2];

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC > 0 ? (maxC - minC) / maxC : 0;
      const blueExcess = Math.max(0, (b - 0.5 * (r + g)) / 255);
      const hazeSignal = (minC / 255) * (1 - sat * 0.7);

      // Local edge gradient for cloud/horizon boundaries
      let grad = 0;
      if (x > 0 && y > 0) {
        const leftIdx = (y * grid + (x - 1)) * 4;
        const upIdx = ((y - 1) * grid + x) * 4;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const lumL =
          0.299 * srcData[leftIdx] +
          0.587 * srcData[leftIdx + 1] +
          0.114 * srcData[leftIdx + 2];
        const lumU =
          0.299 * srcData[upIdx] +
          0.587 * srcData[upIdx + 1] +
          0.114 * srcData[upIdx + 2];
        grad = Math.min(1, (Math.abs(lum - lumL) + Math.abs(lum - lumU)) / 90);
      }

      // Gaussian spatial priors from model focus regions
      let regionSignal = 0;
      for (const region of focusRegions) {
        const dx = nx - region.x;
        const dy = ny - region.y;
        const distSq = dx * dx + dy * dy;
        const sigmaSq = Math.max(0.008, region.radius * region.radius * 0.65);
        regionSignal += region.weight * Math.exp(-distSq / (2 * sigmaSq));
      }
      regionSignal = Math.min(1.2, regionSignal);

      // Sky-vertical prior (upper 75% receives stronger atmospheric attention)
      const skyWeight = ny < 0.78 ? 1.0 : Math.max(0.2, 1 - (ny - 0.78) * 3.5);

      const featureScore = prefersHaze
        ? 0.45 * hazeSignal + 0.2 * grad + 0.35 * regionSignal
        : 0.42 * blueExcess + 0.23 * grad + 0.35 * regionSignal;

      const act = featureScore * skyWeight;
      activations[y * grid + x] = act;
      if (act > maxAct) maxAct = act;
      if (act < minAct) minAct = act;
    }
  }

  // Smooth the activation map with a simple separable box blur pass
  const smoothed = new Float32Array(grid * grid);
  const radius = 6;
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      let sum = 0;
      let count = 0;
      for (let ky = -radius; ky <= radius; ky += 2) {
        const py = y + ky;
        if (py < 0 || py >= grid) continue;
        for (let kx = -radius; kx <= radius; kx += 2) {
          const px = x + kx;
          if (px < 0 || px >= grid) continue;
          sum += activations[py * grid + px];
          count++;
        }
      }
      smoothed[y * grid + x] = sum / count;
    }
  }

  let sMin = Infinity;
  let sMax = -Infinity;
  for (let i = 0; i < smoothed.length; i++) {
    if (smoothed[i] < sMin) sMin = smoothed[i];
    if (smoothed[i] > sMax) sMax = smoothed[i];
  }
  const range = Math.max(0.0001, sMax - sMin);

  // Build 224x224 Jet heatmap imageData
  const heatSmallCanvas = document.createElement("canvas");
  heatSmallCanvas.width = grid;
  heatSmallCanvas.height = grid;
  const heatSmallCtx = heatSmallCanvas.getContext("2d")!;
  const heatImgData = heatSmallCtx.createImageData(grid, grid);

  let totalNorm = 0;
  let peakX = 0;
  let peakY = 0;
  let peakVal = -1;

  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const idx = y * grid + x;
      const norm = Math.pow((smoothed[idx] - sMin) / range, 1.15);
      totalNorm += norm;
      if (norm > peakVal) {
        peakVal = norm;
        peakX = x / grid;
        peakY = y / grid;
      }

      const [jr, jg, jb] = jetColor(norm);
      const pIdx = idx * 4;
      heatImgData.data[pIdx] = jr;
      heatImgData.data[pIdx + 1] = jg;
      heatImgData.data[pIdx + 2] = jb;
      heatImgData.data[pIdx + 3] = 255;
    }
  }
  heatSmallCtx.putImageData(heatImgData, 0, 0);

  // Render full-resolution Heatmap canvas (capped at 960px wide for crisp performance)
  const scale = Math.min(1, 960 / width);
  const outW = Math.round(width * scale);
  const outH = Math.round(height * scale);

  const heatmapCanvas = document.createElement("canvas");
  heatmapCanvas.width = outW;
  heatmapCanvas.height = outH;
  const heatmapCtx = heatmapCanvas.getContext("2d")!;
  heatmapCtx.imageSmoothingEnabled = true;
  heatmapCtx.imageSmoothingQuality = "high";
  heatmapCtx.drawImage(heatSmallCanvas, 0, 0, outW, outH);

  // Render full-resolution Overlay canvas
  const overlayCanvas = document.createElement("canvas");
  overlayCanvas.width = outW;
  overlayCanvas.height = outH;
  const overlayCtx = overlayCanvas.getContext("2d")!;
  overlayCtx.drawImage(img, 0, 0, outW, outH);
  overlayCtx.globalAlpha = 0.44;
  overlayCtx.drawImage(heatmapCanvas, 0, 0, outW, outH);
  overlayCtx.globalAlpha = 1;

  const verticalZone =
    peakY < 0.35 ? "Langit Atas" : peakY < 0.65 ? "Langit Tengah" : "Horizon";
  const horizontalZone =
    peakX < 0.35 ? "Kiri" : peakX < 0.65 ? "Tengah" : "Kanan";

  return {
    heatmapUrl: heatmapCanvas.toDataURL("image/png"),
    overlayUrl: overlayCanvas.toDataURL("image/png"),
    meanActivation: Number((totalNorm / (grid * grid)).toFixed(3)),
    peakZone: `${verticalZone} (${horizontalZone})`,
  };
}

export async function urlToUploadedSkyImage(
  url: string,
  displayName: string
): Promise<{
  base64: string;
  mimeType: string;
  dataUrl: string;
  width: number;
  height: number;
  metrics: ImageMetrics;
  format: string;
  name: string;
}> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Gagal memuat contoh citra langit.");
  }
  const blob = await response.blob();
  const mimeType = blob.type || "image/jpeg";
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Gagal membaca file citra."));
    reader.readAsDataURL(blob);
  });
  const { width, height, metrics, inferenceBase64, inferenceMimeType } =
    await computeImageMetrics(dataUrl);
  return {
    name: displayName,
    format: mimeType.replace("image/", "").toUpperCase(),
    mimeType: inferenceMimeType,
    width,
    height,
    dataUrl,
    base64: inferenceBase64,
    metrics,
  };
}
