import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Eye,
  HeartPulse,
  Info,
  Leaf,
  Loader2,
  RotateCcw,
  Search,
  Upload,
  Wind,
} from "lucide-react";
import {
  CATEGORY_META,
  CLASS_NAMES,
  type AirQualityClass,
  type GradCamOutput,
  type PredictionResult,
  type UploadedSkyImage,
} from "../types/skyair";
import {
  computeImageMetrics,
  generateGradCamVisuals,
  urlToUploadedSkyImage,
} from "../utils/gradcam";

const SAMPLE_IMAGES = [
  {
    label: "Langit Berawan Cerah",
    filename: "sampel_langit_cerah.jpg",
    url: "/src/assets/images/sky_hero_clouds_1795675176366.jpg",
  },
  {
    label: "Cakrawala Pesisir",
    filename: "sampel_cakrawala_kota.jpg",
    url: "/src/assets/images/fact_skyair_horizon_1795675176936.jpg",
  },
  {
    label: "Panorama Perkotaan",
    filename: "sampel_panorama_perkotaan.jpg",
    url: "/src/assets/images/fact_city_skyline_1795675178547.jpg",
  },
];

const CATEGORY_ICONS: Record<AirQualityClass, typeof Leaf> = {
  Baik: Leaf,
  Sedang: Wind,
  "Tidak Sehat": AlertTriangle,
  "Tidak Sehat Bagi Sebagian Orang": HeartPulse,
};

