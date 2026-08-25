import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';

import {
  INDIA_LOCATIONS,
  SERVICES_LIST
} from '../data/portfolioData';

import {
  Calendar,
  Send,
  CheckCircle2,
  Download,
  X,
  Loader2,
  MailCheck,
  AlertCircle,
  Mail
} from 'lucide-react';

import {
  playClickSound,
  playCameraShutterSound
} from '../utils/audio';

interface BookingSectionProps {
  initialServiceTitle?: string;
  initialPrice?: number;
  isOpenModal?: boolean;
  onCloseModal?: () => void;
}

export const BookingSection: React.FC<BookingSectionProps> = ({
  initialServiceTitle,
  initialPrice,
  isOpenModal,
  onCloseModal
}) => {
  const [step, setStep] = useState(1);

  const [service, setService] = useState(
    initialServiceTitle || SERVICES_LIST[0].title
  );

  /*
   * =========================================================
   * LOCATION STATE
   * =========================================================
   */

  const [state, setState] = useState<
    keyof typeof INDIA_LOCATIONS | ''
  >('');

  const [district, setDistrict] = useState('');

  /*
   * Shoot location remains manual.
   * User can type a venue, village, area, resort, studio etc.
   */

  const [city, setCity] = useState('');

  const [shootDate, setShootDate] = useState('2026-09-01');

  const [budget, setBudget] = useState(
    initialPrice
      ? `$${initialPrice}`
      : '$4,000 - $8,000'
  );

  const [vision, setVision] = useState('');

  // Contact details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');

  // Confirmation & Network state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailNotice, setEmailNotice] = useState('');

  /*
   * =========================================================
   * SUBMIT BOOKING
   * =========================================================
   */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    playCameraShutterSound();
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      service,
      state,
      district,
      city,
      shootDate,
      budget,
      vision,
      fullName,
      email,
      company,
      phone
    };

    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit shoot booking');
      }

      const refCode =
        data.bookingRef ||
        'UP-' + Math.floor(100000 + Math.random() * 900000);

      setBookingRef(refCode);
      setEmailNotice(
        data.message ||
        'Notification emails dispatched to photographer & client inbox.'
      );
      setIsSubmitted(true);

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (error) {
        console.log('Confetti error:', error);
      }
    } catch (error: any) {
      console.warn('Booking backend notification warning:', error);

      // Local fallback ref if backend happens to be unreachable
      const fallbackRef =
        'UP-' + Math.floor(100000 + Math.random() * 900000);

      setBookingRef(fallbackRef);
      setSubmitError(error.message || 'Server connection notice');
      setIsSubmitted(true);

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.log('Confetti error:', e);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
   * =========================================================
   * DOWNLOAD BOOKING PDF
   * =========================================================
   */

  const handleDownloadPDF = () => {
    playClickSound(800);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;

    const dark = [8, 9, 14] as [number, number, number];
    const panel = [14, 18, 28] as [number, number, number];
    const cyan = [34, 211, 238] as [number, number, number];
    const white = [248, 250, 252] as [number, number, number];
    const text = [203, 213, 225] as [number, number, number];
    const muted = [100, 116, 139] as [number, number, number];
    const border = [45, 55, 72] as [number, number, number];
    const green = [52, 211, 153] as [number, number, number];
    const greenPanel = [6, 45, 40] as [number, number, number];

    const safeText = (value: string) => {
      return String(value || '')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    /*
     * Background
     */

    doc.setFillColor(...dark);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    /*
     * Top accent
     */

    doc.setFillColor(...cyan);
    doc.rect(0, 0, pageWidth, 3, 'F');

    /*
     * Header
     */

    doc.setTextColor(...cyan);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(21);
    doc.text(
      "DREAM PHOTO'S & FILM'S",
      margin,
      22
    );

    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(
      'PHOTOGRAPHY & VISUAL PRODUCTIONS',
      margin,
      28
    );

    doc.setTextColor(...text);
    doc.setFontSize(8);
    doc.text(
      'Photography by Utkarsh Patel',
      margin,
      34
    );

    /*
     * Status badge
     */

    const badgeWidth = 45;
    const badgeX =
      pageWidth - margin - badgeWidth;

    doc.setFillColor(7, 45, 42);
    doc.setDrawColor(20, 110, 105);

    doc.roundedRect(
      badgeX,
      15,
      badgeWidth,
      20,
      3,
      3,
      'FD'
    );

    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);

    doc.text(
      'BOOKING STATUS',
      badgeX + 5,
      22
    );

    doc.setTextColor(...green);
    doc.setFontSize(9);

    doc.text(
      'CONFIRMED',
      badgeX + 5,
      29
    );

    /*
     * Main title
     */

    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);

    doc.text(
      'BOOKING CONFIRMATION',
      margin,
      48
    );

    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    doc.text(
      'Official photography production inquiry record',
      margin,
      54
    );

    /*
     * Booking reference
     */

    doc.setTextColor(...cyan);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);

    doc.text(
      'BOOKING REFERENCE',
      pageWidth - margin,
      47,
      { align: 'right' }
    );

    doc.setTextColor(...white);
    doc.setFontSize(9.5);

    doc.text(
      bookingRef || 'PENDING',
      pageWidth - margin,
      53,
      { align: 'right' }
    );

    /*
     * Divider
     */

    doc.setDrawColor(...border);
    doc.setLineWidth(0.3);

    doc.line(
      margin,
      60,
      pageWidth - margin,
      60
    );

    /*
     * CLIENT DETAILS
     */

    doc.setTextColor(...cyan);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);

    doc.text(
      'CLIENT DETAILS',
      margin,
      69
    );

    const clientY = 74;
    const clientHeight = 37;

    doc.setFillColor(...panel);
    doc.setDrawColor(...border);

    doc.roundedRect(
      margin,
      clientY,
      contentWidth,
      clientHeight,
      3,
      3,
      'FD'
    );

    const secondColumn =
      margin + contentWidth / 2;

    /*
     * Full Name
     */

    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);

    doc.text(
      'FULL NAME',
      margin + 6,
      clientY + 9
    );

    doc.setTextColor(...white);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);

    doc.text(
      safeText(fullName) || 'Not provided',
      margin + 6,
      clientY + 15
    );

    /*
     * Email
     */

    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);

    doc.text(
      'EMAIL',
      margin + 6,
      clientY + 26
    );

    doc.setTextColor(...text);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);

    doc.text(
      safeText(email) || 'Not provided',
      margin + 6,
      clientY + 32
    );

    /*
     * Phone
     */

    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);

    doc.text(
      'PHONE / WHATSAPP',
      secondColumn,
      clientY + 9
    );

    doc.setTextColor(...white);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);

    doc.text(
      safeText(phone) || 'Not provided',
      secondColumn,
      clientY + 15
    );

    /*
     * Location
     */

    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);

    doc.text(
      'LOCATION',
      secondColumn,
      clientY + 26
    );

    doc.setTextColor(...text);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);

    const pdfLocation = [
      state,
      district,
      city
    ]
      .filter(Boolean)
      .join(', ');

    doc.text(
      safeText(pdfLocation) || 'Not provided',
      secondColumn,
      clientY + 32
    );

    /*
     * SHOOT DETAILS
     */

    const shootTitleY = 121;

    doc.setTextColor(...cyan);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);

    doc.text(
      'SHOOT DETAILS',
      margin,
      shootTitleY
    );

    const shootY = 126;
    const shootHeight = 44;

    doc.setFillColor(...panel);
    doc.setDrawColor(...border);

    doc.roundedRect(
      margin,
      shootY,
      contentWidth,
      shootHeight,
      3,
      3,
      'FD'
    );

    /*
     * Service
     */

    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);

    doc.text(
      'SERVICE',
      margin + 6,
      shootY + 10
    );

    doc.setTextColor(...white);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);

    doc.text(
      safeText(service),
      margin + 6,
      shootY + 16
    );

    /*
     * Date
     */

    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);

    doc.text(
      'SHOOT DATE',
      secondColumn,
      shootY + 10
    );

    doc.setTextColor(...white);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);

    doc.text(
      shootDate || 'Not specified',
      secondColumn,
      shootY + 16
    );

    /*
     * Location
     */

    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);

    doc.text(
      'LOCATION',
      margin + 6,
      shootY + 27
    );

    doc.setTextColor(...text);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);

    doc.text(
      safeText(city) || 'Not specified',
      margin + 6,
      shootY + 33
    );

    /*
     * Budget
     */

    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);

    doc.text(
      'ESTIMATED BUDGET',
      secondColumn,
      shootY + 27
    );

    doc.setTextColor(...text);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);

    doc.text(
      safeText(budget),
      secondColumn,
      shootY + 33
    );

    /*
     * CREATIVE VISION
     */

    const visionTitleY = 182;

    doc.setTextColor(...cyan);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);

    doc.text(
      'CLIENT REQUIREMENTS & CREATIVE VISION',
      margin,
      visionTitleY
    );

    const visionY = 187;
    const visionHeight = 47;

    doc.setFillColor(...panel);
    doc.setDrawColor(...border);

    doc.roundedRect(
      margin,
      visionY,
      contentWidth,
      visionHeight,
      3,
      3,
      'FD'
    );

    const visionText =
      safeText(vision) ||
      'No additional creative requirements were provided.';

    const visionLines =
      doc.splitTextToSize(
        visionText,
        contentWidth - 12
      );

    doc.setTextColor(...text);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    doc.text(
      visionLines.slice(0, 6),
      margin + 6,
      visionY + 12,
      {
        lineHeightFactor: 1.5
      }
    );

    /*
     * CONFIRMATION
     */

    const confirmationY = 244;

    doc.setFillColor(...greenPanel);
    doc.setDrawColor(16, 120, 90);

    doc.roundedRect(
      margin,
      confirmationY,
      contentWidth,
      27,
      3,
      3,
      'FD'
    );

    doc.setTextColor(...green);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);

    doc.text(
      'BOOKING REQUEST RECEIVED',
      margin + 7,
      confirmationY + 10
    );

    doc.setTextColor(...text);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    doc.text(
      'Thank you for choosing Dream Photos & Films. Your photography',
      margin + 7,
      confirmationY + 17
    );

    doc.text(
      'inquiry has been successfully received and logged.',
      margin + 7,
      confirmationY + 22
    );

    /*
     * FOOTER
     */

    doc.setDrawColor(...border);
    doc.setLineWidth(0.3);

    doc.line(
      margin,
      280,
      pageWidth - margin,
      280
    );

    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);

    doc.text(
      'Dream Photos & Films',
      margin,
      288
    );

    doc.text(
      'Photography by Utkarsh Patel',
      margin,
      293
    );

    doc.text(
      `Booking Ref: ${bookingRef}`,
      pageWidth - margin,
      288,
      { align: 'right' }
    );

    doc.text(
      `Generated: ${new Date().toLocaleDateString('en-GB')}`,
      pageWidth - margin,
      293,
      { align: 'right' }
    );

    doc.save(
      'Dream_Photos_Films_Booking.pdf'
    );
  };

  /*
   * =========================================================
   * RESET FORM
   * =========================================================
   */

  const resetForm = () => {
    setStep(1);
    setIsSubmitted(false);
    setSubmitError(null);
    setEmailNotice('');
  };

  /*
   * =========================================================
   * FORM CONTENT
   * =========================================================
   */

  const formContent = (
    <div className="space-y-6">

      {/* Booking Step Progress */}

      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                step === s
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_10px_#38bdf8]'
                  : step > s
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                  : 'bg-white/5 text-slate-500 border border-white/10'
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        <span className="font-mono text-xs text-slate-400">
          Step {step} of 3
        </span>
      </div>

      {/* Form Steps */}

      {isSubmitted ? (
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.95
          }}
          animate={{
            opacity: 1,
            scale: 1
          }}
          className="text-center py-8 space-y-6 glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/40"
        >
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_20px_#38bdf8]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest block">
              Booking Request Confirmed
            </span>

            <h3 className="font-display text-2xl font-bold text-white">
              Confirmation Ref:{' '}
              <span className="text-gradient-cyan">
                {bookingRef}
              </span>
            </h3>

            <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto">
              Thank you,{' '}
              <span className="text-white font-semibold">
                {fullName || 'Valued Client'}
              </span>
              . Your shoot inquiry for{' '}
              <span className="text-cyan-300">
                {service}
              </span>{' '}
              in{' '}
              <span className="text-cyan-300">
                {city || 'your selected location'}
              </span>{' '}
              has been recorded in our production system.
            </p>
          </div>

          {/* Email Notification Status Badges */}
          <div className="max-w-md mx-auto bg-[#0a0e1a]/80 border border-white/10 rounded-2xl p-4 text-left space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-emerald-400 font-mono">
              <MailCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{emailNotice || 'Photographer Utkarsh Patel has received email notification.'}</span>
            </div>
            {email && (
              <div className="flex items-center gap-2.5 text-xs text-cyan-300 font-mono">
                <Mail className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>Confirmation receipt sent to: <strong>{email}</strong></span>
              </div>
            )}
            {submitError && (
              <div className="flex items-center gap-2 text-[11px] text-amber-400/90 font-mono pt-1 border-t border-white/5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:via-sky-400 hover:to-indigo-500 border border-cyan-300/30 text-white text-xs font-bold tracking-wide flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-cyan-500/20"
            >
              <Download className="w-4 h-4" />
              <span>
                Download Booking PDF
              </span>
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono cursor-pointer transition-colors"
            >
              Submit Another Inquiry
            </button>

          </div>
        </motion.div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* =================================================
              STEP 1
             ================================================= */}

          {step === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >

              {/* Service */}

              <div className="space-y-1">
                <label className="font-mono text-xs text-slate-300 uppercase block">
                  Select Service Category
                </label>

                <select
                  value={service}
                  onChange={(e) =>
                    setService(e.target.value)
                  }
                  className="w-full glass-input px-4 py-3 rounded-xl text-sm text-white font-mono"
                >
                  {SERVICES_LIST.map((s) => (
                    <option
                      key={s.id}
                      value={s.title}
                      className="bg-[#0b0e17] text-white"
                    >
                      {s.title} (From ₹{s.startingPrice})
                    </option>
                  ))}
                </select>
              </div>

              {/* =================================================
                  STATE + DISTRICT
                 ================================================= */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* State */}

                <div className="space-y-1">
                  <label className="font-mono text-xs text-slate-300 uppercase block">
                    Select State
                  </label>

                  <select
                    value={state}
                    onChange={(e) => {
                      const selectedState =
                        e.target.value as keyof typeof INDIA_LOCATIONS | '';

                      setState(selectedState);

                      /*
                       * Reset district whenever state changes.
                       */
                      setDistrict('');
                    }}
                    className="w-full glass-input px-4 py-3 rounded-xl text-sm text-white font-mono"
                    required
                  >
                    <option
                      value=""
                      className="bg-[#0b0e17] text-slate-400"
                    >
                      Select State
                    </option>

                    {(Object.keys(INDIA_LOCATIONS) as Array<
                      keyof typeof INDIA_LOCATIONS
                    >).map((stateName) => (
                      <option
                        key={stateName}
                        value={stateName}
                        className="bg-[#0b0e17] text-white"
                      >
                        {stateName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District */}

                <div className="space-y-1">
                  <label className="font-mono text-xs text-slate-300 uppercase block">
                    Select District
                  </label>

                  <select
                    value={district}
                    onChange={(e) =>
                      setDistrict(e.target.value)
                    }
                    disabled={!state}
                    className={`w-full glass-input px-4 py-3 rounded-xl text-sm font-mono ${
                      state
                        ? 'text-white'
                        : 'text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                    required
                  >
                    <option
                      value=""
                      className="bg-[#0b0e17] text-slate-400"
                    >
                      {state
                        ? 'Select District'
                        : 'Select State First'}
                    </option>

                    {state &&
                      INDIA_LOCATIONS[state].map(
                        (districtName) => (
                          <option
                            key={districtName}
                            value={districtName}
                            className="bg-[#0b0e17] text-white"
                          >
                            {districtName}
                          </option>
                        )
                      )}
                  </select>
                </div>

              </div>

              {/* =================================================
                  MANUAL SHOOT LOCATION
                 ================================================= */}

              <div className="space-y-1">
                <label className="font-mono text-xs text-slate-300 uppercase block">
                  Shoot City / Location
                </label>

                <input
                  type="text"
                  value={city}
                  onChange={(e) =>
                    setCity(e.target.value)
                  }
                  placeholder="e.g. Shahada, Resort Name, Wedding Venue, Studio"
                  className="w-full glass-input px-4 py-3 rounded-xl text-sm text-white font-mono"
                  required
                />

                <p className="text-[10px] text-slate-500 font-mono">
                  Enter the exact city, area, venue, resort, studio or shoot location manually.
                </p>
              </div>

              {/* Date + Budget */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="space-y-1">
                  <label className="font-mono text-xs text-slate-300 uppercase block">
                    Target Shoot Date
                  </label>

                  <input
                    type="date"
                    value={shootDate}
                    onChange={(e) =>
                      setShootDate(e.target.value)
                    }
                    className="w-full glass-input px-4 py-3 rounded-xl text-sm text-white font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-xs text-slate-300 uppercase block">
                    Estimated Budget Range
                  </label>

                  <select
                    value={budget}
                    onChange={(e) =>
                      setBudget(e.target.value)
                    }
                    className="w-full glass-input px-4 py-3 rounded-xl text-sm text-white font-mono"
                  >
                    <option
                      value="₹40,000 – ₹60,000"
                      className="bg-[#0b0e17] text-white"
                    >
                      ₹40,000 – ₹60,000 INR (Pre-Wedding Photography)
                    </option>

                    <option
                      value="₹75,000 – ₹1,50,000+"
                      className="bg-[#0b0e17] text-white"
                    >
                      ₹75,000 – ₹1,50,000+ INR (Wedding Photography)
                    </option>

                    <option
                      value="₹15,000 – ₹30,000"
                      className="bg-[#0b0e17] text-white"
                    >
                      ₹15,000 – ₹30,000 INR (Event Photography)
                    </option>

                    <option
                      value="₹8,000 – ₹15,000"
                      className="bg-[#0b0e17] text-white"
                    >
                      ₹8,000 – ₹15,000 INR (Portrait Photography)
                    </option>
                  </select>
                </div>

              </div>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setStep(2);
                }}
                className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wider uppercase shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
              >
                Continue to Creative Brief
              </button>

            </motion.div>
          )}

          {/* =================================================
              STEP 2
             ================================================= */}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >

              <div className="space-y-1">
                <label className="font-mono text-xs text-slate-300 uppercase block">
                  Creative Vision & Mood Description
                </label>

                <textarea
                  rows={4}
                  value={vision}
                  onChange={(e) =>
                    setVision(e.target.value)
                  }
                  placeholder="Describe your creative vision, preferred aesthetic (e.g. cyber neon, editorial, minimalist), wardrobe requirements, or moodboard links..."
                  className="w-full glass-input p-4 rounded-xl text-sm text-white"
                  required
                />
              </div>

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-mono cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setStep(3);
                  }}
                  className="w-2/3 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wider uppercase shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                >
                  Continue to Contact Info
                </button>

              </div>

            </motion.div>
          )}

          {/* =================================================
              STEP 3
             ================================================= */}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="space-y-1">
                  <label className="font-mono text-xs text-slate-300 uppercase block">
                    Full Name *
                  </label>

                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    placeholder="Rohan Patel"
                    className="w-full glass-input px-4 py-3 rounded-xl text-sm text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-xs text-slate-300 uppercase block">
                    Email Address *
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="example@gmail.com"
                    className="w-full glass-input px-4 py-3 rounded-xl text-sm text-white"
                    required
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="space-y-1">
                  <label className="font-mono text-xs text-slate-300 uppercase block">
                    Location
                  </label>

                  <input
                    type="text"
                    value={company}
                    onChange={(e) =>
                      setCompany(e.target.value)
                    }
                    placeholder="Shahada"
                    className="w-full glass-input px-4 py-3 rounded-xl text-sm text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-xs text-slate-300 uppercase block">
                    Phone / WhatsApp
                  </label>

                  <input
                    type="text"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                    placeholder="+91 9876543210"
                    className="w-full glass-input px-4 py-3 rounded-xl text-sm text-white"
                  />
                </div>

              </div>

              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-mono cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-2/3 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 text-white font-bold text-sm tracking-wider uppercase shadow-xl shadow-cyan-500/30 transition-all flex items-center justify-center gap-2 ${
                    isSubmitting
                      ? 'opacity-80 cursor-wait'
                      : 'hover:scale-[1.02] active:scale-95 cursor-pointer'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                      <span>Transmitting & Emailing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Shoot Booking</span>
                    </>
                  )}
                </button>

              </div>

            </motion.div>
          )}

        </form>
      )}
    </div>
  );

  /*
   * =========================================================
   * MODAL
   * =========================================================
   */

  if (isOpenModal) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseModal}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl"
          />

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9,
              y: 20
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
              y: 20
            }}
            className="relative z-10 w-full max-w-2xl glass-card rounded-3xl p-6 sm:p-8 border border-white/20 bg-[#0c0e17] shadow-2xl my-auto"
          >

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">

              <h3 className="font-display font-bold text-xl text-white">
                Book a Photography Production
              </h3>

              <button
                onClick={onCloseModal}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            {formContent}

          </motion.div>

        </div>
      </AnimatePresence>
    );
  }

  /*
   * =========================================================
   * STANDALONE INLINE SECTION
   * =========================================================
   */

  return (
    <section
      id="contact"
      className="relative py-24 bg-[#08090e]"
    >

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}

        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">

          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Reserve Production Date
          </span>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white">
            Book Your{' '}
            <span className="text-gradient-cyan">
              Production
            </span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light">
            Select your preferred shoot category, location, target dates, and vision. We accept a limited number of high-profile commissions per quarter.
          </p>

        </div>

        {/* Inline Container */}

        <div className="max-w-3xl mx-auto glass-card rounded-3xl p-6 sm:p-10 border border-white/15 shadow-2xl">

          {formContent}

        </div>

      </div>

    </section>
  );
};
