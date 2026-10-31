/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { calculateRupeeBudgetLedger, BudgetItem } from './budgetCalculator.ts';

interface TimelineItem {
  timeBefore: string;
  task: string;
}

interface VendorChecklistGroup {
  vendorType: string;
  items: string[];
}

interface IdeaItem {
  title: string;
  description: string;
}

interface EventPlan {
  summary: {
    eventType: string;
    guestCount: number;
    budget: number;
    city: string;
    eventDate: string;
    style: string;
  };
  budgetLedger: BudgetItem[];
  totalBudget: number;
  timeline: TimelineItem[];
  vendorChecklist: VendorChecklistGroup[];
  ideas: IdeaItem[];
}

// Preset samples to help the user test realistic Indian scenarios immediately
const PRESETS = [
  {
    name: '30-guest Birthday',
    eventType: 'Birthday',
    guestCount: 30,
    budget: 50000,
    city: 'Jaipur',
    eventDate: '2026-12-05',
    style: 'An intimate terrace dinner with warm brass lanterns, quiet instrumental music, regional delicacies, and home-baked dessert.',
  },
  {
    name: '150-guest Wedding',
    eventType: 'Wedding',
    guestCount: 150,
    budget: 1200000,
    city: 'Pune',
    eventDate: '2027-02-14',
    style: 'A traditional daytime wedding with marigold decor, live shehnai, banana leaf feast, and handloom keepsakes.',
  },
  {
    name: '80-guest Community Event',
    eventType: 'Community event',
    guestCount: 80,
    budget: 150000,
    city: 'Bengaluru',
    eventDate: '2026-11-20',
    style: 'A neighbourhood harvest lunch in a community courtyard with folk music, filter coffee, and local sweet stalls.',
  },
];

// Format Indian Rupee values with proper commas
function formatRupees(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return '₹' + amount.toLocaleString('en-IN');
}


const INITIAL_SAMPLE_PLAN: EventPlan = {
  summary: {
    eventType: 'Birthday',
    guestCount: 30,
    budget: 50000,
    city: 'Jaipur',
    eventDate: '2026-12-05',
    style: 'An intimate garden dinner with warm fairy lights, acoustic music, regional comfort food, and homemade dessert.',
  },
  budgetLedger: calculateRupeeBudgetLedger(
    [
      { category: 'Venue', share: 25 },
      { category: 'Food', share: 35 },
      { category: 'Decor', share: 15 },
      { category: 'Entertainment', share: 10 },
      { category: 'Photography', share: 10 },
      { category: 'Miscellaneous', share: 5 },
    ],
    50000
  ),
  totalBudget: 50000,
  timeline: [
    {
      timeBefore: '8 weeks before',
      task: 'Finalise the garden or terrace booking in Jaipur and verify evening lighting permissions.',
    },
    {
      timeBefore: '6 weeks before',
      task: 'Select the local caterer, fix the thali menu, and arrange for clay tea service.',
    },
    {
      timeBefore: '4 weeks before',
      task: 'Order marigold garlands from the morning mandi and confirm acoustic audio equipment.',
    },
    {
      timeBefore: '2 weeks before',
      task: 'Send digital invitations and confirm the final guest list with dietary notes.',
    },
    {
      timeBefore: '1 week before',
      task: 'Confirm delivery schedules with the bakery, florist, and rental chair vendor.',
    },
    {
      timeBefore: 'Day of event',
      task: 'Coordinate sound check, light the brass lanterns, and set up the welcome table two hours prior.',
    },
  ],
  vendorChecklist: [
    {
      vendorType: 'Venue & Facilities',
      items: [
        'Confirm venue access time and setup window with the caretaker.',
        'Verify backup inverter connection for lighting and audio.',
        'Ensure clean restrooms with fresh hand towels and soaps.',
      ],
    },
    {
      vendorType: 'Food & Sweets',
      items: [
        'Confirm service team count and live food counter arrangement.',
        'Order drinking water dispensers and clean glassware.',
        'Prepare clean takeaway boxes for leftover sweets.',
      ],
    },
    {
      vendorType: 'Decor & Florals',
      items: [
        'Pick up fresh marigold and tuberose garlands from the morning market.',
        'Test filament fairy lights and heavy-duty extension cables.',
        'Place handwritten place cards and terracotta tea-light holders.',
      ],
    },
    {
      vendorType: 'Photography & Music',
      items: [
        'Share shot list for family group photos and candid moments.',
        'Verify acoustic guitarist arrival time and microphone setup.',
      ],
    },
  ],
  ideas: [
    {
      title: 'Terracotta and marigold styling',
      description: 'Decorate tables with raw earthen pots filled with fresh yellow marigolds and tuberose strings from Jaipur flower mandis instead of costly imported flowers.',
    },
    {
      title: 'Regional street-food counter',
      description: 'Host a live kachori and chaat station alongside hot ginger tea in kulhads, keeping catering costs within ₹580 per guest.',
    },
    {
      title: 'Acoustic evening music',
      description: 'Engage a local classical guitarist or sitar student for ninety minutes of instrumental music that allows unhurried conversation.',
    },
    {
      title: 'Block-print fabric runners',
      description: 'Buy cotton Sanganeri block-print fabric lengths from local Jaipur bazaars to use as table runners and later repurpose as home linens.',
    },
    {
      title: 'Home-baked dessert table',
      description: 'Pair a simple celebration cake with warm homemade gulab jamun or rabri served in small clay cups.',
    },
  ],
};

