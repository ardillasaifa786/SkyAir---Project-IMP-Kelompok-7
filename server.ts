import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLASS_NAMES = [
  "Baik",
  "Sedang",
  "Tidak Sehat",
  "Tidak Sehat Bagi Sebagian Orang",
] as const;

type AirQualityClass = (typeof CLASS_NAMES)[number];

interface FocusRegion {
  x: number;
  y: number;
  radius: number;
  weight: number;
}

interface PredictionPayload {
  predicted_class: AirQualityClass;
  confidence: number;
  probabilities: Record<AirQualityClass, number>;
  visual_cues: string;
  focus_regions: FocusRegion[];
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      const msg = error instanceof Error ? error.message : String(error);
      const isTransient =
        msg.includes("503") ||
        msg.includes("500") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT");
      if (!isTransient || attempt === maxAttempts) {
        throw error;
      }
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
  throw lastError;
}

function normalizeProbabilities(
  raw: Partial<Record<AirQualityClass, number>>,
  predictedClass: AirQualityClass
): Record<AirQualityClass, number> {
  const cleaned: Record<AirQualityClass, number> = {
    Baik: Math.max(0.001, Number(raw["Baik"] ?? 0.05)),
    Sedang: Math.max(0.001, Number(raw["Sedang"] ?? 0.05)),
    "Tidak Sehat": Math.max(0.001, Number(raw["Tidak Sehat"] ?? 0.05)),
    "Tidak Sehat Bagi Sebagian Orang": Math.max(
      0.001,
      Number(raw["Tidak Sehat Bagi Sebagian Orang"] ?? 0.05)
    ),
  };

  // Ensure the predicted class has the highest probability
  const maxOther = Math.max(
    ...CLASS_NAMES.filter((c) => c !== predictedClass).map((c) => cleaned[c])
  );
  if (cleaned[predictedClass] <= maxOther) {
    cleaned[predictedClass] = maxOther + 0.15;
  }

  const total = CLASS_NAMES.reduce((sum, key) => sum + cleaned[key], 0);
  const normalized = {} as Record<AirQualityClass, number>;
  for (const key of CLASS_NAMES) {
    normalized[key] = Number((cleaned[key] / total).toFixed(4));
  }
  return normalized;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "15mb" }));

  app.post("/api/predict", async (req, res) => {
    try {
      const { imageBase64, mimeType, imageMetrics } = req.body ?? {};

      if (
        typeof imageBase64 !== "string" ||
        !imageBase64.trim() ||
        typeof mimeType !== "string" ||
        !mimeType.startsWith("image/")
      ) {
        res.status(400).json({
          error:
            "Format gambar tidak valid. Unggah gambar langit berformat JPG atau PNG.",
        });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            "GEMINI_API_KEY belum tersedia di server. Silakan periksa konfigurasi API key di panel Settings > Secrets.",
        });
        return;
      }

      const metricsHint = imageMetrics
        ? `Metrik visual citra: meanBlueRatio=${Number(imageMetrics.meanBlueRatio ?? 0).toFixed(3)}, hazeIndex=${Number(imageMetrics.hazeIndex ?? 0).toFixed(3)}, contrastScore=${Number(imageMetrics.contrastScore ?? 0).toFixed(3)}, saturationScore=${Number(imageMetrics.saturationScore ?? 0).toFixed(3)}.`
        : "";

      const prompt = `Anda adalah mesin klasifikasi citra langit SkyAir (setara model CNN MobileNetV3Small) untuk mengestimasi kategori kualitas udara visual dari foto langit.

Tugas Anda:
1. Periksa apakah foto memperlihatkan langit/cakrawala atmosfer. Evaluasi kejernihan warna biru langit, tingkat kabut asap (haze), kontras awan, dan visibilitas horizon.
2. Klasifikasikan citra ke dalam TEPAT SATU dari 4 kelas SkyAir berikut:
   - "Baik": langit biru jernih atau berawan cerah dengan visibilitas horizon sangat jelas dan kabut minimal.
   - "Sedang": langit agak pucat/berkabut tipis atau tertutup awan sedang namun visibilitas masih cukup baik.
   - "Tidak Sehat Bagi Sebagian Orang": tampak kabut/asap sedang yang mengurangi saturasi biru langit dan mengaburkan horizon jauh.
   - "Tidak Sehat": tampak kabut tebal, asap pekat, warna langit keabu-abuan/kecokelatan/kekuningan kusam dengan visibilitas rendah.
3. Berikan probabilitas terkalibrasi (0.0 - 1.0, total mendekati 1.0) untuk keempat kelas tersebut.
4. Berikan 3 sampai 5 focus_regions (x, y, radius, weight dalam rentang 0.0 - 1.0) yang menunjukkan area langit/horizon pada gambar yang paling memengaruhi keputusan klasifikasi (untuk overlay Grad-CAM).
5. Berikan visual_cues singkat (1-2 kalimat dalam bahasa Indonesia) yang menjelaskan fitur visual citra langit, dan tegaskan bahwa ini adalah estimasi berbasis citra visual, bukan pengukuran sensor AQI langsung.

${metricsHint}`;

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: imageBase64,
                },
              },
              { text: prompt },
            ],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                predicted_class: {
                  type: Type.STRING,
                  enum: [...CLASS_NAMES],
                },
                prob_baik: { type: Type.NUMBER },
                prob_sedang: { type: Type.NUMBER },
                prob_tidak_sehat: { type: Type.NUMBER },
                prob_sensitif: { type: Type.NUMBER },
                visual_cues: { type: Type.STRING },
                focus_regions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                      radius: { type: Type.NUMBER },
                      weight: { type: Type.NUMBER },
                    },
                    required: ["x", "y", "radius", "weight"],
                  },
                },
              },
              required: [
                "predicted_class",
                "prob_baik",
                "prob_sedang",
                "prob_tidak_sehat",
                "prob_sensitif",
                "visual_cues",
                "focus_regions",
              ],
            },
          },
        })
      );

      const rawText = (response.text ?? "").trim();
      if (!rawText) {
        res.status(502).json({
          error: "Model tidak mengembalikan hasil analisis yang valid.",
        });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        predicted_class?: string;
        prob_baik?: number;
        prob_sedang?: number;
        prob_tidak_sehat?: number;
        prob_sensitif?: number;
        visual_cues?: string;
        focus_regions?: FocusRegion[];
      };

      const predictedClass: AirQualityClass = CLASS_NAMES.includes(
        parsed.predicted_class as AirQualityClass
      )
        ? (parsed.predicted_class as AirQualityClass)
        : "Sedang";

      const probabilities = normalizeProbabilities(
        {
          Baik: parsed.prob_baik,
          Sedang: parsed.prob_sedang,
          "Tidak Sehat": parsed.prob_tidak_sehat,
          "Tidak Sehat Bagi Sebagian Orang": parsed.prob_sensitif,
        },
        predictedClass
      );

      const confidence = probabilities[predictedClass];

      const focusRegions: FocusRegion[] = Array.isArray(parsed.focus_regions)
        ? parsed.focus_regions.slice(0, 6).map((r) => ({
            x: Math.min(0.95, Math.max(0.05, Number(r.x) || 0.5)),
            y: Math.min(0.95, Math.max(0.05, Number(r.y) || 0.35)),
            radius: Math.min(0.45, Math.max(0.12, Number(r.radius) || 0.25)),
            weight: Math.min(1, Math.max(0.2, Number(r.weight) || 0.7)),
          }))
        : [
            { x: 0.5, y: 0.3, radius: 0.28, weight: 0.9 },
            { x: 0.3, y: 0.45, radius: 0.22, weight: 0.7 },
            { x: 0.72, y: 0.42, radius: 0.22, weight: 0.7 },
          ];

      const payload: PredictionPayload = {
        predicted_class: predictedClass,
        confidence,
        probabilities,
        visual_cues:
          parsed.visual_cues ||
          "Klasifikasi diperoleh berdasarkan evaluasi visual warna langit, distribusi awan, dan kejernihan horizon.",
        focus_regions: focusRegions,
      };

      res.json(payload);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Prediction error:", msg);

      if (msg.includes("403") || msg.includes("PERMISSION_DENIED")) {
        res.status(403).json({
          error:
            "Akses Gemini API ditolak. Periksa API key Anda pada panel Settings > Secrets.",
        });
        return;
      }
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        res.status(429).json({
          error:
            "Kuota API sementara terlampaui. Tunggu beberapa saat lalu coba analisis kembali.",
        });
        return;
      }
      res.status(500).json({
        error: `Terjadi kesalahan saat menganalisis citra langit: ${msg}`,
      });
    }
  });

  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SkyAir server listening on http://localhost:${PORT}`);
  });
}

startServer();
