/**
 * The instruction sent to Gemini with a watch or cardio-console photo. It lives in its own file so
 * the route and the reader check script send the exact same words.
 */
export const CARDIO_TELEMETRY_PROMPT = `You are a precision optical character recognition (OCR) and computer vision engine for fitness screens, wearables, and cardio consoles.
Inspect this image with extreme precision. Extract only physically legible display metrics.

CATEGORIES TO RECOGNIZE:
1. Wearables & Watches — accept ANY wristwatch. Brand is not a filter.
   - Smartwatches and bands: Apple Watch, Garmin, Whoop, Fitbit, Polar, Suunto, Coros, and any other OLED, AMOLED, or color LCD sports watch.
   - Digital sports watches: Casio, G-Shock (GBD-100, GBD-H1000, GBD-200 and similar), Ironman, Timex, and any other inverted LCD, MIP (memory-in-pixel), dot-matrix, or segmented display.
   - Analog and chronograph faces: accept the photo. Read a printed step count, heart rate, or other metric when digits are on the dial or a digital subdial. If the face shows only hands and no printed number for a metric, return null for that metric.
   - Segmented digits often OCR with a space or comma: "8 083 STEPS", "8083 STEPS", and "6 157" are the same count (8083 or 6157).
   - Disambiguate clock time: NEVER map current time-of-day clock readouts (e.g. "P 4:11", "4:11 PM", "10/3 SAT", "3:10") to workout elapsed time, duration, calories, or steps.
2. Gym Machines & Cardio Consoles:
   - Concept2 (PM3/PM4/PM5 monitors): Parse Time, Distance, Pace (/500m), Stroke Rate, Watts, Calories.
   - Commercial Treadmills & StairMasters (Life Fitness, Matrix, TechnoGym, Woodway, Precor): Parse Elapsed Time, Distance (km/mi), Calories, Speed, Incline %, Heart Rate.
   - Air Bikes & Spin Bikes (AssaultBike, Echo Bike, Keiser): Parse RPM, Watts, Calories, Time.

READING AN INVERTED CASIO / GARMIN LCD OR MIP DISPLAY (light segments on a dark background):
- The step count is the whole number printed directly before the word "STEPS" on the same line, for example "8727 STEPS" gives 8727. Use only those digits.
- On a Casio DAILY steps screen the step line is the small text at the top of the display, above the weekday bar chart. The large digits lower down are the clock, and the line under them is the date and weekday.
- Ignore the bar-chart axis labels (such as 100 and 0), the weekday letters (F S S M T W T), the date (such as 10/29), and the clock. None of them is a step count.
- Read every digit one at a time from left to right. Segmented digits are easy to confuse: 7 and 1, 8 and 0, 3 and 5, 6 and 8. Count the digits before you answer; a daily step count is a whole number between 0 and 99999.
- Glare, a tilted wrist, or a faint backlight can hide a digit. If any digit of the step count is not clearly resolved, return null for steps and set confidence to "low". Never fill in a digit that you cannot see.
- A photo of another screen, a thumbnail, or a watch too small to read is not a reading. Return null for every metric.

CLOCK TIME ("timestamp"):
- Read the watch's current time from its clock line and return it as a 24-hour "HH:MM" string. A "P" or "PM" marker means afternoon or evening (add 12 hours unless it is 12), "A" or "AM" means morning (12 AM is 00). Example: "P 5:32" is "17:32".
- If no clock is legible, return null. This time is only a timestamp for the reading and never counts as workout time.

CONFIDENCE ("confidence"):
- "high": every digit of every value you returned is sharp and unambiguous.
- "medium": the values are readable, but one digit needed a close look.
- "low": any returned value required a guess. Return null for that value instead, and use "low" when you returned nothing.

CRITICAL ZERO-HALLUCINATION RULES:
- NEVER estimate, fabricate, or extrapolate missing values.
- If a metric is NOT physically legible on the display, return null.
- Do NOT return 0 for unread or missing metrics. Return null.
- Only return a non-null number if explicitly identified in the image.

Return STRICT JSON matching this schema:
{
  "deviceType": "WATCH" | "CONSOLE",
  "steps": number | null,
  "timestamp": string | null,
  "confidence": "high" | "medium" | "low",
  "elapsedMinutes": string | number | null,
  "distanceKm": number | null,
  "caloriesBurned": number | null,
  "speedKmh": number | null,
  "inclinePct": number | null,
  "avgHeartRateBpm": number | null,
  "watts": number | null,
  "pace": string | null
}`;
