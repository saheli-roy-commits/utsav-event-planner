/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';
import { calculateRupeeBudgetLedger } from './src/budgetCalculator.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '1mb' }));

// Input sanitization helper to strip dangerous tags and prompt injection markers
function sanitizeText(input: unknown, maxLength = 300): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>{}|\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

// Clean text to enforce no em dashes or hype words
function cleanProse(text: string): string {
  return text
    .replace(/[—–]/g, ', ')
    .replace(/\s+,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

interface PlanRequest {
  eventType: 'wedding' | 'birthday' | 'community event' | string;
  guestCount: number;
  budget: number;
  city: string;
  eventDate: string;
  style: string;
}

// Export budget calculation function imported from dedicated module
export { calculateRupeeBudgetLedger };

// Fallback plan generator with realistic Indian context if Gemini API is unreachable or key not present
function generateFallbackPlan(req: PlanRequest) {
  const budget = Math.max(1000, Math.round(Number(req.budget) || 50000));
  const guests = Math.max(2, Math.round(Number(req.guestCount) || 30));
  const city = sanitizeText(req.city || 'Jaipur', 60);
  const eventType = sanitizeText(req.eventType || 'Birthday', 40);
  const style = sanitizeText(req.style || 'Intimate gathering with family and friends', 300);

  const defaultShares = [
    { category: 'Venue', share: 25 },
    { category: 'Food', share: 35 },
    { category: 'Decor', share: 15 },
    { category: 'Entertainment', share: 10 },
    { category: 'Photography', share: 10 },
    { category: 'Miscellaneous', share: 5 },
  ];

  const budgetLedger = calculateRupeeBudgetLedger(defaultShares, budget);

  const timeline = [
    {
      timeBefore: '8 weeks before',
      task: `Finalise the venue booking in ${city} and verify parking for ${guests} guests.`,
    },
    {
      timeBefore: '6 weeks before',
      task: 'Book the caterer and arrange a tasting session for the seasonal menu.',
    },
    {
      timeBefore: '4 weeks before',
      task: 'Confirm the florist, lighting setup, and sound permissions for the venue.',
    },
    {
      timeBefore: '2 weeks before',
      task: 'Send digital invitations and gather dietary preferences from attending guests.',
    },
    {
      timeBefore: '1 week before',
      task: 'Do a final walkthrough with the venue coordinator and review the playlist.',
    },
    {
      timeBefore: 'Day of event',
      task: 'Verify ice delivery, welcome signage, and sound check two hours prior to start.',
    },
  ];

  const vendorChecklist = [
    {
      vendorType: 'Venue & Facilities',
      items: [
        'Confirm venue access time and vendor loading gate.',
        'Arrange backup power generator or inverter support.',
        'Verify clean washroom amenities and hand towel supplies.',
      ],
    },
    {
      vendorType: 'Food & Beverage',
      items: [
        'Confirm service staff count and live food counter setup.',
        'Arrange mineral water dispensers and glassware.',
        'Plan packaging boxes for leftover food distribution.',
      ],
    },
    {
      vendorType: 'Decor & Staging',
      items: [
        'Source fresh local marigolds and jasmine from the morning mandi.',
        'Test warm hanging bulbs and power extension cords.',
        'Prepare simple chalkboard seating and welcome signage.',
      ],
    },
    {
      vendorType: 'Photography & Audio',
      items: [
        'Share shot list covering family portraits and candid moments.',
        'Check sound mixer compatibility with phone playlist.',
      ],
    },
  ];

  const foodAmount =
    budgetLedger.find((b) => b.category.toLowerCase().includes('food'))?.amount || Math.round(budget * 0.35);

  const ideas = [
    {
      title: 'Local seasonal menu',
      description: `Feature regional delicacies popular in ${city}, using local bakeries and caterers to keep costs within ₹${Math.round(foodAmount / guests)} per guest.`,
    },
    {
      title: 'Clay pots and fresh marigolds',
      description: 'Use terracotta kulhads for beverages and earthen handi centerpieces filled with fresh yellow flowers instead of cut imported blooms.',
    },
    {
      title: 'Acoustic background sound',
      description: 'Invite a local instrumentalist or play a curated acoustic instrumental playlist to preserve easy dinner conversation.',
    },
    {
      title: 'Printed recipe or spice token',
      description: 'Offer guests small paper envelopes containing family tea blends or whole spices from local spice merchants as a quiet keepsake.',
    },
    {
      title: 'Warm low lighting',
      description: 'Rely on battery tea-lights, brass oil lamps, and warm filament strings hung at eye level to create an intimate atmosphere.',
    },
  ];

  return {
    summary: {
      eventType,
      guestCount: guests,
      budget,
      city,
      eventDate: req.eventDate || '',
      style,
    },
    budgetLedger,
    totalBudget: budget,
    timeline,
    vendorChecklist,
    ideas,
  };
}

interface SafePlanInput {
  eventType: string;
  guestCount: number;
  budget: number;
  city: string;
  eventDate: string;
  style: string;
}

// Server-side validation for all form inputs
function validateAndSanitizePlanInput(
  body: any
): { valid: true; data: SafePlanInput } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request payload. Please submit a valid planning form.' };
  }

  // 1. Guest count validation
  if (body.guestCount === undefined || body.guestCount === null || body.guestCount === '') {
    return { valid: false, error: 'Please enter the number of guests.' };
  }
  const parsedGuests = Number(body.guestCount);
  if (!Number.isFinite(parsedGuests) || !Number.isInteger(parsedGuests) || parsedGuests < 2 || parsedGuests > 10000) {
    return { valid: false, error: 'Please enter a valid guest count between 2 and 10,000 attendees.' };
  }

  // 2. Budget validation
  if (body.budget === undefined || body.budget === null || body.budget === '') {
    return { valid: false, error: 'Please enter your event budget in INR.' };
  }
  const parsedBudget = Number(body.budget);
  if (!Number.isFinite(parsedBudget) || parsedBudget < 1000 || parsedBudget > 1000000000) {
    return { valid: false, error: 'Please enter a realistic event budget between ₹1,000 and ₹100,00,00,000.' };
  }

  // 3. Event Type validation
  if (typeof body.eventType !== 'string' || !body.eventType.trim()) {
    return { valid: false, error: 'Please select or enter an event type.' };
  }
  const rawEventType = body.eventType.trim();
  if (rawEventType.length < 2 || rawEventType.length > 50) {
    return { valid: false, error: 'Event type must be between 2 and 50 characters.' };
  }
  const sanitizedEventType = sanitizeText(rawEventType, 50);

  // 4. City validation
  if (typeof body.city !== 'string' || !body.city.trim()) {
    return { valid: false, error: 'Please enter a city or region for the celebration.' };
  }
  const rawCity = body.city.trim();
  if (rawCity.length < 2 || rawCity.length > 80) {
    return { valid: false, error: 'City name must be between 2 and 80 characters.' };
  }
  const sanitizedCity = sanitizeText(rawCity, 80);

  // 5. Event Date validation
  let sanitizedDate = '';
  if (body.eventDate !== undefined && body.eventDate !== null && body.eventDate !== '') {
    if (typeof body.eventDate !== 'string') {
      return { valid: false, error: 'Event date must be a valid date string.' };
    }
    const rawDate = body.eventDate.trim();
    if (rawDate.length > 30) {
      return { valid: false, error: 'Event date string is too long (maximum 30 characters).' };
    }
    const parsedTimestamp = Date.parse(rawDate);
    if (isNaN(parsedTimestamp)) {
      return { valid: false, error: 'Please provide a valid calendar date in YYYY-MM-DD format.' };
    }
    sanitizedDate = sanitizeText(rawDate, 30);
  }

  // 6. Style text validation and sensible length trimming
  let sanitizedStyle = 'Warm and intimate celebration';
  if (body.style !== undefined && body.style !== null) {
    if (typeof body.style !== 'string') {
      return { valid: false, error: 'Style description must be a text value.' };
    }
    if (body.style.length > 2000) {
      return { valid: false, error: 'Style description cannot exceed 2,000 characters.' };
    }
    const trimmedStyle = body.style.trim();
    if (trimmedStyle) {
      // Trim to sensible length: 300 characters
      sanitizedStyle = sanitizeText(trimmedStyle, 300);
    }
  }

  return {
    valid: true,
    data: {
      eventType: sanitizedEventType,
      guestCount: parsedGuests,
      budget: Math.round(parsedBudget),
      city: sanitizedCity,
      eventDate: sanitizedDate,
      style: sanitizedStyle,
    },
  };
}