export default function App() {
  // Pre-filled realistic sample: 30-guest birthday, 50,000 INR budget
  const [eventType, setEventType] = useState<string>('Birthday');
  const [guestCount, setGuestCount] = useState<number>(30);
  const [budget, setBudget] = useState<number>(50000);
  const [city, setCity] = useState<string>('Jaipur');
  const [eventDate, setEventDate] = useState<string>('2026-12-05');
  const [style, setStyle] = useState<string>(
    'An intimate garden dinner with warm fairy lights, acoustic music, regional comfort food, and homemade dessert.'
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [plan, setPlan] = useState<EventPlan | null>(INITIAL_SAMPLE_PLAN);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkedChecklist, setCheckedChecklist] = useState<Record<string, boolean>>({});
  const [activeView, setActiveView] = useState<'planner' | 'privacy' | 'terms'>('planner');
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>(
    'Utsav event planner ready with initial sample plan for 30-guest birthday in Jaipur.'
  );

  // Load a preset sample and recalculate rupee amounts in code
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setEventType(preset.eventType);
    setGuestCount(preset.guestCount);
    setBudget(preset.budget);
    setCity(preset.city);
    setEventDate(preset.eventDate);
    setStyle(preset.style);
    setErrorMessage(null);
    setLiveAnnouncement(
      `Loaded draft sample for ${preset.name} in ${preset.city} with a budget of ${formatRupees(preset.budget)}.`
    );

    if (plan) {
      const currentShares = plan.budgetLedger.map((item) => ({
        category: item.category,
        share: item.share,
      }));
      const updatedLedger = calculateRupeeBudgetLedger(currentShares, preset.budget);
      setPlan({
        ...plan,
        summary: {
          ...plan.summary,
          eventType: preset.eventType,
          guestCount: preset.guestCount,
          budget: preset.budget,
          city: preset.city,
          eventDate: preset.eventDate,
          style: preset.style,
        },
        budgetLedger: updatedLedger,
        totalBudget: preset.budget,
      });
    }
  };

  // When user edits budget in input, the app calculates rupee amounts in code
  const handleBudgetChange = (newBudget: number) => {
    setBudget(newBudget);
    if (plan && newBudget > 0) {
      const currentShares = plan.budgetLedger.map((item) => ({
        category: item.category,
        share: item.share,
      }));
      const updatedLedger = calculateRupeeBudgetLedger(currentShares, newBudget);
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              budgetLedger: updatedLedger,
              totalBudget: newBudget,
              summary: { ...prev.summary, budget: newBudget },
            }
          : null
      );
    }
  };

  // Submit plan generation to the server
  const handleGeneratePlan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!city.trim()) {
      const msg = 'Please enter a city or location for the event.';
      setErrorMessage(msg);
      setLiveAnnouncement(`Error: ${msg}`);
      return;
    }

    if (budget <= 0) {
      const msg = 'Please enter a budget greater than zero.';
      setErrorMessage(msg);
      setLiveAnnouncement(`Error: ${msg}`);
      return;
    }

    if (guestCount <= 0) {
      const msg = 'Please enter a guest count greater than zero.';
      setErrorMessage(msg);
      setLiveAnnouncement(`Error: ${msg}`);
      return;
    }

    setLoading(true);
    setLiveAnnouncement('Planning your event with Gemini. Please wait a moment.');

    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          guestCount,
          budget,
          city: city.trim(),
          eventDate,
          style: style.trim(),
        }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.ok && data?.success && data?.plan) {
        // The app itself calculates the rupee amounts in code:
        // amount = total budget x share / 100, rounded to the nearest rupee,
        // and balances differences on the largest category.
        const rawShares =
          data.plan.budgetLedger && data.plan.budgetLedger.length > 0
            ? data.plan.budgetLedger
            : data.plan.budgetShares || [];
        const calculatedLedger = calculateRupeeBudgetLedger(rawShares, budget);

        setPlan({
          ...data.plan,
          budgetLedger: calculatedLedger,
          totalBudget: budget,
        });

        setLiveAnnouncement(
          `Your event plan for ${data.plan.summary.eventType} in ${data.plan.summary.city} with a budget of ${formatRupees(budget)} is ready. Budget ledger, timeline, vendor checklist, and ideas are displayed below.`
        );

        // Scroll smoothly to results and focus for accessibility
        setTimeout(() => {
          const el = document.getElementById('results-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            el.focus();
          }
        }, 80);
      } else {
        const errorMsg = data?.error || 'Unable to generate the plan at this moment. Please check your details and try again.';
        setErrorMessage(errorMsg);
        setLiveAnnouncement(`Error: ${errorMsg}`);
      }
    } catch {
      const netMsg = 'Network connection interrupted. Please try again in a moment.';
      setErrorMessage(netMsg);
      setLiveAnnouncement(`Error: ${netMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleChecklist = (itemKey: string) => {
    setCheckedChecklist((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen text-[#231F1A] bg-[#F3EDE2] px-4 py-10 sm:py-16">
      {/* Screen reader live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveAnnouncement}
      </div>

      <div className="max-w-[720px] mx-auto">
        {/* Header */}
        <header className="border-b border-[#CFC6B6] pb-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
            <h1 className="text-3xl sm:text-4xl text-[#231F1A] font-normal tracking-tight">
              Utsav
            </h1>
            <span className="text-sm text-[#5F574C]">
              A quiet event planner for celebrations across India
            </span>
          </div>
          <p className="mt-3 text-base text-[#5F574C] leading-relaxed">
            Enter your celebration details to receive a realistic budget ledger, preparation timeline, vendor checklist, and thoughtful local ideas.
          </p>
        </header>

        {/* View Switcher: Privacy or Terms View */}
        {activeView === 'privacy' && (
          <section className="border border-[#CFC6B6] p-6 sm:p-8 bg-[#F3EDE2] mb-12" aria-labelledby="privacy-heading">
            <div className="flex justify-between items-baseline border-b border-[#CFC6B6] pb-4 mb-5">
              <h2 id="privacy-heading" className="text-2xl text-[#231F1A]">Privacy Notice</h2>
              <button
                type="button"
                onClick={() => setActiveView('planner')}
                className="text-sm text-[#9C3D2A] underline hover:no-underline"
              >
                Back to planner
              </button>
            </div>
            <div className="space-y-4 text-base text-[#231F1A] leading-relaxed">
              <p>
                The event details you enter in this planner (event type, guest count, budget, city, date, and style notes) are sent directly to the Google Gemini API to produce your custom plan.
              </p>
              <p>
                This application does not store, retain, or share your entries in any database. When you close or refresh this browser tab, your entered information and plan disappear.
              </p>
              <p>
                No user accounts, tracking cookies, or personal profiles are created.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#CFC6B6]">
              <button
                type="button"
                onClick={() => setActiveView('planner')}
                className="px-4 py-2 border border-[#CFC6B6] text-sm text-[#231F1A] bg-[#F3EDE2] hover:underline"
              >
                Return to planning
              </button>
            </div>
          </section>
        )}

        {activeView === 'terms' && (
          <section className="border border-[#CFC6B6] p-6 sm:p-8 bg-[#F3EDE2] mb-12" aria-labelledby="terms-heading">
            <div className="flex justify-between items-baseline border-b border-[#CFC6B6] pb-4 mb-5">
              <h2 id="terms-heading" className="text-2xl text-[#231F1A]">Terms of Use</h2>
              <button
                type="button"
                onClick={() => setActiveView('planner')}
                className="text-sm text-[#9C3D2A] underline hover:no-underline"
              >
                Back to planner
              </button>
            </div>
            <div className="space-y-4 text-base text-[#231F1A] leading-relaxed">
              <p>
                The budgets, timelines, checklists, and recommendations generated by Utsav are editorial suggestions provided for initial planning purposes.
              </p>
              <p>
                All rupee amounts are general estimates. Actual prices for venues, catering, photography, and decor vary significantly based on season, specific city neighbourhoods, vendor reputation, and exact dates.
              </p>
              <p>
                Always verify availability, contracts, and municipal permits directly with local vendors and authorities before committing funds.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#CFC6B6]">
              <button
                type="button"
                onClick={() => setActiveView('planner')}
                className="px-4 py-2 border border-[#CFC6B6] text-sm text-[#231F1A] bg-[#F3EDE2] hover:underline"
              >
                Return to planning
              </button>
            </div>
          </section>
        )}

        {activeView === 'planner' && (
          <>
            {/* Sample Presets Bar */}
            <div className="no-print mb-6 pb-4 border-b border-[#CFC6B6]">
              <h2 id="drafts-heading" className="sr-only">Draft sample templates</h2>
              <span id="drafts-label" className="text-xs uppercase tracking-wider text-[#5F574C] block mb-2 font-medium">
                Sample drafts
              </span>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="drafts-label">
                {PRESETS.map((p) => {
                  const isActive =
                    p.eventType === eventType &&
                    p.budget === budget &&
                    p.guestCount === guestCount;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyPreset(p)}
                      aria-pressed={isActive}
                      className={`text-xs px-2.5 py-1.5 border text-left cursor-pointer ${
                        isActive
                          ? 'border-[#9C3D2A] text-[#9C3D2A] font-semibold bg-[#EBE3D5]'
                          : 'border-[#CFC6B6] text-[#231F1A] hover:border-[#5F574C]'
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event Input Form */}
            <form onSubmit={handleGeneratePlan} aria-label="Event planning details" className="no-print space-y-6 pb-8 border-b border-[#CFC6B6]">
              <h2 className="sr-only">Event planning form</h2>

              {/* Event Type */}
              <fieldset className="border-0 p-0 m-0">
                <legend className="block text-sm text-[#231F1A] mb-2 font-normal">
                  Event type
                </legend>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Event type selection">
                  {['Wedding', 'Birthday', 'Community event'].map((type) => {
                    const isSelected = eventType.toLowerCase() === type.toLowerCase();
                    const inputId = `event-type-${type.toLowerCase().replace(/\s+/g, '-')}`;
                    return (
                      <div key={type} className="relative">
                        <input
                          type="radio"
                          name="eventType"
                          id={inputId}
                          value={type}
                          checked={isSelected}
                          onChange={() => setEventType(type)}
                          className="sr-only"
                        />
                        <label
                          htmlFor={inputId}
                          className={`block py-2 text-center text-sm border cursor-pointer select-none ${
                            isSelected
                              ? 'border-[#9C3D2A] text-[#9C3D2A] font-semibold bg-[#EBE3D5]'
                              : 'border-[#CFC6B6] text-[#231F1A] bg-transparent hover:border-[#5F574C]'
                          }`}
                        >
                          {type}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </fieldset>

              {/* Guests and Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="guestCount" className="block text-sm text-[#231F1A] mb-1 font-normal">
                    Number of guests
                  </label>
                  <input
                    id="guestCount"
                    name="guestCount"
                    type="number"
                    min="2"
                    max="10000"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    aria-describedby="guestCount-desc"
                    className="w-full px-3 py-2 border border-[#CFC6B6] text-base text-[#231F1A] bg-transparent"
                    required
                  />
                  <span id="guestCount-desc" className="text-xs text-[#5F574C] mt-1 block">
                    Family, friends, and attendees
                  </span>
                </div>

                <div>
                  <label htmlFor="budget" className="block text-sm text-[#231F1A] mb-1 font-normal">
                    Total budget in INR
                  </label>
                  <input
                    id="budget"
                    name="budget"
                    type="number"
                    step="1000"
                    min="1000"
                    max="1000000000"
                    value={budget}
                    onChange={(e) => handleBudgetChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    aria-describedby="budget-desc"
                    className="w-full px-3 py-2 border border-[#CFC6B6] text-base text-[#231F1A] bg-transparent"
                    required
                  />
                  <span id="budget-desc" className="text-xs text-[#5F574C] mt-1 block">
                    Formatted: {formatRupees(budget)}
                  </span>
                </div>
              </div>

              {/* City and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm text-[#231F1A] mb-1 font-normal">
                    City or region
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Jaipur, Pune, Bengaluru"
                    aria-describedby="city-desc"
                    className="w-full px-3 py-2 border border-[#CFC6B6] text-base text-[#231F1A] bg-transparent"
                    required
                  />
                  <span id="city-desc" className="text-xs text-[#5F574C] mt-1 block">
                    Used to tailor local food, vendors, and flower markets
                  </span>
                </div>

                <div>
                  <label htmlFor="eventDate" className="block text-sm text-[#231F1A] mb-1 font-normal">
                    Event date
                  </label>
                  <input
                    id="eventDate"
                    name="eventDate"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    aria-describedby="eventDate-desc"
                    className="w-full px-3 py-2 border border-[#CFC6B6] text-base text-[#231F1A] bg-transparent"
                  />
                  <span id="eventDate-desc" className="text-xs text-[#5F574C] mt-1 block">
                    Helps arrange the timeline milestones
                  </span>
                </div>
              </div>

              {/* Style Free-text */}
              <div>
                <label htmlFor="style" className="block text-sm text-[#231F1A] mb-1 font-normal">
                  Style and atmosphere
                </label>
                <textarea
                  id="style"
                  name="style"
                  rows={3}
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder="Describe colors, music, food preferences, venue type, or guest experience..."
                  aria-describedby="style-desc"
                  className="w-full px-3 py-2 border border-[#CFC6B6] text-base text-[#231F1A] bg-transparent leading-relaxed"
                />
                <span id="style-desc" className="text-xs text-[#5F574C] mt-1 block">
                  Write any special wishes, dietary preferences, or aesthetic details.
                </span>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div role="alert" aria-live="assertive" className="p-3 border border-[#9C3D2A] text-sm text-[#9C3D2A] bg-[#F7EFE9]">
                  {errorMessage}
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="w-full sm:w-auto px-8 py-3 text-base text-[#F3EDE2] bg-[#9C3D2A] cursor-pointer hover:bg-[#853424] disabled:opacity-50"
                >
                  {loading ? 'Preparing plan...' : 'Plan my event'}
                </button>
              </div>
            </form>

            {/* SKELETON LOADING STATE (calm paper tone blocks, no spinner) */}
            {loading && (
              <section className="mt-10 p-6 sm:p-8 bg-[#EBE2D0] border border-[#CFC6B6] space-y-10">
                <div className="border-b border-[#CFC6B6] pb-4">
                  <div className="h-6 w-48 bg-[#D8CDBC] mb-2"></div>
                  <div className="h-4 w-72 bg-[#DDD3BF]"></div>
                </div>

                {/* Skeleton Section 1: Budget Table */}
                <div className="space-y-3">
                  <div className="h-5 w-32 bg-[#D8CDBC]"></div>
                  <div className="border border-[#CFC6B6]">
                    <div className="h-10 bg-[#E0D5C2] border-b border-[#CFC6B6]"></div>
                    <div className="p-3 space-y-2.5">
                      <div className="h-4 w-full bg-[#DDD3BF]"></div>
                      <div className="h-4 w-5/6 bg-[#DDD3BF]"></div>
                      <div className="h-4 w-4/5 bg-[#DDD3BF]"></div>
                      <div className="h-4 w-full bg-[#DDD3BF]"></div>
                      <div className="h-4 w-3/4 bg-[#DDD3BF]"></div>
                    </div>
                  </div>
                </div>

                {/* Skeleton Section 2: Timeline */}
                <div className="space-y-3">
                  <div className="h-5 w-28 bg-[#D8CDBC]"></div>
                  <div className="space-y-3 border-t border-[#CFC6B6] pt-3">
                    <div className="h-4 w-full bg-[#DDD3BF]"></div>
                    <div className="h-4 w-5/6 bg-[#DDD3BF]"></div>
                    <div className="h-4 w-4/5 bg-[#DDD3BF]"></div>
                  </div>
                </div>

                {/* Skeleton Section 3: Checklist */}
                <div className="space-y-3">
                  <div className="h-5 w-36 bg-[#D8CDBC]"></div>
                  <div className="space-y-2 border-t border-[#CFC6B6] pt-3">
                    <div className="h-4 w-2/3 bg-[#DDD3BF]"></div>
                    <div className="h-4 w-3/4 bg-[#DDD3BF]"></div>
                    <div className="h-4 w-1/2 bg-[#DDD3BF]"></div>
                  </div>
                </div>

                {/* Skeleton Section 4: Ideas */}
                <div className="space-y-3">
                  <div className="h-5 w-24 bg-[#D8CDBC]"></div>
                  <div className="space-y-3 border-t border-[#CFC6B6] pt-3">
                    <div className="h-4 w-full bg-[#DDD3BF]"></div>
                    <div className="h-4 w-5/6 bg-[#DDD3BF]"></div>
                  </div>
                </div>
              </section>
            )}

            {/* RESULTS SECTION */}
            {!loading && plan && (
              <main
                id="results-section"
                tabIndex={-1}
                aria-label="Generated event plan document"
                className="mt-10 p-6 sm:p-8 bg-[#EBE2D0] border border-[#CFC6B6] space-y-12 focus:outline-none"
              >
                {/* Plan Document Header */}
                <div className="border-b border-[#CFC6B6] pb-5">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                    <h2 className="text-2xl sm:text-3xl text-[#231F1A]">
                      Plan for {plan.summary.eventType} in {plan.summary.city}
                    </h2>
                    <span className="text-sm text-[#9C3D2A] font-medium">
                      Total budget {formatRupees(plan.totalBudget)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-[#5F574C] space-x-2">
                    <span>{plan.summary.guestCount} guests</span>
                    <span>•</span>
                    <span>{plan.summary.eventDate ? `Date: ${plan.summary.eventDate}` : 'Date to be fixed'}</span>
                    <span>•</span>
                    <span className="italic">{plan.summary.style}</span>
                  </div>
                </div>

                {/* 1. BUDGET LEDGER */}
                <section className="space-y-4" aria-labelledby="budget-section-heading">
                  <div className="flex justify-between items-baseline border-b border-[#CFC6B6] pb-2">
                    <h3 id="budget-section-heading" className="text-xl text-[#231F1A]">
                      1. Budget
                    </h3>
                    <span className="text-xs text-[#5F574C]">
                      All amounts in Indian Rupees (INR)
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse" aria-label="Budget category breakdown table">
                      <caption className="sr-only">
                        Event budget ledger broken down by category, percentage share, and total rupee amount
                      </caption>
                      <thead>
                        <tr className="border-b border-[#CFC6B6] text-xs uppercase tracking-wider text-[#5F574C]">
                          <th scope="col" className="py-2.5 font-normal">Category</th>
                          <th scope="col" className="py-2.5 font-normal text-right">Share</th>
                          <th scope="col" className="py-2.5 font-normal text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.budgetLedger.map((item, index) => (
                          <tr
                            key={index}
                            className="border-b border-[#CFC6B6] text-base"
                          >
                            <td className="py-2.5 text-[#231F1A] capitalize">
                              {item.category}
                            </td>
                            <td className="py-2.5 text-[#5F574C] text-right font-mono text-sm">
                              <div className="flex items-center justify-end gap-3">
                                <div
                                  className="w-16 sm:w-24 bg-[#D8CDBC] h-[4px]"
                                  role="progressbar"
                                  aria-valuenow={item.share}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  aria-label={`${item.category} budget share ${item.share} percent`}
                                >
                                  <div
                                    className="bg-[#C98A1B] h-[4px]"
                                    style={{ width: `${item.share}%` }}
                                  />
                                </div>
                                <span className="w-9 text-right font-mono text-sm">{item.share}%</span>
                              </div>
                            </td>
                            <td className="py-2.5 text-[#231F1A] text-right font-mono">
                              {formatRupees(item.amount)}
                            </td>
                          </tr>
                        ))}
                        {/* Total Row */}
                        <tr className="border-t-2 border-[#231F1A] text-base font-semibold">
                          <th scope="row" className="py-3 text-[#231F1A] font-semibold text-left">
                            Total
                          </th>
                          <td className="py-3 text-right text-[#5F574C] font-mono text-sm">
                            <div className="flex items-center justify-end gap-3">
                              <div className="w-16 sm:w-24 bg-[#C98A1B] h-[4px]" aria-hidden="true" />
                              <span className="w-9 text-right font-mono text-sm">
                                {plan.budgetLedger.reduce((sum, item) => sum + item.share, 0)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-right text-[#231F1A] font-mono">
                            {formatRupees(plan.budgetLedger.reduce((sum, item) => sum + item.amount, 0))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 2. TIMELINE */}
                <section className="space-y-4 pt-4 border-t border-[#CFC6B6]" aria-labelledby="timeline-section-heading">
                  <div className="flex justify-between items-baseline border-b border-[#CFC6B6] pb-2">
                    <h3 id="timeline-section-heading" className="text-xl text-[#231F1A]">
                      2. Timeline
                    </h3>
                    <span className="text-xs text-[#5F574C]">
                      Chronological countdown
                    </span>
                  </div>

                  <div className="space-y-3 pt-2">
                    {plan.timeline.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2 border-b border-[#CFC6B6] last:border-b-0"
                      >
                        <div className="text-sm text-[#9C3D2A] font-medium sm:text-left">
                          {item.timeBefore}
                        </div>
                        <div className="sm:col-span-2 text-base text-[#231F1A] leading-relaxed">
                          {item.task}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. VENDOR CHECKLIST */}
                <section className="space-y-4 pt-4 border-t border-[#CFC6B6]" aria-labelledby="vendor-section-heading">
                  <div className="flex justify-between items-baseline border-b border-[#CFC6B6] pb-2">
                    <h3 id="vendor-section-heading" className="text-xl text-[#231F1A]">
                      3. Vendor checklist
                    </h3>
                    <span className="text-xs text-[#5F574C]">
                      Click or press space on any checkbox to mark complete
                    </span>
                  </div>

                  <div className="space-y-6 pt-2">
                    {plan.vendorChecklist.map((group, gIdx) => (
                      <div key={gIdx} className="space-y-2">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-[#5F574C]">
                          {group.vendorType}
                        </h4>
                        <div className="space-y-2 pl-1">
                          {group.items.map((task, tIdx) => {
                            const taskKey = `${gIdx}-${tIdx}`;
                            const inputId = `vendor-task-${gIdx}-${tIdx}`;
                            const isChecked = !!checkedChecklist[taskKey];
                            return (
                              <div
                                key={taskKey}
                                className="flex items-start gap-3 py-1"
                              >
                                <input
                                  type="checkbox"
                                  id={inputId}
                                  checked={isChecked}
                                  onChange={() => toggleChecklist(taskKey)}
                                  className="mt-1 cursor-pointer"
                                />
                                <label
                                  htmlFor={inputId}
                                  className={`cursor-pointer select-none text-base leading-relaxed ${
                                    isChecked
                                      ? 'line-through text-[#5F574C]'
                                      : 'text-[#231F1A]'
                                  }`}
                                >
                                  {task}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 4. IDEAS */}
                <section className="space-y-4 pt-4 border-t border-[#CFC6B6]" aria-labelledby="ideas-section-heading">
                  <div className="flex justify-between items-baseline border-b border-[#CFC6B6] pb-2">
                    <h3 id="ideas-section-heading" className="text-xl text-[#231F1A]">
                      4. Ideas
                    </h3>
                    <span className="text-xs text-[#5F574C]">
                      Tailored to {plan.summary.city} and your budget
                    </span>
                  </div>

                  <ol className="space-y-4 pt-2">
                    {plan.ideas.map((idea, index) => (
                      <li
                        key={index}
                        className="border-b border-[#CFC6B6] pb-3 last:border-b-0"
                      >
                        <div className="text-base text-[#231F1A] leading-relaxed">
                          <span className="text-[#8A5A05] font-semibold mr-1.5">
                            {index + 1}.
                          </span>
                          <span className="font-semibold mr-2">
                            {idea.title}.
                          </span>
                          <span>{idea.description}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>

                {/* Document Actions */}
                <div className="no-print pt-6 border-t border-[#CFC6B6] flex flex-wrap gap-4 items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-5 py-2.5 border border-[#231F1A] text-sm text-[#231F1A] hover:bg-[#DDD3BF] cursor-pointer"
                  >
                    Print or save plan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      const el = document.getElementById('guestCount');
                      if (el) el.focus();
                    }}
                    className="text-sm text-[#9C3D2A] underline hover:no-underline cursor-pointer"
                  >
                    Modify details above
                  </button>
                </div>
              </main>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="no-print mt-16 pt-6 border-t border-[#CFC6B6] flex flex-col sm:flex-row justify-between items-center text-xs text-[#5F574C] gap-4">
          <div>
            <span>Utsav Event Planning Document</span>
            <span className="mx-2">•</span>
            <span>Made with warm paper aesthetics</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setActiveView('privacy')}
              className="text-[#9C3D2A] underline hover:no-underline cursor-pointer"
            >
              Privacy
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveView('terms')}
              className="text-[#9C3D2A] underline hover:no-underline cursor-pointer"
            >
              Terms
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
