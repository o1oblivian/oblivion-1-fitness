import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsultationProfile, EMPTY_CONSULTATION } from './consultationTypes';
import {
  answerPatch,
  previewNotes,
  selectedKey,
  stepApplies,
  weeksUntilLabel,
} from './inductionHelpers';

const profile = (changes: Partial<ConsultationProfile> = {}): ConsultationProfile => ({
  ...EMPTY_CONSULTATION,
  ...changes,
});

describe('stepApplies', () => {
  it('asks about the discipline only when the goal is a sport', () => {
    expect(stepApplies('discipline', profile({ goal: 'sport' }))).toBe(true);
    expect(stepApplies('discipline', profile({ goal: 'muscle' }))).toBe(false);
  });

  it('asks about the event date for sport goals and for competitors', () => {
    expect(stepApplies('competition', profile({ goal: 'sport' }))).toBe(true);
    expect(stepApplies('competition', profile({ trainingAge: 'competitor' }))).toBe(true);
    expect(stepApplies('competition', profile({ goal: 'fitness', trainingAge: 'new' }))).toBe(
      false,
    );
  });

  it('always asks every other question', () => {
    expect(stepApplies('goal', profile())).toBe(true);
  });
});

describe('answerPatch', () => {
  it('sets the discipline a plain goal implies and clears a stale event date', () => {
    expect(answerPatch('goal', 'muscle', profile({ competitionDate: '2027-01-01' }))).toEqual({
      goal: 'muscle',
      primaryDiscipline: 'hypertrophy',
      competitionDate: '',
    });
  });

  it('keeps the event date for a competitor', () => {
    expect(
      answerPatch(
        'goal',
        'strength',
        profile({ trainingAge: 'competitor', competitionDate: '2027-01-01' }),
      ),
    ).toEqual({
      goal: 'strength',
      primaryDiscipline: 'powerlifting',
      competitionDate: '2027-01-01',
    });
  });

  it('leaves the discipline to the athlete for a sport goal', () => {
    expect(answerPatch('goal', 'sport', profile())).toEqual({ goal: 'sport' });
  });

  it('reads the session length as minutes and ignores a non-number', () => {
    expect(answerPatch('session_length', '45', profile())).toEqual({ sessionMinutes: 45 });
    expect(answerPatch('session_length', 'long', profile())).toEqual({});
  });

  it('changes nothing for a question with no profile field', () => {
    expect(answerPatch('facility', 'outdoor', profile())).toEqual({});
  });
});

describe('selectedKey', () => {
  it('returns the stored answer for each single-choice question', () => {
    const answered = profile({
      ageBand: '18-39',
      goal: 'fat_loss',
      primaryDiscipline: 'running',
      trainingAge: '1-3yrs',
      sessionMinutes: 60,
    });
    expect(selectedKey('age_band', answered)).toBe('18-39');
    expect(selectedKey('goal', answered)).toBe('fat_loss');
    expect(selectedKey('discipline', answered)).toBe('running');
    expect(selectedKey('training_age', answered)).toBe('1-3yrs');
    expect(selectedKey('session_length', answered)).toBe('60');
  });

  it('returns an empty string when nothing is chosen yet', () => {
    expect(selectedKey('session_length', profile({ sessionMinutes: 0 }))).toBe('');
    expect(selectedKey('goal', profile())).toBe('');
  });
});

describe('previewNotes', () => {
  it('says nothing when the profile has no constraints', () => {
    expect(previewNotes(profile())).toEqual([]);
  });

  it('names the number of places only when there is more than one', () => {
    expect(previewNotes(profile({ facilities: ['commercial'] }))).toEqual([
      'Only equipment you have where you train.',
    ]);
    expect(previewNotes(profile({ facilities: ['commercial', 'outdoor'] }))).toEqual([
      'Only equipment you have where you train across 2 places.',
    ]);
  });

  it('lists protected areas with commas and "and", and skips "none"', () => {
    expect(previewNotes(profile({ injuries: ['none'] }))).toEqual([]);
    expect(previewNotes(profile({ injuries: ['knees', 'none'] }))).toEqual([
      'Moves that load your knees are swapped out.',
    ]);
    expect(previewNotes(profile({ injuries: ['knees', 'wrists'] }))).toEqual([
      'Moves that load your knees and wrists are swapped out.',
    ]);
    expect(previewNotes(profile({ injuries: ['knees', 'lower_back', 'wrists'] }))).toEqual([
      'Moves that load your knees, lower back and wrists are swapped out.',
    ]);
  });

  it('adds the age and experience notes', () => {
    expect(previewNotes(profile({ ageBand: '60+' }))).toEqual([
      'No jumping or high-impact moves, and every set stops short of your limit.',
    ]);
    expect(previewNotes(profile({ ageBand: 'under18' }))).toEqual([
      'Every set stops short of your limit while you build good technique.',
    ]);
    expect(previewNotes(profile({ trainingAge: 'new' }))).toEqual([
      'Fewer sets and lighter weights while you learn the moves.',
    ]);
  });
});

describe('weeksUntilLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-21T12:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  it('says so when the date is today or has passed', () => {
    expect(weeksUntilLabel('2026-10-21')).toBe('Your event is today.');
    expect(weeksUntilLabel('2026-10-20')).toBe('That date has passed.');
  });

  it('counts days under a week and whole weeks after that', () => {
    expect(weeksUntilLabel('2026-10-22')).toBe('1 day to your event.');
    expect(weeksUntilLabel('2026-10-26')).toBe('5 days to your event.');
    expect(weeksUntilLabel('2026-10-28')).toBe('1 week to your event.');
    expect(weeksUntilLabel('2026-11-11')).toBe('3 weeks to your event.');
  });
});
