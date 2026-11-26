import { useState } from "react";
import { HomePage } from "./components/HomePage";
import { PredictionPage } from "./components/PredictionPage";
import { Sidebar } from "./components/Sidebar";
import type { PageId } from "./types/skyair";

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>("beranda");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f9fe] text-[#173b63] lg:flex">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        mobileOpen={mobileMenuOpen}
        onOpenMobile={() => setMobileMenuOpen(true)}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-8 sm:py-8">
          {currentPage === "beranda" ? (
            <HomePage onNavigate={setCurrentPage} />
          ) : (
            <PredictionPage />
          )}
        </main>

        <footer className="border-t border-sky-200/70 px-6 py-5 text-center text-xs font-medium text-[#315678]">
          SkyAir · Intelligent Multimedia Processing
        </footer>
      </div>
    </div>
  );
}
