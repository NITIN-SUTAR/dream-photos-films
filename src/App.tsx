import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { CustomCursor } from './components/CustomCursor';
import { HeroSection } from './components/HeroSection';
import { StatsBar } from './components/StatsBar';
import { PortfolioGallery } from './components/PortfolioGallery';
import { LightboxModal } from './components/LightboxModal';
import { RetouchSlider } from './components/RetouchSlider';
import { VirtualLightLab } from './components/VirtualLightLab';
import { ServicesSection } from './components/ServicesSection';
import { AboutSection } from './components/AboutSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { BookingSection } from './components/BookingSection';
import { Footer } from './components/Footer';
import { PhotoItem } from './types';
import { PORTFOLIO_PHOTOS } from './data/portfolioData';
import { setSoundEnabled as updateSoundUtil } from './utils/audio';

export function App() {
  const [soundEnabled, setSoundEnabledState] = useState(false);
  const [cursorEnabled, setCursorEnabled] = useState(true);

  // Lightbox Modal state
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<PhotoItem | null>(null);

  // Retouch slider active photo state
  const [retouchPhoto, setRetouchPhoto] = useState<PhotoItem | null>(PORTFOLIO_PHOTOS[0]);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<{ serviceTitle?: string; estimatedPrice?: number }>({});

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    updateSoundUtil(enabled);
  };

  const handleSelectLightboxPhoto = (photoIdOrItem: string | PhotoItem) => {
    if (typeof photoIdOrItem === 'string') {
      const found = PORTFOLIO_PHOTOS.find((p) => p.id === photoIdOrItem);
      if (found) setActiveLightboxPhoto(found);
    } else {
      setActiveLightboxPhoto(photoIdOrItem);
    }
  };

  const handleSelectRetouchPhoto = (photo: PhotoItem) => {
    setRetouchPhoto(photo);
    // Smooth scroll to retouch section
    document.getElementById('retouch')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenBookingWithDetails = (serviceTitle: string, estimatedPrice: number) => {
    setBookingPrefill({ serviceTitle, estimatedPrice });
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 selection:bg-cyan-500 selection:text-black relative">
      {/* Custom Spotlight Pointer */}
      <CustomCursor enabled={cursorEnabled} />

      {/* Floating Glass Navbar */}
      <Navbar
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        cursorEnabled={cursorEnabled}
        setCursorEnabled={setCursorEnabled}
        onOpenBooking={() => setBookingModalOpen(true)}
      />

      {/* Hero Section */}
      <HeroSection
        onOpenBooking={() => setBookingModalOpen(true)}
        onSelectPhoto={handleSelectLightboxPhoto}
      />

      {/* Key Metrics Stats Bar */}
      <StatsBar />

      {/* Portfolio Gallery Section */}
      <PortfolioGallery
        onSelectPhoto={handleSelectLightboxPhoto}
        onSelectRetouch={handleSelectRetouchPhoto}
      />

      {/* RAW vs Master Retouch Comparison Slider */}
      <RetouchSlider initialPhoto={retouchPhoto} />

      {/* Virtual Studio Light & Lens Lab */}
      <VirtualLightLab />

      {/* Photography Services & Package Estimator */}
      <ServicesSection onOpenBookingWithDetails={handleOpenBookingWithDetails} />

      {/* About Photographer & In My Camera Bag Gear Bag */}
      <AboutSection />

      {/* Client Testimonials */}
      <TestimonialsSection />

      {/* Booking & Global Schedule Section */}
      <BookingSection
        initialServiceTitle={bookingPrefill.serviceTitle}
        initialPrice={bookingPrefill.estimatedPrice}
      />

      {/* Footer */}
      <Footer />

      {/* Lightbox Modal */}
      <LightboxModal
        photo={activeLightboxPhoto}
        onClose={() => setActiveLightboxPhoto(null)}
        onSelectRetouch={handleSelectRetouchPhoto}
        onOpenBooking={() => setBookingModalOpen(true)}
      />

      {/* Quick Booking Modal Drawer */}
      {bookingModalOpen && (
        <BookingSection
          isOpenModal={true}
          onCloseModal={() => setBookingModalOpen(false)}
          initialServiceTitle={bookingPrefill.serviceTitle}
          initialPrice={bookingPrefill.estimatedPrice}
        />
      )}
    </div>
  );
}

export default App;
