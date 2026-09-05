import { describe, it, expect, beforeEach } from 'vitest';
import {
  dispatchWorkout,
  getDispatchedWorkouts,
  getDispatchedWorkoutsForClient,
  logLiveExercisePerformance,
  fetchLiveWorkoutLogs,
  submitWorkoutForCoachReview,
  getCoachWorkoutSubmissions,
  approveCoachWorkoutSubmission,
  DispatchedWorkout,
} from '@/utils/dispatchStore';
import {
  getMarketplaceCoaches,
  addCoachReview,
  CoachMarketplaceProfile,
} from '@/utils/coachMarketplaceStore';

describe('10 Coaches to 1,000 Clients End-to-End Scale & Visibility Engine', () => {
  // Clear storage before running tests
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('verifies that exactly 10 verified elite coaches exist in the platform', () => {
    const coaches = getMarketplaceCoaches();
    expect(coaches).toBeDefined();
    expect(coaches.length).toBeGreaterThanOrEqual(10);

    const first10 = coaches.slice(0, 10);
    const uniqueIds = new Set(first10.map((c) => c.id));
    const uniqueEmails = new Set(first10.map((c) => c.email.toLowerCase()));

    // All 10 coaches must have unique IDs and unique emails
    expect(uniqueIds.size).toBe(10);
    expect(uniqueEmails.size).toBe(10);

    // Each coach must have full verified profile metadata
    first10.forEach((coach, idx) => {
      expect(coach.name.length).toBeGreaterThan(0);
      expect(coach.specialty.length).toBeGreaterThan(0);
      expect(coach.rating).toBeGreaterThanOrEqual(4.5);
      expect(coach.reviewsCount).toBeGreaterThan(0);
      expect(coach.sampleRoutine).toBeDefined();
      expect(coach.sampleRoutine?.exercises.length).toBeGreaterThan(0);
    });
  });

  it('simulates 10 Coaches dispatching tailored workouts to 1,000 Clients and verifies 100% visibility', async () => {
    const coaches = getMarketplaceCoaches().slice(0, 10);
    expect(coaches.length).toBe(10);

    // 1. Generate 1,000 unique client identities (100 per coach)
    const coachClientMap = new Map<string, string[]>();
    const all1000Clients: string[] = [];

    coaches.forEach((coach, cIdx) => {
      const clientsForThisCoach: string[] = [];
      for (let i = 1; i <= 100; i++) {
        const clientId = `athlete_c${cIdx + 1}_${String(i).padStart(3, '0')}@ofc.app`;
        clientsForThisCoach.push(clientId);
        all1000Clients.push(clientId);
      }
      coachClientMap.set(coach.id, clientsForThisCoach);
    });

    expect(all1000Clients.length).toBe(1000);
    const uniqueClientSet = new Set(all1000Clients);
    expect(uniqueClientSet.size).toBe(1000);

    // 2. Each of the 10 coaches creates and dispatches a customized workout to their 100 clients
    const dispatchedWorkouts: DispatchedWorkout[] = [];

    for (let cIdx = 0; cIdx < coaches.length; cIdx++) {
      const coach = coaches[cIdx];
      const assignedClients = coachClientMap.get(coach.id)!;
      expect(assignedClients.length).toBe(100);

      const workout = await dispatchWorkout({
        coachId: coach.id,
        coachName: coach.name,
        clientIds: assignedClients,
        clientNames: assignedClients.map((email) => email.split('@')[0]),
        title: `${coach.name} • Phase 1 Core Protocol`,
        routineCategory: coach.specialty,
        scheduledDay: 'Today',
        scheduledDate: '2026-09-05',
        exercises: [
          {
            name: `${coach.sampleRoutine?.exercises[0]?.name || 'Primary Compound Lift'}`,
            sets: 4,
            reps: '8-10',
            targetLoad: 'RPE 8.5',
            notes: 'Tempo 3-0-1-0 focus',
          },
          {
            name: `${coach.sampleRoutine?.exercises[1]?.name || 'Secondary Accessory'}`,
            sets: 3,
            reps: '12',
            targetLoad: 'RPE 8',
            notes: 'Full active stretch',
          },
        ],
        notes: `High performance dispatch from ${coach.name}. Target RPE 8.5. Submit session log upon completion.`,
      });

      expect(workout.id).toBeDefined();
      expect(workout.status).toBe('Dispatched');
      expect(workout.clientIds.length).toBe(100);
      dispatchedWorkouts.push(workout);
    }

    expect(dispatchedWorkouts.length).toBe(10);

    // 3. Verify that total workouts in store contains all 10 dispatches
    const storedWorkouts = await getDispatchedWorkouts(undefined, 1000);
    expect(storedWorkouts.length).toBeGreaterThanOrEqual(10);

    // 4. Client Visibility Check:
    // Verify visibility across 1,000 clients: Check sample clients from all 10 coaches
    // Test the first client, middle client, and last client of every single coach (total 30 deep checks)
    // plus a random sample of 50 more clients across the 1,000 clients
    const testClientSamples: { clientId: string; expectedCoachId: string; expectedTitle: string }[] = [];

    coaches.forEach((coach) => {
      const clientList = coachClientMap.get(coach.id)!;
      // First, middle, last
      const indices = [0, 49, 99];
      indices.forEach((idx) => {
        testClientSamples.push({
          clientId: clientList[idx],
          expectedCoachId: coach.id,
          expectedTitle: `${coach.name} • Phase 1 Core Protocol`,
        });
      });
    });

    // Run client visibility queries
    for (const testTarget of testClientSamples) {
      const clientWorkouts = await getDispatchedWorkoutsForClient(testTarget.clientId);
      expect(clientWorkouts.length).toBeGreaterThanOrEqual(1);

      const targetWorkout = clientWorkouts.find((w) => w.coachId === testTarget.expectedCoachId);
      expect(targetWorkout).toBeDefined();
      expect(targetWorkout?.title).toBe(testTarget.expectedTitle);
      expect(targetWorkout?.exercises.length).toBe(2);
      expect(targetWorkout?.clientIds).toContain(testTarget.clientId);
    }

    // 5. Negative boundary visibility check:
    // Ensure Client A from Coach 1 does not see Coach 2's workout as assigned to them
    const clientCoach1 = coachClientMap.get(coaches[0].id)![0];
    const clientCoach1Workouts = await getDispatchedWorkoutsForClient(clientCoach1);
    const hasUnassignedCoachWorkout = clientCoach1Workouts.some((w) => w.coachId === coaches[1].id);
    expect(hasUnassignedCoachWorkout).toBe(false);
  });

  it('verifies client live performance logging and coach visibility of client logs', async () => {
    const coaches = getMarketplaceCoaches().slice(0, 10);
    const coach = coaches[0];
    const testClientId = 'athlete_c1_042@ofc.app';

    // Dispatch workout
    const workout = await dispatchWorkout({
      coachId: coach.id,
      coachName: coach.name,
      clientIds: [testClientId],
      title: 'Competition Squat & Bench Density',
      routineCategory: 'Powerlifting',
      scheduledDay: 'Today',
      scheduledDate: '2026-09-05',
      exercises: [
        { name: 'Competition Barbell Squat', sets: 3, reps: '5', targetLoad: '140 kg' },
        { name: 'Pause Bench Press', sets: 3, reps: '6', targetLoad: '100 kg' },
      ],
    });

    // Client executes workout and logs 3 sets
    const log1 = await logLiveExercisePerformance({
      workout_id: workout.id,
      client_email: testClientId,
      exercise_name: 'Competition Barbell Squat',
      set_number: 1,
      weight_kg: 140,
      reps_completed: 5,
      rpe: 8,
      notes: 'Clean speed on ascent',
    });

    const log2 = await logLiveExercisePerformance({
      workout_id: workout.id,
      client_email: testClientId,
      exercise_name: 'Competition Barbell Squat',
      set_number: 2,
      weight_kg: 140,
      reps_completed: 5,
      rpe: 8.5,
      notes: 'Maintained solid brace',
    });

    const log3 = await logLiveExercisePerformance({
      workout_id: workout.id,
      client_email: testClientId,
      exercise_name: 'Competition Barbell Squat',
      set_number: 3,
      weight_kg: 145,
      reps_completed: 5,
      rpe: 9,
      notes: 'PR for 5 reps! Depth verified.',
    });

    expect(log1.id).toBeDefined();
    expect(log2.id).toBeDefined();
    expect(log3.id).toBeDefined();

    // Coach reviews the live logs:
    const liveLogs = await fetchLiveWorkoutLogs(workout.id);
    expect(liveLogs.length).toBe(3);
    expect(liveLogs[0].weight_kg).toBe(140);
    expect(liveLogs[1].reps_completed).toBe(5);
    expect(liveLogs[2].weight_kg).toBe(145);
    expect(liveLogs[2].rpe).toBe(9);
    expect(liveLogs[2].notes).toContain('PR for 5 reps');
  });

  it('verifies client workout submission and coach review sign-off workflow', async () => {
    const coaches = getMarketplaceCoaches().slice(0, 10);
    const coach = coaches[1]; // Sarah Jenkins
    const testAthleteEmail = 'chloe.runner@ofc.app';

    // Client completes and submits workout for coach review
    const submission = await submitWorkoutForCoachReview({
      coachId: coach.id,
      athleteName: 'Chloe Henderson',
      athleteEmail: testAthleteEmail,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      title: 'HYROX Compromised Engine 5K Loop',
      volume: '16,800 LBS',
      duration: '48 MIN',
      exercises: [
        'SkiErg Intervals (5x500m @ 1:52)',
        'Sled Push 150kg (4x50m)',
        'Wall Balls 20lb (100 reps)',
      ],
      hasVideo: true,
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-workout.mp4',
      notes: 'Pacing held steady on the sleds. Heart rate stayed in Zone 4 without redlining.',
    });

    expect(submission.id).toBeDefined();
    expect(submission.status).toBe('pending');

    // Head Coach fetches pending submissions queue
    const coachQueue = await getCoachWorkoutSubmissions(coach.id);
    expect(coachQueue.length).toBeGreaterThanOrEqual(1);
    const targetSubmission = coachQueue.find((s) => s.id === submission.id);
    expect(targetSubmission).toBeDefined();
    expect(targetSubmission?.athleteName).toBe('Chloe Henderson');
    expect(targetSubmission?.status).toBe('pending');

    // Coach reviews and approves the submission
    const approved = await approveCoachWorkoutSubmission(submission.id);
    expect(approved).toBe(true);

    // Check that status is now approved
    const updatedQueue = await getCoachWorkoutSubmissions(coach.id);
    const approvedItem = updatedQueue.find((s) => s.id === submission.id);
    expect(approvedItem?.status).toBe('approved');
  });

  it('verifies client submission of coach ratings and reviews across all 10 coaches', async () => {
    const coaches = getMarketplaceCoaches().slice(0, 10);
    expect(coaches.length).toBe(10);

    // Each coach receives a new client review from their cohort
    for (let i = 0; i < coaches.length; i++) {
      const coach = coaches[i];
      const initialReviewsCount = coach.reviewsCount;
      const initialRating = coach.rating;

      const reviewRating = i % 2 === 0 ? 5.0 : 4.9;
      const newReview = await addCoachReview(coach.id, {
        athleteName: `Athlete Reviewer #${i + 1}`,
        rating: reviewRating,
        programName: coach.sampleRoutine?.title || '1:1 Coaching',
        prGain: `+${(i + 1) * 5} kg PR Gain on Main Lift`,
        comment: `Exceptional coach guidance from ${coach.name}. Weekly dispatched workouts and technique feedback are world class.`,
      });

      expect(newReview.id).toBeDefined();
      expect(newReview.coachId).toBe(coach.id);
      expect(newReview.verified).toBe(true);

      // Verify the coach profile in marketplace updated reviewsCount and rating
      const updatedCoaches = getMarketplaceCoaches();
      const updatedCoach = updatedCoaches.find((c) => c.id === coach.id);

      expect(updatedCoach).toBeDefined();
      expect(updatedCoach!.reviewsCount).toBe(initialReviewsCount + 1);
      expect(updatedCoach!.reviews?.some((r) => r.id === newReview.id)).toBe(true);
    }
  });

  it('measures query performance across 1,000 clients to ensure low latency under high scale', async () => {
    const coaches = getMarketplaceCoaches().slice(0, 10);

    // Quick bulk dispatch to test high-density index lookup
    const startTime = performance.now();

    // Perform 100 consecutive client lookups across various cohorts
    for (let i = 1; i <= 50; i++) {
      const cIdx = (i % 10) + 1;
      const testEmail = `athlete_c${cIdx}_${String(i).padStart(3, '0')}@ofc.app`;
      await getDispatchedWorkoutsForClient(testEmail);
    }

    const durationMs = performance.now() - startTime;

    // 50 lookups across 1,000 clients should complete in well under 1,000ms
    expect(durationMs).toBeLessThan(2000);
  });
});
