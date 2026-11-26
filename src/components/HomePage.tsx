import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cloud,
  CloudSun,
  Cpu,
  HeartPulse,
  Images,
  Leaf,
  MapPin,
  Wind,
  X,
} from "lucide-react";
import {
  CATEGORY_META,
  CLASS_NAMES,
  SKY_FACTS,
  STAT_ITEMS,
  type AirQualityClass,
  type PageId,
  type StatDetailItem,
} from "../types/skyair";

interface HomePageProps {
  onNavigate: (page: PageId) => void;
}

const STAT_ICONS = {
  images: Images,
  "map-pin": MapPin,
  "cloud-sun": CloudSun,
  cpu: Cpu,
};

const CATEGORY_ICONS: Record<AirQualityClass, typeof Leaf> = {
  Baik: Leaf,
  Sedang: Wind,
  "Tidak Sehat": AlertTriangle,
  "Tidak Sehat Bagi Sebagian Orang": HeartPulse,
};

export function HomePage({ onNavigate }: HomePageProps) {
  const [factIndex, setFactIndex] = useState(0);
  const [factExpanded, setFactExpanded] = useState(false);
  const [activeStat, setActiveStat] = useState<StatDetailItem | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const currentFact = SKY_FACTS[factIndex];

  useEffect(() => {
    if (!activeStat) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveStat(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeStat]);

  const goToFact = (nextIndex: number) => {
    const wrapped = (nextIndex + SKY_FACTS.length) % SKY_FACTS.length;
    setFactIndex(wrapped);
    setFactExpanded(false);
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <header className="space-y-1.5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#102b50] sm:text-4xl">
          Beranda
        </h1>
        <p className="text-lg font-medium text-[#24496f]">
          Selamat datang di SkyAir
        </p>
      </header>

      {/* Diagonal-Split Hero Section */}
      <section
        aria-label="Pengenalan SkyAir"
        className="relative overflow-hidden rounded-3xl border border-sky-200/80 bg-[#e6f3ff] shadow-sm"
      >
        {/* Right-Side Diagonal Sky Photography */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-full md:block"
          style={{
            clipPath: "polygon(58% 0, 100% 0, 100% 100%, 42% 100%)",
          }}
        >
          <img
            src="/src/assets/images/sky_hero_clouds_1795675176366.jpg"
            alt=""
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#e6f3ff]/35 via-transparent to-transparent" />
        </div>

        {/* Crisp Diagonal Seam Line */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden bg-white/70 md:block"
          style={{
            clipPath: "polygon(57.7% 0, 58.2% 0, 42.2% 100%, 41.7% 100%)",
          }}
        />

        <div className="relative z-10 grid items-center gap-6 px-7 py-9 sm:px-10 sm:py-11 md:grid-cols-12">
          <div className="space-y-5 md:col-span-6 lg:col-span-6">
            <div className="text-xs font-bold tracking-[0.2em] uppercase text-[#0e67ad]">
              Intelligent Sky Analysis
            </div>

            <h2 className="font-display text-balance text-3xl font-extrabold leading-[1.1] tracking-tight text-[#102b50] sm:text-5xl">
              Pantau langit, pahami{" "}
              <span className="text-[#087acb]">udara.</span>
            </h2>

            <p className="max-w-lg text-base leading-relaxed text-[#183b63] sm:text-lg">
              Sistem cerdas untuk mengklasifikasikan kualitas udara berdasarkan
              citra langit.
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => onNavigate("prediksi")}
                className="inline-flex min-h-[46px] items-center gap-2.5 rounded-full bg-[#0870c6] px-6 py-2.5 text-[15px] font-bold text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#075ca3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0757a5] whitespace-nowrap shrink-0"
              >
                <span>Mulai Prediksi</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Mobile Sky Preview */}
          <div className="overflow-hidden rounded-2xl border border-sky-200 md:hidden">
            <img
              src="/src/assets/images/sky_hero_clouds_1795675176366.jpg"
              alt="Langit biru berawan cerah"
              referrerPolicy="no-referrer"
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* SkyAir Facts Interactive Carousel */}
      <section
        aria-label="SkyAir Facts"
        className="rounded-3xl border border-sky-200/80 bg-[#edf6ff] p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
          <div className="flex items-center gap-2.5">
            <Cloud className="h-6 w-6 text-[#0870c6]" aria-hidden="true" />
            <h2 className="font-display text-xl font-extrabold text-[#102f5b] sm:text-2xl">
              SkyAir Facts
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToFact(factIndex - 1)}
              aria-label="Fakta sebelumnya"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 bg-white text-[#102f5b] transition-colors hover:bg-sky-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0870c6]"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="min-w-[68px] text-center font-mono text-xs font-semibold tabular-nums text-[#24496f]">
              {factIndex + 1} dari {SKY_FACTS.length}
            </span>
            <button
              type="button"
              onClick={() => goToFact(factIndex + 1)}
              aria-label="Fakta berikutnya"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 bg-white text-[#102f5b] transition-colors hover:bg-sky-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0870c6]"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Inner Content Stage */}
        <div className="rounded-2xl border border-sky-200/80 bg-white p-4 sm:p-6">
          <div className="grid items-center gap-6 md:grid-cols-12">
            <div className="md:col-span-4 lg:col-span-3">
              <div className="overflow-hidden rounded-xl border border-sky-100 bg-sky-50">
                {failedImages[currentFact.id] ? (
                  <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-sky-100 to-sky-50 p-4 text-center text-[#0870c6]">
                    <CloudSun className="h-8 w-8" aria-hidden="true" />
                    <span className="text-xs font-semibold">
                      {currentFact.title}
                    </span>
                  </div>
                ) : (
                  <img
                    src={currentFact.image}
                    alt={currentFact.imageAlt}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedImages((prev) => ({
                        ...prev,
                        [currentFact.id]: true,
                      }))
                    }
                    className="aspect-[4/3] w-full object-cover"
                  />
                )}
              </div>
            </div>

            <div className="space-y-3 md:col-span-8 lg:col-span-9">
              <div className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#0872be]">
                Tahukah Kamu?
              </div>

              <h3 className="font-display text-xl font-extrabold leading-snug text-[#102f5b] sm:text-2xl">
                {currentFact.title}
              </h3>

              <p className="text-[15px] leading-relaxed text-[#24496f]">
                {currentFact.description}
              </p>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setFactExpanded((prev) => !prev)}
                  aria-expanded={factExpanded}
                  className="inline-flex min-h-[38px] items-center gap-2 rounded-full bg-[#087cc5] px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#0665a1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0870c6] whitespace-nowrap shrink-0"
                >
                  {factExpanded ? (
                    <>
                      <span>Tutup Informasi</span>
                      <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      <span>Baca Selengkapnya</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {factExpanded && (
            <div className="mt-4 border-t border-sky-100 pt-4 text-sm leading-relaxed text-[#24496f]">
              <div className="mb-1 font-display font-bold text-[#102f5b]">
                {currentFact.title}
              </div>
              <p>{currentFact.detail}</p>
            </div>
          )}
        </div>

        {/* Interactive Dot Pagination */}
        <div
          className="mt-4 flex items-center justify-center gap-2"
          role="tablist"
          aria-label="Pilih fakta SkyAir"
        >
          {SKY_FACTS.map((fact, idx) => {
            const isActive = idx === factIndex;
            return (
              <button
                key={fact.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Tampilkan fakta ${idx + 1}: ${fact.title}`}
                onClick={() => goToFact(idx)}
                className={`h-2.5 rounded-full transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0870c6] ${
                  isActive ? "w-7 bg-[#087cc5]" : "w-2.5 bg-sky-200 hover:bg-sky-300"
                }`}
              />
            );
          })}
        </div>
      </section>

      {/* 4 Interactive Statistic Cards */}
      <section aria-label="Statistik Dataset dan Model">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STAT_ITEMS.map((item) => {
            const Icon = STAT_ICONS[item.iconName];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveStat(item)}
                className="group flex items-center gap-4 rounded-2xl border border-sky-200/80 bg-white p-5 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0870c6]"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#d7edff] text-[#0870c6] transition-colors group-hover:bg-[#c2e3ff]">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-mono text-2xl font-bold tracking-tight tabular-nums text-[#102b50]">
                    {item.value}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold leading-snug text-[#193b62]">
                    {item.label}
                  </div>
                  <div className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[#0870c6] underline decoration-sky-300 underline-offset-4 group-hover:text-[#055294]">
                    <span>Lihat detail</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Air Quality Categories Section */}
      <section
        aria-label="Kategori Kualitas Udara"
        className="rounded-3xl border border-sky-200/80 bg-white p-6 shadow-sm"
      >
        <div className="mb-5 flex items-center gap-2.5">
          <CloudSun className="h-6 w-6 text-[#0876d1]" aria-hidden="true" />
          <h2 className="font-display text-xl font-extrabold text-[#102f5b]">
            Kategori Kualitas Udara
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {CLASS_NAMES.map((className) => {
            const meta = CATEGORY_META[className];
            const Icon = CATEGORY_ICONS[className];
            return (
              <div
                key={className}
                className={`flex flex-col items-center justify-center rounded-2xl border p-5 text-center ${meta.surfaceClass} ${meta.borderClass} ${meta.textClass}`}
              >
                <Icon className="mb-2.5 h-6 w-6 shrink-0" aria-hidden="true" />
                <div className="font-display text-sm font-bold leading-snug">
                  {meta.name}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed opacity-85">
                  {meta.summary}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Statistic Detail Modal */}
      {activeStat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          onClick={() => setActiveStat(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="stat-modal-title"
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-sky-200 bg-white p-6 shadow-xl sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4">
              <span className="font-display text-sm font-bold text-[#24496f]">
                Detail Statistik SkyAir
              </span>
              <button
                type="button"
                onClick={() => setActiveStat(null)}
                aria-label="Tutup dialog"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-[#e8f4ff] to-white p-6 text-center">
              <div className="font-mono text-4xl font-extrabold tabular-nums text-[#12345b]">
                {activeStat.value}
              </div>
              <h3
                id="stat-modal-title"
                className="mt-2 font-display text-xl font-bold text-[#1769aa]"
              >
                {activeStat.modalTitle}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[#244b70]">
                {activeStat.description}
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/80 p-4 text-sm leading-relaxed text-[#193b62]">
              {activeStat.additionalInfo}
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setActiveStat(null)}
                className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-[#102b50] transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0870c6]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span>Tutup</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
