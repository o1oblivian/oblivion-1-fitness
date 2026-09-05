import { describe, it, expect } from 'vitest';
import {
  GLOBAL_CITY_HUBS,
  generateScaleAthleteDataset,
  generateSixMonthsActivityHistory,
  runScaleMatchingAndBookingSimulation,
  executeFullScaleTest,
} from '../utils/buddyScaleEngine';

describe('Buddy Radar 1,000+ Athletes, Global Booking & 6-Month History Engine', () => {
  it('covers 10 major global cities worldwide with authentic gym coordinates and addresses', () => {
    expect(GLOBAL_CITY_HUBS.length).toBeGreaterThanOrEqual(10);
    const cityNames = GLOBAL_CITY_HUBS.map(c => c.name);
    expect(cityNames).toContain('New York City');
    expect(cityNames).toContain('London');
    expect(cityNames).toContain('Tokyo');
    expect(cityNames).toContain('Los Angeles');
    expect(cityNames).toContain('Sydney');
    expect(cityNames).toContain('Dubai');
    expect(cityNames).toContain('Paris');
    expect(cityNames).toContain('Singapore');
    expect(cityNames).toContain('Berlin');
    expect(cityNames).toContain('Toronto');

    GLOBAL_CITY_HUBS.forEach(city => {
      expect(city.lat).toBeTypeOf('number');
      expect(city.lng).toBeTypeOf('number');
      expect(city.gyms.length).toBeGreaterThanOrEqual(5);

      city.gyms.forEach(gym => {
        expect(gym.name.length).toBeGreaterThan(3);
        expect(gym.address.length).toBeGreaterThan(5);
        expect(gym.category.length).toBeGreaterThan(3);
        expect(gym.lat).toBeTypeOf('number');
        expect(gym.lng).toBeTypeOf('number');
      });
    });
  });

  it('generates 1,200+ realistic athletes across all global hubs with authentic telemetry & profiles', () => {
    const athletes = generateScaleAthleteDataset(1200);
    expect(athletes.length).toBeGreaterThanOrEqual(1200);

    // Verify profile structure and diversity
    const disciplines = new Set(athletes.map(a => a.discipline));
    expect(disciplines.size).toBeGreaterThanOrEqual(8);

    const levels = new Set(athletes.map(a => a.experience_level));
    expect(levels.has('Beginner')).toBe(true);
    expect(levels.has('Intermediate')).toBe(true);
    expect(levels.has('Advanced')).toBe(true);
    expect(levels.has('Elite')).toBe(true);

    // Verify all 10 cities are populated
    const citiesRepresented = new Set(athletes.map(a => a.cityName));
    expect(citiesRepresented.size).toBe(10);

    // Verify GPS coordinates are valid and bounded near city hubs
    athletes.forEach(a => {
      expect(a.latitude).toBeGreaterThan(-90);
      expect(a.latitude).toBeLessThan(90);
      expect(a.longitude).toBeGreaterThan(-180);
      expect(a.longitude).toBeLessThan(180);
      expect(a.user_email).toContain('@');
      expect(a.photos.length).toBeGreaterThan(0);
      expect(a.stats.totalWorkouts6Mo).toBeGreaterThan(0);
    });
  });

  it('generates authentic 6-month activity history spanning up to 180 days with joint buddy meetups', () => {
    const sydney = GLOBAL_CITY_HUBS.find(c => c.name === 'Sydney')!;
    const history = generateSixMonthsActivityHistory('Marcus Vance', 'marcus.vance@ofc.test', sydney, 'Sophia Sterling');

    expect(history.length).toBeGreaterThanOrEqual(40); // 3-5 times a week over 26 weeks
    const now = Date.now();
    const sixMonthsAgo = now - 190 * 86400000;

    // Verify chronological spread
    const dates = history.map(h => h.timestamp);
    const minTimestamp = Math.min(...dates);
    const maxTimestamp = Math.max(...dates);

    expect(minTimestamp).toBeLessThanOrEqual(now - 140 * 86400000); // At least 5-6 months back
    expect(maxTimestamp).toBeGreaterThanOrEqual(now - 7 * 86400000); // Up to recent days

    // Verify activity details
    const buddyMeetups = history.filter(h => h.type === 'buddy_meetup');
    expect(buddyMeetups.length).toBeGreaterThan(0);

    buddyMeetups.forEach(m => {
      expect(m.title).toContain('Joint Tandem');
      expect(m.location.length).toBeGreaterThan(3);
      expect(m.address.length).toBeGreaterThan(5);
      expect(m.exercises.length).toBeGreaterThan(0);
      expect(m.durationMinutes).toBeGreaterThanOrEqual(40);
      expect(m.caloriesBurned).toBeGreaterThan(200);
      if (m.outcome === 'completed') {
        expect(m.verifiedRealMeetup).toBe(true);
        expect(m.meetingCoordinates).toBeDefined();
        expect(m.meetingCoordinates?.lat).toBeTypeOf('number');
      }
    });
  });

  it('runs scale matching simulation across 1,000+ athletes with high efficiency and accuracy', () => {
    const athletes = generateScaleAthleteDataset(1200);
    const { report, topMatchedPairs } = runScaleMatchingAndBookingSimulation(athletes);

    expect(report.totalAthletesGenerated).toBeGreaterThanOrEqual(1200);
    expect(report.matchesEvaluated).toBeGreaterThan(1000);
    expect(report.highSynergyMatches).toBeGreaterThan(0);
    expect(report.citiesRepresented).toBe(10);
    expect(report.historyTimeSpanDays).toBe(180);
    expect(report.durationMs).toBeLessThan(10000); // Must be fast (< 10 seconds for thousands)

    expect(topMatchedPairs.length).toBeGreaterThan(0);
    topMatchedPairs.forEach(pair => {
      expect(pair.matchScore).toBeGreaterThanOrEqual(75);
      expect(pair.athleteA.user_email).not.toBe(pair.athleteB.user_email);
      expect(pair.distanceKm).toBeGreaterThanOrEqual(0);
    });
  });

  it('simulates gym date booking with fair-split commute parity and in-person meeting verification', () => {
    const { sampleBookings, report } = executeFullScaleTest();

    expect(sampleBookings.length).toBeGreaterThan(0);
    expect(report.bookingInvitationsSent).toBe(sampleBookings.length);
    expect(report.acceptedBookings).toBeGreaterThan(0);
    expect(report.successRatePercent).toBeGreaterThanOrEqual(70);

    sampleBookings.forEach(booking => {
      expect(booking.gymName.length).toBeGreaterThan(3);
      expect(booking.gymAddress.length).toBeGreaterThan(5);
      expect(booking.scheduledDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(booking.timeSlot.length).toBeGreaterThan(3);
      expect(booking.coordinates.lat).toBeTypeOf('number');
      expect(booking.coordinates.lng).toBeTypeOf('number');

      // Fair split verification
      expect(booking.isMidpoint).toBe(true);
      expect(booking.travelSplit.parityPercent).toBeGreaterThanOrEqual(80);
      expect(booking.travelSplit.userDistKm).toBeGreaterThan(0);
      expect(booking.travelSplit.buddyDistKm).toBeGreaterThan(0);

      // Outcome status validation
      expect(['pending', 'accepted', 'completed', 'declined']).toContain(booking.status);
      if (booking.status === 'completed') {
        expect(booking.completedFeedback?.verifiedInPerson).toBe(true);
        expect(booking.completedFeedback?.partnerRating).toBeGreaterThanOrEqual(4.5);
      }
    });
  });
});