// POST /api/plan - generates tailored event plan
app.post('/api/plan', async (req: Request, res: Response): Promise<void> => {
  // Step 1: Server-side validation of all form inputs
  const validation = validateAndSanitizePlanInput(req.body);
  if (!validation.valid) {
    res.status(400).json({ success: false, error: validation.error });
    return;
  }

  const safeReq = validation.data;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'your_gemini_api_key_here') {
    res.status(503).json({
      success: false,
      error: 'The Gemini API key is not configured on the server. Please add your GEMINI_API_KEY in the Secrets panel to generate custom plans.',
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are a quiet, thoughtful Indian event planner for "Utsav".
Plan a ${safeReq.eventType} for ${safeReq.guestCount} guests in ${safeReq.city}, India.
Total Budget: INR ${safeReq.budget} (₹${safeReq.budget.toLocaleString('en-IN')}).
Date: ${safeReq.eventDate || 'Upcoming date'}.
Style and preferences: ${safeReq.style}.

Writing rules:
- Plain, specific, warm sentences.
- Never use em dashes (do not use "—" or "--"). Use commas, parentheses, or periods instead.
- Do not use "it's not X, it's Y" phrasing.
- Do not use hype words like magical, enchanting, ultimate, seamless, delve, elevate, tapestry, breathtaking.
- Ground all advice in realistic Indian rupee amounts and authentic local city context for ${safeReq.city}.
- For the budget, return only percentage shares for each of these 6 categories: Venue, Food, Decor, Entertainment, Photography, Miscellaneous.
- Each share must be a whole number (integer) representing the percentage of the budget.
- The shares must add up to exactly 100. Do not return rupee amounts; only return percentage shares.
- Provide a timeline with 5 to 7 steps ordered from earliest to day of event. Time before must be clear, like "10 weeks before" or "2 days before".
- Provide vendor checklist grouped by 4 vendor types, each with 2 to 4 plain practical items.
- Provide exactly 5 ideas with a bold short title (3 to 6 words) and 1 to 2 specific sentences matching the budget and ${safeReq.city}.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        budgetShares: {
          type: Type.ARRAY,
          description:
            'Percentage shares for each category (Venue, Food, Decor, Entertainment, Photography, Miscellaneous). Whole numbers adding up to 100.',
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              share: { type: Type.INTEGER, description: 'Percentage share as a whole number' },
            },
            required: ['category', 'share'],
          },
        },
        timeline: {
          type: Type.ARRAY,
          description: 'Timeline milestones',
          items: {
            type: Type.OBJECT,
            properties: {
              timeBefore: { type: Type.STRING },
              task: { type: Type.STRING },
            },
            required: ['timeBefore', 'task'],
          },
        },
        vendorChecklist: {
          type: Type.ARRAY,
          description: 'Vendor checklist groups',
          items: {
            type: Type.OBJECT,
            properties: {
              vendorType: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['vendorType', 'items'],
          },
        },
        ideas: {
          type: Type.ARRAY,
          description: 'Five distinct ideas',
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ['title', 'description'],
          },
        },
      },
      required: ['budgetShares', 'timeline', 'vendorChecklist', 'ideas'],
    };

    // Try primary models: gemini-3.1-flash-lite, fallback to gemini-3.8-flash
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let responseText = '';
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            temperature: 0.7,
            responseMimeType: 'application/json',
            responseSchema,
          },
        });
        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} call attempt failed:`, err?.status || err?.message || err);
      }
    }

    if (!responseText) {
      console.error('All Gemini model candidates failed:', lastError);
      res.status(502).json({
        success: false,
        error:
          'We could not reach Gemini to generate your custom plan right now. The AI service is currently experiencing high demand. Please try again in a few moments.',
      });
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse Gemini response text as JSON');
      res.status(502).json({
        success: false,
        error:
          'We received an incomplete response from Gemini. Please submit the form again to generate your plan.',
      });
      return;
    }

    // Calculate budget ledger strictly in code according to requirements:
    // 1. If shares returned by Gemini do not add up to 100, adjust the largest share so they do.
    // 2. Rupee amount = total budget x share / 100, rounded to nearest rupee.
    // 3. If rounded amounts do not add up exactly to total budget, adjust the small difference on the largest category.
    const rawShares = Array.isArray(parsed.budgetShares)
      ? parsed.budgetShares
      : (Array.isArray(parsed.budgetLedger) ? parsed.budgetLedger : []);

    const budgetItems = calculateRupeeBudgetLedger(rawShares, safeReq.budget);

    // Clean text fields of em dashes and hype words
    const cleanedTimeline = (parsed.timeline || []).map((t: any) => ({
      timeBefore: cleanProse(String(t.timeBefore || '')),
      task: cleanProse(String(t.task || '')),
    }));

    const cleanedVendorChecklist = (parsed.vendorChecklist || []).map((group: any) => ({
      vendorType: cleanProse(String(group.vendorType || '')),
      items: (group.items || []).map((it: any) => cleanProse(String(it))),
    }));

    const cleanedIdeas = (parsed.ideas || []).slice(0, 5).map((idea: any) => ({
      title: cleanProse(String(idea.title || '')),
      description: cleanProse(String(idea.description || '')),
    }));

    const finalPlan = {
      summary: safeReq,
      budgetShares: budgetItems.map((item) => ({ category: item.category, share: item.share })),
      budgetLedger: budgetItems,
      totalBudget: safeReq.budget,
      timeline: cleanedTimeline,
      vendorChecklist: cleanedVendorChecklist,
      ideas: cleanedIdeas,
    };

    res.json({ success: true, plan: finalPlan });
  } catch (err: any) {
    console.error('Unexpected error generating plan with Gemini:', err);
    res.status(500).json({
      success: false,
      error:
        'An unexpected error occurred while communicating with Gemini. Please check your network and try again in a moment.',
    });
  }
});

// Start Express server and mount Vite middleware
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Utsav server running on port ${PORT}`);
  });
}

startServer();