export function PredictionPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<UploadedSkyImage | null>(
    null
  );
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isGeneratingGradCam, setIsGeneratingGradCam] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [gradCam, setGradCam] = useState<GradCamOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processFile = async (file: File) => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(
        "Format file belum didukung. Gunakan citra langit berformat JPG, JPEG, atau PNG."
      );
      return;
    }

    setErrorMessage(null);
    setPrediction(null);
    setGradCam(null);
    setIsLoadingImage(true);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
        reader.readAsDataURL(file);
      });

      const { width, height, metrics, inferenceBase64, inferenceMimeType } =
        await computeImageMetrics(dataUrl);

      setUploadedImage({
        name: file.name,
        format: file.type.replace("image/", "").toUpperCase(),
        mimeType: inferenceMimeType,
        width,
        height,
        dataUrl,
        base64: inferenceBase64,
        metrics,
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal memproses file gambar."
      );
    } finally {
      setIsLoadingImage(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const handleLoadSample = async (url: string, filename: string) => {
    setErrorMessage(null);
    setPrediction(null);
    setGradCam(null);
    setIsLoadingImage(true);

    try {
      const sample = await urlToUploadedSkyImage(url, filename);
      setUploadedImage(sample);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal memuat gambar contoh."
      );
    } finally {
      setIsLoadingImage(false);
    }
  };

  const handlePredict = async () => {
    if (!uploadedImage) return;
    setErrorMessage(null);
    setGradCam(null);
    setIsPredicting(true);

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: uploadedImage.base64,
          mimeType: uploadedImage.mimeType,
          imageMetrics: uploadedImage.metrics,
        }),
      });

      const data = (await response.json()) as PredictionResult & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error || "Terjadi kesalahan saat menganalisis citra langit."
        );
      }

      setPrediction(data);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memanggil layanan prediksi."
      );
    } finally {
      setIsPredicting(false);
    }
  };

  const handleGenerateGradCam = async () => {
    if (!uploadedImage || !prediction) return;
    setErrorMessage(null);
    setIsGeneratingGradCam(true);

    try {
      const output = await generateGradCamVisuals(
        uploadedImage.dataUrl,
        prediction.focus_regions,
        prediction.predicted_class
      );
      setGradCam(output);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Gagal menghasilkan visualisasi Grad-CAM."
      );
    } finally {
      setIsGeneratingGradCam(false);
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setPrediction(null);
    setGradCam(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const predictedMeta = prediction
    ? CATEGORY_META[prediction.predicted_class]
    : null;
  const PredictedIcon = prediction
    ? CATEGORY_ICONS[prediction.predicted_class]
    : CheckCircle2;

  return (
    <div className="space-y-7">
      {/* Header */}
      <header className="space-y-1.5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#102b50] sm:text-4xl">
          Prediksi Kualitas Udara
        </h1>
        <p className="text-base font-medium text-[#24496f]">
          Unggah foto langit untuk menganalisis estimasi kualitas udara dan
          melihat fokus visual Grad-CAM.
        </p>
      </header>

      {/* Upload Panel */}
      <section
        aria-label="Unggah gambar langit"
        className="rounded-3xl border border-sky-200/80 bg-white p-6 shadow-sm"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor="sky-image-upload"
            className="font-display text-base font-bold text-[#102b50]"
          >
            Pilih gambar langit
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[#315d83]">
              Contoh cepat:
            </span>
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.filename}
                type="button"
                onClick={() => handleLoadSample(sample.url, sample.filename)}
                disabled={isLoadingImage || isPredicting}
                className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-[#0757a5] transition-colors hover:bg-sky-100 disabled:opacity-50 whitespace-nowrap"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
            isDragging
              ? "border-[#0870c6] bg-sky-50"
              : "border-sky-200 bg-[#f7fbff] hover:border-sky-300 hover:bg-sky-50/70"
          }`}
        >
          <input
            ref={fileInputRef}
            id="sky-image-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileChange}
            className="sr-only"
          />

          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d7edff] text-[#0870c6]">
            {isLoadingImage ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-5 w-5" aria-hidden="true" />
            )}
          </div>

          <p className="font-display text-sm font-bold text-[#102b50]">
            Klik untuk memilih gambar atau seret file ke area ini
          </p>
          <p className="mt-1 text-xs text-[#315d83]">
            Format yang didukung: JPG, JPEG, PNG
          </p>
        </div>
      </section>

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-900"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Uploaded Image Preview & Metadata */}
      {uploadedImage && (
        <section
          aria-label="Pratinjau dan informasi gambar"
          className="rounded-3xl border border-sky-200/80 bg-white p-6 shadow-sm"
        >
          <div className="grid items-start gap-7 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-2xl border border-sky-100 bg-slate-50">
                <img
                  src={uploadedImage.dataUrl}
                  alt="Gambar langit yang diunggah"
                  className="max-h-[380px] w-full object-contain"
                />
              </div>
              <p className="mt-2 text-center text-xs font-medium text-[#315d83]">
                Gambar langit yang diunggah
              </p>
            </div>

            <div className="flex flex-col justify-between space-y-5 lg:col-span-5">
              <div>
                <h2 className="font-display text-xl font-extrabold text-[#102f5b]">
                  Informasi Gambar
                </h2>

                <dl className="mt-4 divide-y divide-sky-100 rounded-2xl border border-sky-100 bg-[#f8fbff] px-4">
                  <div className="flex items-center justify-between gap-4 py-3 text-sm">
                    <dt className="font-medium text-[#315d83]">Nama file</dt>
                    <dd className="truncate font-mono text-xs font-semibold text-[#102b50]">
                      {uploadedImage.name}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3 text-sm">
                    <dt className="font-medium text-[#315d83]">Resolusi</dt>
                    <dd className="font-mono text-xs font-semibold tabular-nums text-[#102b50]">
                      {uploadedImage.width} × {uploadedImage.height} piksel
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3 text-sm">
                    <dt className="font-medium text-[#315d83]">Format</dt>
                    <dd className="font-mono text-xs font-semibold text-[#102b50]">
                      {uploadedImage.format}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 text-sm text-[#193b62]">
                <Info
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#0870c6]"
                  aria-hidden="true"
                />
                <span>
                  Pastikan gambar menampilkan kondisi langit dengan jelas.
                </span>
              </div>

              <button
                type="button"
                onClick={handlePredict}
                disabled={isPredicting}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-2xl bg-[#0870c6] px-6 py-3 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-[#075ca3] disabled:cursor-not-allowed disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0757a5]"
              >
                {isPredicting ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Model sedang menganalisis gambar...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" aria-hidden="true" />
                    <span>Analisis Kualitas Udara</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Analysis Results */}
      {prediction && predictedMeta && (
        <section
          aria-label="Hasil Analisis"
          className="space-y-6 rounded-3xl border border-sky-200/80 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-[#0870c6]" aria-hidden="true" />
            <h2 className="font-display text-2xl font-extrabold text-[#102f5b]">
              Hasil Analisis
            </h2>
          </div>

          {/* Semantic Result Banner */}
          <div
            className={`flex items-center gap-3 rounded-2xl border px-5 py-4 ${predictedMeta.surfaceClass} ${predictedMeta.borderClass} ${predictedMeta.textClass}`}
          >
            <PredictedIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="text-[15px] font-bold">
              Hasil klasifikasi: {prediction.predicted_class}
            </div>
          </div>

          {/* 2 Metric Readouts */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-sky-100 bg-[#f8fbff] p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#315d83]">
                Kualitas Udara
              </div>
              <div className="mt-2 font-display text-2xl font-extrabold text-[#102b50]">
                {prediction.predicted_class}
              </div>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-[#f8fbff] p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#315d83]">
                Confidence
              </div>
              <div className="mt-2 font-mono text-3xl font-extrabold tabular-nums text-[#102b50]">
                {(prediction.confidence * 100).toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Horizontal Bar Chart */}
          <div className="space-y-3 pt-1">
            <h3 className="font-display text-lg font-bold text-[#102f5b]">
              Probabilitas Setiap Kategori
            </h3>

            <div className="space-y-3 rounded-2xl border border-sky-100 bg-[#f8fbff] p-5">
              {CLASS_NAMES.map((name) => {
                const value = (prediction.probabilities[name] ?? 0) * 100;
                const meta = CATEGORY_META[name];
                const isWinner = name === prediction.predicted_class;
                return (
                  <div key={name} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span
                        className={`font-semibold ${
                          isWinner ? "text-[#102b50]" : "text-[#315d83]"
                        }`}
                      >
                        {name}
                      </span>
                      <span className="font-mono text-xs font-bold tabular-nums text-[#102b50]">
                        {value.toFixed(2)}%
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-sky-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${meta.barClass}`}
                        style={{ width: `${Math.max(1.5, value)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {prediction.visual_cues && (
              <p className="text-sm leading-relaxed text-[#24496f]">
                {prediction.visual_cues}
              </p>
            )}

            <p className="text-xs leading-relaxed text-[#315d83]">
              Confidence merupakan probabilitas keluaran model untuk kelas
              prediksi tertinggi, bukan pengukuran langsung konsentrasi polutan
              atau AQI.
            </p>
          </div>

          <div className="h-px w-full bg-sky-100" />

          {/* Integrated Grad-CAM Visualization */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-extrabold text-[#102f5b]">
                Visualisasi Grad-CAM
              </h2>
              <p className="text-sm text-[#24496f]">
                Visualisasikan bagian gambar yang berkontribusi terhadap
                keputusan model dalam menghasilkan prediksi tersebut.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateGradCam}
              disabled={isGeneratingGradCam}
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2.5 rounded-2xl bg-[#0870c6] px-6 py-2.5 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-[#075ca3] disabled:cursor-not-allowed disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0757a5]"
            >
              {isGeneratingGradCam ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Sedang menghasilkan visualisasi Grad-CAM...</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  <span>Lihat Visualisasi Grad-CAM</span>
                </>
              )}
            </button>

            {gradCam && uploadedImage && (
              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-bold text-[#102f5b]">
                    Hasil Interpretasi Model
                  </h3>

                  <div className="flex items-center gap-3 text-xs font-medium text-[#315d83]">
                    <span>Zona fokus utama:</span>
                    <span className="font-mono font-semibold text-[#102b50]">
                      {gradCam.peakZone}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <figure className="space-y-2">
                    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-slate-50">
                      <img
                        src={uploadedImage.dataUrl}
                        alt="Gambar Asli"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </div>
                    <figcaption className="text-center text-sm font-bold text-[#102b50]">
                      Gambar Asli
                    </figcaption>
                  </figure>

                  <figure className="space-y-2">
                    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-slate-900">
                      <img
                        src={gradCam.heatmapUrl}
                        alt="Heatmap Grad-CAM"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </div>
                    <figcaption className="text-center text-sm font-bold text-[#102b50]">
                      Heatmap Grad-CAM
                    </figcaption>
                  </figure>

                  <figure className="space-y-2">
                    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-slate-50">
                      <img
                        src={gradCam.overlayUrl}
                        alt="Overlay Grad-CAM"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </div>
                    <figcaption className="text-center text-sm font-bold text-[#102b50]">
                      Overlay
                    </figcaption>
                  </figure>
                </div>

                {/* Activation Legend */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-sky-100 bg-[#f8fbff] px-4 py-3 text-xs text-[#24496f]">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#102b50]">
                      Skala Aktivasi:
                    </span>
                    <span>Rendah</span>
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-32 rounded-full"
                      style={{
                        background:
                          "linear-gradient(90deg, #000080, #0066ff, #00d4ff, #33ff66, #ffff00, #ff3300)",
                      }}
                    />
                    <span>Tinggi</span>
                  </div>
                  <div className="font-mono tabular-nums text-[#315d83]">
                    Aktivasi rata-rata: {gradCam.meanActivation.toFixed(3)}
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 text-sm text-[#193b62]">
                  <Info
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#0870c6]"
                    aria-hidden="true"
                  />
                  <span>
                    Visualisasi ini menjelaskan fokus model, bukan pengukuran
                    konsentrasi polutan.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-bold text-[#102b50] transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0870c6]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Hapus Hasil dan Analisis Gambar Baru</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
