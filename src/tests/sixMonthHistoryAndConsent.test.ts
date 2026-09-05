import { describe, it, expect, beforeEach } from 'vitest';
import { seedSixMonthAthleteHistory } from '@/utils/seedHistoryEngine';
import { loadCompletedSessions, CompletedSession } from '@/utils/sessionVaultStore';
import { loadDailySteps, DailyStepEntry } from '@/utils/stepsStore';
import { fetchDailyMacros } from '@/utils/telemetryStore';
import type { DailyMacroLog } from '@/types';
import { loadSleepLogs, SleepLogEntry } from '@/utils/sleepStore';
import {
  createShareConsentRequest,
  getPendingConsentRequestsForClient,
  respondToConsentRequest,
  getConsentRequestStatus,
  generate3DigitConsentCode,
  ShareConsentRequest,
} from '@/utils/shareConsentStore';

describe('6-Month Athlete History Logging & Coach Consent Sharing System', () => {
  const TEST_ATHLETE_EMAIL = 'alex.morgan@o1fc.app';
  const TEST_ATHLETE_NAME = 'Alex Morgan';
  const TEST_COACH_EMAIL = 'marcus.vance.fit@ofc.app';

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('generates and persists 6 full months (180 days) of comprehensive workout, steps, macros, and sleep logs', async () => {
    const summary = await seedSixMonthAthleteHistory(TEST_ATHLETE_EMAIL, TEST_ATHLETE_NAME);

    expect(summary).toBeDefined();
    expect(summary.daysGenerated).toBe(180);
    expect(summary.athleteEmail).toBe(TEST_ATHLETE_EMAIL);
    expect(summary.totalWorkouts).toBeGreaterThanOrEqual(120); // 4-5 workouts/week * ~26 weeks
    expect(summary.totalVolumeKg).toBeGreaterThan(400000); // Significant tonnage (~430 MT)
    expect(summary.totalSteps).toBeGreaterThan(1500000); // 180 days * ~10k steps
    expect(summary.avgDailySteps).toBeGreaterThanOrEqual(8000);
    expect(summary.avgDailyCalories).toBeGreaterThanOrEqual(2400);
    expect(summary.avgSleepHours).toBeGreaterThanOrEqual(7.0);
  });

  it('verifies full visibility and retrieval of 6 months of workout logs on athlete page', async () => {
    await seedSixMonthAthleteHistory(TEST_ATHLETE_EMAIL, TEST_ATHLETE_NAME);

    // Retrieve all completed sessions with extended limit (500)
    const sessions = await loadCompletedSessions(TEST_ATHLETE_EMAIL, 500);

    expect(sessions).toBeDefined();
    expect(sessions.length).toBeGreaterThanOrEqual(120);

    // 1. Verify chronological order: newest sessions first
    for (let i = 0; i < sessions.length - 1; i++) {
      const current = new Date(sessions[i].completed_at).getTime();
      const next = new Date(sessions[i + 1].completed_at).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }

    // 2. Verify exercise details and set metadata are preserved
    const sampleSession = sessions[0];
    expect(sampleSession.title).toBeDefined();
    expect(sampleSession.total_volume_kg).toBeGreaterThan(0);
    expect(sampleSession.total_sets).toBeGreaterThan(0);
    expect(sampleSession.exercises.length).toBeGreaterThan(0);
    expect(sampleSession.exercises[0].sets.length).toBeGreaterThan(0);
    expect(sampleSession.exercises[0].sets[0].weight).toBeGreaterThan(0);
    expect(sampleSession.exercises[0].sets[0].reps).toBeGreaterThan(0);
  });

  it('verifies full visibility and retrieval of 6 months of daily steps and distance tracking', async () => {
    await seedSixMonthAthleteHistory(TEST_ATHLETE_EMAIL, TEST_ATHLETE_NAME);

    const stepsLogs = await loadDailySteps(TEST_ATHLETE_EMAIL, 365);
    expect(stepsLogs).toBeDefined();
    expect(stepsLogs.length).toBe(180);

    // Every single day in the 180-day span must have valid step telemetry
    stepsLogs.forEach(entry => {
      expect(entry.steps).toBeGreaterThanOrEqual(8000);
      expect(entry.goal).toBeGreaterThanOrEqual(10000);
      const computedDistanceKm = Math.round(entry.steps * 0.00078 * 100) / 100;
      const computedCaloriesBurned = Math.round(entry.steps * 0.042);
      expect(computedDistanceKm).toBeGreaterThan(6.0);
      expect(computedCaloriesBurned).toBeGreaterThan(300);
      expect(entry.log_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('verifies full visibility and retrieval of 6 months of calories and nutrition macros', async () => {
    await seedSixMonthAthleteHistory(TEST_ATHLETE_EMAIL, TEST_ATHLETE_NAME);

    const macroLogs = await fetchDailyMacros(TEST_ATHLETE_EMAIL, 365);
    expect(macroLogs).toBeDefined();
    expect(macroLogs.length).toBe(180);

    // Verify macro distribution
    macroLogs.forEach(entry => {
      expect(entry.calories).toBeGreaterThanOrEqual(2400);
      expect(entry.protein).toBeGreaterThanOrEqual(180);
      expect(entry.carbs).toBeGreaterThanOrEqual(250);
      expect(entry.fat).toBeGreaterThanOrEqual(60);
      expect(entry.hydration).toBeGreaterThanOrEqual(3.0);
    });
  });

  it('verifies full visibility and retrieval of 6 months of sleep cycles and quality logs', async () => {
    await seedSixMonthAthleteHistory(TEST_ATHLETE_EMAIL, TEST_ATHLETE_NAME);

    const sleepLogs = await loadSleepLogs(TEST_ATHLETE_EMAIL, 365);
    expect(sleepLogs).toBeDefined();
    expect(sleepLogs.length).toBe(180);

    sleepLogs.forEach(entry => {
      expect(entry.duration_minutes).toBeGreaterThanOrEqual(420); // At least 7 hrs
      expect(entry.quality).toBeGreaterThanOrEqual(3);
      expect(entry.bedtime).toBe('23:15');
      expect(entry.wake_time).toBe('07:15');
    });
  });

  it('allows a coach to view client historical telemetry, session vault, and metrics', async () => {
    await seedSixMonthAthleteHistory(TEST_ATHLETE_EMAIL, TEST_ATHLETE_NAME);

    // Coach inspects client logs
    const clientSessions = await loadCompletedSessions(TEST_ATHLETE_EMAIL, 500);
    const clientSteps = await loadDailySteps(TEST_ATHLETE_EMAIL, 365);
    const clientMacros = await fetchDailyMacros(TEST_ATHLETE_EMAIL, 365);

    expect(clientSessions.length).toBeGreaterThanOrEqual(120);
    expect(clientSteps.length).toBe(180);
    expect(clientMacros.length).toBe(180);

    // Calculate coach telemetry roll-up
    const totalTonnage = clientSessions.reduce((sum, s) => sum + s.total_volume_kg, 0);
    const avgSteps = Math.round(clientSteps.reduce((sum, s) => sum + s.steps, 0) / clientSteps.length);
    const avgProtein = Math.round(clientMacros.reduce((sum, m) => sum + m.protein, 0) / clientMacros.length);

    expect(totalTonnage).toBeGreaterThan(400000);
    expect(avgSteps).toBeGreaterThanOrEqual(8000);
    expect(avgProtein).toBeGreaterThanOrEqual(180);
  });

  describe('Coach-Client Consent Code Verification & Social Sharing Workflow', () => {
    it('generates a valid 3-digit consent code for coach request', () => {
      const code = generate3DigitConsentCode();
      expect(code).toMatch(/^\d{3}$/);
      const num = Number(code);
      expect(num).toBeGreaterThanOrEqual(100);
      expect(num).toBeLessThanOrEqual(999);
    });

    it('enforces privacy invariant: Coach cannot share until client approves with exact 3-digit consent code', async () => {
      // 1. Coach requests consent to share client progress & transformation
      const request = await createShareConsentRequest({
        coachEmail: TEST_COACH_EMAIL,
        clientEmail: TEST_ATHLETE_EMAIL,
        clientName: TEST_ATHLETE_NAME,
        shareType: 'progress, transformation, volume',
        shareDescription: 'Coach Marcus requesting consent to highlight 6-month body transformation on Instagram',
      });

      expect(request.id).toBeDefined();
      expect(request.status).toBe('pending');
      expect(request.otp_code).toMatch(/^\d{3}$/);

      // Coach checks status - must still be pending
      const checkBefore = await getConsentRequestStatus(request.id);
      expect(checkBefore.status).toBe('pending');

      // 2. Client views pending requests in ClientConsentBanner
      const pendingRequests = await getPendingConsentRequestsForClient(TEST_ATHLETE_EMAIL);
      expect(pendingRequests.length).toBeGreaterThanOrEqual(1);
      const clientViewRequest = pendingRequests.find(r => r.id === request.id);
      expect(clientViewRequest).toBeDefined();
      expect(clientViewRequest?.coach_email).toBe(TEST_COACH_EMAIL);
      expect(clientViewRequest?.share_type).toContain('transformation');

      // 3. Negative Security Test: Client enters INCORRECT 3-digit code
      const wrongCodeAttempt = await respondToConsentRequest(request.id, '000', 'approve');
      expect(wrongCodeAttempt.success).toBe(false);
      expect(wrongCodeAttempt.error).toContain('Incorrect 3-digit consent code');

      // Status must remain pending
      const checkAfterWrong = await getConsentRequestStatus(request.id);
      expect(checkAfterWrong.status).toBe('pending');

      // 4. Positive Security Test: Client enters CORRECT 3-digit code
      const correctCodeAttempt = await respondToConsentRequest(request.id, request.otp_code, 'approve');
      expect(correctCodeAttempt.success).toBe(true);
      expect(correctCodeAttempt.status).toBe('approved');

      // 5. Coach verifies status: Approved! Unlocks social media share triggers
      const checkAfterApproval = await getConsentRequestStatus(request.id);
      expect(checkAfterApproval.status).toBe('approved');
      expect(checkAfterApproval.request?.responded_at).toBeDefined();

      // Pending list for client should no longer contain this request
      const pendingAfter = await getPendingConsentRequestsForClient(TEST_ATHLETE_EMAIL);
      expect(pendingAfter.find(r => r.id === request.id)).toBeUndefined();
    });

    it('correctly records client denial and locks social media sharing', async () => {
      // Coach sends request
      const request = await createShareConsentRequest({
        coachEmail: TEST_COACH_EMAIL,
        clientEmail: TEST_ATHLETE_EMAIL,
        clientName: TEST_ATHLETE_NAME,
        shareType: 'private_metrics',
      });

      expect(request.status).toBe('pending');

      // Client explicitly denies
      const denyResponse = await respondToConsentRequest(request.id, '', 'deny');
      expect(denyResponse.success).toBe(true);
      expect(denyResponse.status).toBe('denied');

      // Coach checks status
      const checkStatus = await getConsentRequestStatus(request.id);
      expect(checkStatus.status).toBe('denied');

      // Client pending queue no longer shows this request
      const pendingAfter = await getPendingConsentRequestsForClient(TEST_ATHLETE_EMAIL);
      expect(pendingAfter.find(r => r.id === request.id)).toBeUndefined();
    });
  });
});
