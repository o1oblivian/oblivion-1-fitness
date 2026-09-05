import { describe, it, expect, beforeEach } from 'vitest';
import {
  isToday,
  formatCardioDate,
  getCardioLogs,
  getTodayCardioTotals,
  saveCardioLog,
  deleteCardioLog,
} from '@/utils/cardioStorage';
import { fetchHealthTelemetry } from '@/utils/healthTelemetryStore';

describe('Cardio Telemetry & Health Storage Engines', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Cardio Date & Boundary Utilities', () => {
    it('accurately identifies today with numeric timestamp', () => {
      const now = Date.now();
      expect(isToday(now)).toBe(true);

      const yesterday = now - 24 * 60 * 60 * 1000 - 1000;
      expect(isToday(yesterday)).toBe(false);
    });

    it('accurately identifies today with ISO calendar string', () => {
      const todayISO = new Date().toISOString().slice(0, 10);
      expect(isToday(undefined, todayISO)).toBe(true);
      expect(isToday(undefined, '2020-01-01')).toBe(false);
    });

    it('formats cardio dates into human-readable strings', () => {
      const now = Date.now();
      expect(formatCardioDate(now)).toBe('Today');

      const yesterday = now - 24 * 60 * 60 * 1000;
      expect(formatCardioDate(yesterday)).toBe('Yesterday');
    });
  });

  describe('Cardio Storage & Step Auto-Conversion', () => {
    it('saves a cardio log and auto-calculates calories, distance, and duration from steps if omitted', () => {
      const entry = saveCardioLog({
        date: '2026-09-01',
        source: 'manual_dial',
        machineType: 'treadmill',
        stepsCount: 5000,
        caloriesBurned: 0,
        distanceKm: 0,
        durationMinutes: 0,
        notes: 'Incline walk',
      });

      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeGreaterThan(0);
      // 5000 steps * 0.045 = 225 kcal
      expect(entry.caloriesBurned).toBe(225);
      // 5000 steps * 0.000762 km = 3.81 km
      expect(entry.distanceKm).toBe(3.81);
      // 5000 steps / 100 = 50 mins
      expect(entry.durationMinutes).toBe(50);
    });

    it('retains manually supplied metrics without overriding with step estimates', () => {
      const entry = saveCardioLog({
        date: '2026-09-01',
        source: 'manual_dial',
        machineType: 'rower',
        stepsCount: 0,
        caloriesBurned: 450,
        distanceKm: 7.5,
        durationMinutes: 32,
      });

      expect(entry.caloriesBurned).toBe(450);
      expect(entry.distanceKm).toBe(7.5);
      expect(entry.durationMinutes).toBe(32);
    });

    it('filters out legacy mock data IDs (c-1, c-2, c-3) automatically', () => {
      const mockLegacy = [
        { id: 'c-1', machineType: 'other', stepsCount: 1000 },
        { id: 'c-2', machineType: 'other', stepsCount: 2000 },
        { id: 'genuine-99', machineType: 'treadmill', stepsCount: 3000 },
      ];
      localStorage.setItem('ofc_cardio_machine_logs_v1', JSON.stringify(mockLegacy));

      const logs = getCardioLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].id).toBe('genuine-99');
    });

    it('aggregates today totals accurately', () => {
      const todayStr = new Date().toISOString().split('T')[0];
      saveCardioLog({
        date: todayStr,
        source: 'manual_dial',
        machineType: 'treadmill',
        stepsCount: 3000,
        caloriesBurned: 150,
        distanceKm: 2.3,
        durationMinutes: 25,
      });

      saveCardioLog({
        date: todayStr,
        source: 'manual_dial',
        machineType: 'stairmaster',
        stepsCount: 2000,
        caloriesBurned: 120,
        distanceKm: 1.5,
        durationMinutes: 15,
      });

      const totals = getTodayCardioTotals();
      expect(totals.totalSteps).toBe(5000);
      expect(totals.totalCalories).toBe(270);
      expect(totals.totalDistance).toBe(3.8);
      expect(totals.totalDuration).toBe(40);
    });

    it('deletes a cardio log smoothly', () => {
      const entry = saveCardioLog({
        date: '2026-09-01',
        source: 'manual_dial',
        machineType: 'echo_bike',
        caloriesBurned: 200,
        stepsCount: 0,
        durationMinutes: 20,
      });

      expect(getCardioLogs().some((l) => l.id === entry.id)).toBe(true);
      deleteCardioLog(entry.id);
      expect(getCardioLogs().some((l) => l.id === entry.id)).toBe(false);
    });
  });

  describe('Health Telemetry Storage Engine', () => {
    it('returns valid default telemetry structure with 10,000 step target for new athlete', async () => {
      const telemetry = await fetchHealthTelemetry('new_athlete@o1fc.app');
      expect(telemetry.user_email).toBe('new_athlete@o1fc.app');
      expect(telemetry.step_target).toBe(10000);
      expect(telemetry.steps).toBe(0);
      expect(telemetry.calories_consumed).toBe(0);
      expect(telemetry.water_ml).toBe(0);
    });
  });
});
