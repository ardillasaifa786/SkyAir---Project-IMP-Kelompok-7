export const CLASS_NAMES = [
  "Baik",
  "Sedang",
  "Tidak Sehat",
  "Tidak Sehat Bagi Sebagian Orang",
] as const;

export type AirQualityClass = (typeof CLASS_NAMES)[number];

export interface FocusRegion {
  x: number;
  y: number;
  radius: number;
  weight: number;
}

export interface PredictionResult {
  predicted_class: AirQualityClass;
  confidence: number;
  probabilities: Record<AirQualityClass, number>;
  visual_cues: string;
  focus_regions: FocusRegion[];
}

export interface ImageMetrics {
  meanBlueRatio: number;
  hazeIndex: number;
  contrastScore: number;
  saturationScore: number;
}

export interface UploadedSkyImage {
  name: string;
  format: string;
  mimeType: string;
  width: number;
  height: number;
  dataUrl: string;
  base64: string;
  metrics: ImageMetrics;
}

export interface GradCamOutput {
  heatmapUrl: string;
  overlayUrl: string;
  meanActivation: number;
  peakZone: string;
}

export type PageId = "beranda" | "prediksi";

export interface SkyFactItem {
  id: string;
  title: string;
  description: string;
  detail: string;
  image: string;
  imageAlt: string;
}

export const SKY_FACTS: SkyFactItem[] = [
  {
    id: "tentang-skyair",
    title: "Tentang SkyAir",
    description:
      "SkyAir merupakan sistem klasifikasi kualitas udara yang memanfaatkan citra langit dan teknologi Deep Learning.",
    detail:
      "SkyAir dikembangkan sebagai proyek Intelligent Multimedia Processing. Sistem menganalisis karakteristik visual pada citra langit untuk menghasilkan klasifikasi kualitas udara. Hasil model merupakan prediksi berbasis citra, bukan pengukuran langsung konsentrasi polutan atau AQI.",
    image: "/src/assets/images/fact_skyair_horizon_1795675176936.jpg",
    imageAlt: "Pemandangan langit cerah di atas cakrawala kota",
  },
  {
    id: "teknologi-cnn",
    title: "Teknologi CNN",
    description:
      "SkyAir menggunakan arsitektur MobileNetV3Small untuk mengekstraksi fitur visual dari citra langit.",
    detail:
      "MobileNetV3Small digunakan sebagai backbone CNN. Fitur visual yang diekstraksi kemudian diproses oleh lapisan klasifikasi untuk menghasilkan prediksi ke dalam empat kelas kualitas udara.",
    image: "/src/assets/images/fact_cnn_architecture_1795675177305.jpg",
    imageAlt: "Ilustrasi ekstraksi fitur Convolutional Neural Network",
  },
  {
    id: "empat-kategori",
    title: "Empat Kategori Kualitas Udara",
    description:
      "Model mengelompokkan citra ke dalam kategori Baik, Sedang, Tidak Sehat, dan Tidak Sehat Bagi Sebagian Orang.",
    detail:
      "Keempat kategori merupakan label klasifikasi yang digunakan dalam proyek SkyAir. Prediksi menunjukkan kelas dengan probabilitas keluaran tertinggi menurut model untuk citra yang diberikan.",
    image: "/src/assets/images/sky_hero_clouds_1795675176366.jpg",
    imageAlt: "Spektrum visual langit dan awan pada atmosfer cerah",
  },
  {
    id: "evaluasi-antarkota",
    title: "Evaluasi Antar Kota",
    description:
      "SkyAir mengeksplorasi kemampuan model ketika diuji pada citra dari kota yang berbeda.",
    detail:
      "Pengujian antar kota digunakan untuk mengamati kemampuan generalisasi model terhadap variasi kondisi visual dan lingkungan. Hasil evaluasi perlu ditinjau bersama metrik pengujian dan distribusi data yang digunakan.",
    image: "/src/assets/images/fact_city_skyline_1795675178547.jpg",
    imageAlt: "Panorama lanskap perkotaan untuk evaluasi antarkota",
  },
];

export interface StatDetailItem {
  id: string;
  value: string;
  label: string;
  modalTitle: string;
  description: string;
  additionalInfo: string;
  iconName: "images" | "map-pin" | "cloud-sun" | "cpu";
}

