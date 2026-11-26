import { Cloud, Home, Image as ImageIcon, Menu, X } from "lucide-react";
import type { PageId } from "../types/skyair";

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenMobile: () => void;
}

const NAV_ITEMS: { id: PageId; label: string; icon: typeof Home }[] = [
  { id: "beranda", label: "Beranda", icon: Home },
  { id: "prediksi", label: "Prediksi Kualitas Udara", icon: ImageIcon },
];

export function Sidebar({
  currentPage,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  onOpenMobile,
}: SidebarProps) {
  const handleSelect = (page: PageId) => {
    onNavigate(page);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-sky-200/80 bg-[#074177] px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-2.5">
          <Cloud className="h-5 w-5 text-sky-200" aria-hidden="true" />
          <span className="font-display text-lg font-bold tracking-tight whitespace-nowrap">
            SkyAir
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Buka menu navigasi"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Rail */}
      <aside
        aria-label="Navigasi utama"
        className={`fixed inset-y-0 left-0 z-50 flex w-[272px] shrink-0 flex-col justify-between overflow-hidden border-r border-sky-900/20 bg-[#063e73] text-white transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Atmospheric Sky Photo Backdrop + Deep Cobalt Scrim */}
        <img
          src="/src/assets/images/sidebar_sky_deep_1795675176199.jpg"
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#053b6e]/88 via-[#074986]/82 to-[#042d56]/92"
        />

        <div className="relative z-10 flex flex-col px-5 pt-7 pb-6">
          {/* Mobile Close */}
          <div className="mb-3 flex justify-end lg:hidden">
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Tutup menu navigasi"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Brand Lockup */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center gap-2.5">
              <Cloud className="h-7 w-7 text-sky-200" aria-hidden="true" />
              <span className="font-display text-3xl font-extrabold tracking-tight text-white">
                SkyAir
              </span>
            </div>
            <p className="mt-2 text-sm font-medium leading-snug text-sky-100/90">
              Sistem Klasifikasi Kualitas Udara
            </p>
          </div>

          <div className="my-6 h-px w-full bg-white/20" />

          {/* Navigation Items */}
          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-[48px] w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-[15px] font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                    isActive
                      ? "bg-white text-[#0757a5] shadow-sm"
                      : "border border-white/15 bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-[#0757a5]" : "text-sky-200"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Academic Attribution Footer */}
        <div className="relative z-10 border-t border-white/20 px-5 py-4 text-xs leading-relaxed text-sky-100/80">
          <div className="font-semibold text-white">
            Intelligent Multimedia Processing
          </div>
          <div>Teknik Komputer</div>
        </div>
      </aside>
    </>
  );
}