export const STAT_ITEMS: StatDetailItem[] = [
  {
    id: "citra",
    value: "5.004",
    label: "Jumlah citra langit",
    modalTitle: "Jumlah Citra Langit",
    description:
      "Dataset adalah kumpulan data yang digunakan model untuk belajar mengenali pola. Dalam SkyAir, dataset berisi 5.004 citra langit yang menjadi bahan pelatihan, validasi, dan pengujian model.",
    additionalInfo:
      "Pembagian data: Training 3.504 citra untuk melatih model; Validation 748 citra untuk memantau proses pelatihan; dan Testing 752 citra untuk mengevaluasi model pada data yang tidak digunakan saat training. Variasi citra membantu model mempelajari karakteristik visual langit yang beragam.",
    iconName: "images",
  },
  {
    id: "kota",
    value: "3",
    label: "Kota penelitian",
    modalTitle: "Kota Penelitian",
    description:
      "Setiap kota dapat memiliki karakteristik lingkungan dan tampilan langit yang berbeda, misalnya dari segi pencahayaan, warna, serta pola awan. Perbedaan ini dapat menjadi tantangan bagi model klasifikasi citra.",
    additionalInfo:
      "Dalam SkyAir, data dari tiga kota digunakan dalam pengujian antarkota untuk mengamati kemampuan generalisasi model. Artinya, pengujian ini membantu melihat apakah model tetap dapat mengenali pola citra ketika menghadapi data dari wilayah dengan karakteristik berbeda.",
    iconName: "map-pin",
  },
  {
    id: "kategori",
    value: "4",
    label: "Kategori kualitas udara",
    modalTitle: "Kategori Kualitas Udara",
    description:
      "Klasifikasi adalah proses mengelompokkan data ke dalam kelas berdasarkan pola yang dikenali. SkyAir menggunakan model CNN untuk mengelompokkan citra langit ke dalam empat kategori kualitas udara.",
    additionalInfo:
      "Empat kategori SkyAir adalah Baik, Sedang, Tidak Sehat, dan Tidak Sehat Bagi Sebagian Orang. Model menganalisis fitur visual pada gambar, lalu menghasilkan prediksi kategori. Hasil berbasis citra ini merupakan pendekatan visual dan bukan pengukuran langsung konsentrasi polutan.",
    iconName: "cloud-sun",
  },
  {
    id: "cnn",
    value: "CNN",
    label: "MobileNetV3Small",
    modalTitle: "Arsitektur Model",
    description:
      "MobileNetV3Small merupakan arsitektur Convolutional Neural Network (CNN) yang dirancang untuk mengenali pola visual dengan penggunaan komputasi yang relatif efisien. CNN mempelajari fitur gambar secara bertahap, mulai dari pola sederhana hingga karakteristik yang lebih kompleks.",
    additionalInfo:
      "Dalam SkyAir, MobileNetV3Small mengekstraksi fitur visual citra langit, seperti warna, tekstur, dan pola awan. Fitur tersebut kemudian diproses oleh lapisan klasifikasi untuk memprediksi salah satu dari empat kategori.",
    iconName: "cpu",
  },
];

export interface CategoryMeta {
  name: AirQualityClass;
  surfaceClass: string;
  textClass: string;
  borderClass: string;
  barClass: string;
  summary: string;
}

export const CATEGORY_META: Record<AirQualityClass, CategoryMeta> = {
  Baik: {
    name: "Baik",
    surfaceClass: "bg-emerald-50",
    textClass: "text-emerald-800",
    borderClass: "border-emerald-200",
    barClass: "bg-emerald-600",
    summary: "Langit cerah, visibilitas horizon jelas, kabut atmosfer minimal.",
  },
  Sedang: {
    name: "Sedang",
    surfaceClass: "bg-sky-50",
    textClass: "text-sky-800",
    borderClass: "border-sky-200",
    barClass: "bg-sky-600",
    summary: "Kondisi atmosfer moderat dengan tutupan awan atau kabut tipis.",
  },
  "Tidak Sehat": {
    name: "Tidak Sehat",
    surfaceClass: "bg-amber-50",
    textClass: "text-amber-900",
    borderClass: "border-amber-200",
    barClass: "bg-amber-600",
    summary: "Kabut atau partikulat tampak pekat sehingga kontras langit menurun.",
  },
  "Tidak Sehat Bagi Sebagian Orang": {
    name: "Tidak Sehat Bagi Sebagian Orang",
    surfaceClass: "bg-rose-50",
    textClass: "text-rose-800",
    borderClass: "border-rose-200",
    barClass: "bg-rose-600",
    summary: "Penurunan kejernihan horizon dan saturasi biru langit yang teramati.",
  },
};
