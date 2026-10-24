import React, { useMemo, useState } from 'react';
import { Weight, HeartPulse, Apple, Moon, Brain } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useTelemetryStore } from '../../telemetry/store/useTelemetryStore';
import {
  DayMeta,
  TelemetryCategory,
  useTelemetryHistoryStore,
} from '../store/useTelemetryHistoryStore';
import { useLiveToday } from '../hooks/useLiveToday';
import { LogDayTelemetryModal } from './LogDayTelemetryModal';
import { LiftHistoryCard } from './LiftHistoryCard';
import { type MonthDayItem } from './LogMonthGrid';
import { type LedgerRowActions } from './LogLedger';
import { ChannelDetail } from './LogChannelDetail';
import { LogChannelRow, LogStillToLog, type LogQuickAction } from './LogDayLedger';
import { LogCalendarCard } from './LogCalendarCard';
import { LogProgressCard } from './LogProgressCard';
import { DeleteConfirm } from './DeleteConfirm';
import {
  WEEKDAYS,
  cardioHeadline,
  cleanCardio,
  cleanNutrition,
  cleanWorkout,
  dateKeyOf,
  dayHeading,
  foodHeadline,
  foodLine,
  line,
  mindfulHeadline,
  mindfulLine,
  part,
  readableSteps,
  sleepHeadline,
  sleepLine,
  workoutHeadline,
  workoutLine,
  type Headline,
} from './logHistoryFormat';
import { removeDayEntry, removeDayLift, removeDayMeal, type DayTarget } from './logDayMutations';
import { buildTowerSeries, weekOffsetOf, type ChartSpan } from './logTowerSeries';

interface LogHistoryViewProps {
  showToast: (msg: string) => void;
}

/** Workouts, cardio and food come from their own tabs; only sleep and mindful minutes are typed in from the Log. */
const MANUAL_LOG_LABEL: Partial<Record<TelemetryCategory, string>> = {
  sleep: 'Log sleep',
  meditation: 'Log mindful',
};

const DAY_MS = 86_400_000;

export const LogHistoryView: React.FC<LogHistoryViewProps> = ({ showToast }) => {
  const stepCount = useTelemetryStore((s) => s.stepCount);
  const historyByDate = useTelemetryHistoryStore((s) => s.historyByDate);

  const today = useMemo(() => new Date(), []);
  const todayKey = dateKeyOf(today);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthView, setMonthView] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDateStr, setSelectedDateStr] = useState(today.toDateString());
  const [openChannel, setOpenChannel] = useState<TelemetryCategory | null>(null);
  const [towersOpen, setTowersOpen] = useState(false);
  const [towerChannel, setTowerChannel] = useState<TelemetryCategory>('workout');
  const [chartSpan, setChartSpan] = useState<ChartSpan>('week');
  const [editor, setEditor] = useState<{
    category: TelemetryCategory;
    mode: 'create' | 'edit';
    lift?: string;
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TelemetryCategory | null>(null);
  const [pendingLiftDelete, setPendingLiftDelete] = useState<string | null>(null);
  const [pendingMealDelete, setPendingMealDelete] = useState<{
    index: number;
    name: string;
  } | null>(null);
  const clearPending = () => {
    setPendingDelete(null);
    setPendingLiftDelete(null);
    setPendingMealDelete(null);
  };

  const mondayDate = useMemo(() => {
    const weekday = today.getDay();
    const date = new Date(today);
    date.setDate(today.getDate() + (weekday === 0 ? -6 : 1 - weekday) + weekOffset * 7);
    return date;
  }, [today, weekOffset]);

  const selectedDate = useMemo(() => new Date(selectedDateStr), [selectedDateStr]);
  const selectedDateKey = dateKeyOf(selectedDate);
  const isViewingToday = selectedDateKey === todayKey;
  const { liveWorkout, liveFood } = useLiveToday(isViewingToday);

  const record = historyByDate[selectedDateKey];
  const workout = liveWorkout || cleanWorkout(record?.workout);
  const cardio = cleanCardio(record?.cardio);
  const food = liveFood || cleanNutrition(record?.nutrition);
  const sleep = record?.sleep?.hasData ? record.sleep : undefined;
  const mindful =
    record?.meditation?.hasData && (record.meditation.minutes || 0) > 0
      ? record.meditation
      : undefined;
  const visibleSteps = readableSteps(cardio, isViewingToday ? stepCount : 0);
  const dayTarget: DayTarget = { dateKey: selectedDateKey, isToday: isViewingToday, historyByDate };

  const weekDays = useMemo(() => {
    return WEEKDAYS.map((dayName, index) => {
      const date = new Date(mondayDate);
      date.setDate(mondayDate.getDate() + index);
      const key = dateKeyOf(date);
      const isToday = key === todayKey;
      return {
        dayName,
        dayNum: date.getDate(),
        dateStr: date.toDateString(),
        dateKey: key,
        isToday,
        trained: Boolean(historyByDate[key]?.workout?.hasData || (isToday && liveWorkout)),
      };
    });
  }, [mondayDate, historyByDate, todayKey, liveWorkout]);

  const monthStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [today, monthOffset],
  );

  const monthDays = useMemo<MonthDayItem[]>(() => {
    const count = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    return Array.from({ length: count }, (_, index) => {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), index + 1);
      const key = dateKeyOf(date);
      const isToday = key === todayKey;
      return {
        dayNum: index + 1,
        dateStr: date.toDateString(),
        isToday,
        isFuture: date.getTime() > today.getTime() && !isToday,
        trained: Boolean(historyByDate[key]?.workout?.hasData || (isToday && liveWorkout)),
      };
    });
  }, [monthStart, historyByDate, todayKey, today, liveWorkout]);

  const sunday = new Date(mondayDate);
  sunday.setDate(mondayDate.getDate() + 6);
  const rangeLabel = monthView
    ? monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : `${mondayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { day: 'numeric' })}`;
  const atPresent = monthView ? monthOffset >= 0 : weekOffset >= 0;

  const selectedDayMeta: DayMeta = useMemo(() => {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = selectedDateKey === dateKeyOf(yesterday);
    const weekdayLong = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const weekdayShort = WEEKDAYS[(selectedDate.getDay() + 6) % 7];
    let dayLabel = weekdayLong;
    let dayPillLabel = weekdayShort;
    if (isViewingToday) {
      dayLabel = 'Today';
      dayPillLabel = 'Today';
    } else if (isYesterday) {
      dayLabel = 'Yesterday';
      dayPillLabel = 'Yest';
    }
    return {
      offset: Math.round((today.getTime() - selectedDate.getTime()) / DAY_MS),
      dateKey: selectedDateKey,
      dayLabel,
      dayPillLabel,
      dateFormatted: selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday: isViewingToday,
      isYesterday,
    };
  }, [selectedDate, selectedDateKey, today, isViewingToday]);

  const openEditor = (category: TelemetryCategory, mode: 'create' | 'edit') => {
    tactileEngine.triggerSelectionBuzz();
    setEditor({ category, mode });
  };

  const hasEntry = (category: TelemetryCategory): boolean => {
    if (category === 'workout') return workoutLine(workout) !== '--';
    if (category === 'cardio') {
      const logged = line([
        part(cardio?.distanceKm, ' km', 1),
        part(cardio?.durationMinutes, ' min'),
        part(cardio?.burnedKcal, ' kcal'),
      ]);
      return logged !== '--';
    }
    if (category === 'nutrition') return foodLine(food) !== '--';
    if (category === 'sleep') return sleepLine(sleep) !== '--';
    return mindfulLine(mindful) !== '--';
  };

  const removeEntry = (category: TelemetryCategory) => {
    removeDayEntry(category, dayTarget);
    setPendingDelete(null);
  };

  const removeLift = (name: string) => {
    setPendingLiftDelete(null);
    setPendingDelete(null);
    removeDayLift(name, dayTarget, workout);
  };

  const removeMeal = (index: number) => {
    setPendingMealDelete(null);
    removeDayMeal(index, dayTarget, food);
  };

  const channels: Array<{
    id: TelemetryCategory;
    title: string;
    /** Null when nothing is logged for this channel on the selected day. */
    headline: Headline | null;
    color: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'workout',
      title: 'Workout',
      headline: workoutHeadline(workout),
      color: 'text-o1-olive',
      icon: <Weight />,
    },
    {
      id: 'cardio',
      title: 'Cardio',
      headline: cardioHeadline(cardio, isViewingToday ? stepCount : 0),
      color: 'text-o1-teal',
      icon: <HeartPulse />,
    },
    {
      id: 'nutrition',
      title: 'Food',
      headline: foodHeadline(food),
      color: 'text-o1-slate',
      icon: <Apple />,
    },
    {
      id: 'sleep',
      title: 'Sleep',
      headline: sleepHeadline(sleep),
      color: 'text-o1-iris',
      icon: <Moon />,
    },
    {
      id: 'meditation',
      title: 'Mindful',
      headline: mindfulHeadline(mindful),
      color: 'text-o1-rose',
      icon: <Brain />,
    },
  ];
  const loggedChannels = channels.flatMap((channel) =>
    channel.headline ? [{ ...channel, headline: channel.headline }] : [],
  );
  const tower = buildTowerSeries({
    category: towerChannel,
    span: chartSpan,
    today,
    mondayDate,
    selectedDate,
    historyByDate,
    liveWorkout,
    liveFood,
  });
  const ledgerTitle = dayHeading(selectedDate, today);

  const selectTowerKey = (key: string) => {
    if (chartSpan !== 'week') setWeekOffset(weekOffsetOf(new Date(key), today));
    setSelectedDateStr(key);
  };

  const selectDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    if (monthView) setWeekOffset(weekOffsetOf(new Date(dateStr), today));
    clearPending();
  };

  const changeView = (month: boolean) => {
    if (month) {
      setMonthOffset(
        (selectedDate.getFullYear() - today.getFullYear()) * 12 +
          selectedDate.getMonth() -
          today.getMonth(),
      );
    }
    setMonthView(month);
  };

  const stepPeriod = (direction: -1 | 1) => {
    const step = (offset: number) => Math.min(0, offset + direction);
    if (monthView) setMonthOffset(step);
    else setWeekOffset(step);
  };

  const jumpToToday = () => {
    setWeekOffset(0);
    setMonthOffset(0);
    setSelectedDateStr(today.toDateString());
  };

  const quickActions: LogQuickAction[] = channels.flatMap((channel) => {
    const label = MANUAL_LOG_LABEL[channel.id];
    if (channel.headline || !label) return [];
    return [{ id: channel.id, label, onSelect: () => openEditor(channel.id, 'create') }];
  });
  const rowActionsFor = (category: TelemetryCategory): LedgerRowActions | undefined => {
    if (category === 'workout') {
      return {
        hint: true,
        onEdit: (row) => {
          tactileEngine.triggerSelectionBuzz();
          clearPending();
          setEditor({ category: 'workout', mode: 'edit', lift: row.name });
        },
        onDelete: (row) => {
          clearPending();
          setPendingLiftDelete(row.name);
        },
      };
    }
    const canEdit = hasEntry(category);
    if (!canEdit && !(category === 'cardio' && visibleSteps > 0)) return undefined;
    return {
      hint: true,
      onEdit: canEdit
        ? () => {
            clearPending();
            openEditor(category, 'edit');
          }
        : undefined,
      onDelete: (row) => {
        clearPending();
        const mealIndex = category === 'nutrition' ? Number(row.id.split(':')[1]) : NaN;
        if (Number.isInteger(mealIndex) && (food?.meals?.length ?? 0) > 1)
          setPendingMealDelete({ index: mealIndex, name: row.name });
        else setPendingDelete(category);
      },
    };
  };

  /** Everything inside an open channel row: its entries and delete confirmations. */
  const renderChannelEntries = (category: TelemetryCategory, title: string) => {
    const isToday = selectedDayMeta.dayLabel.toLowerCase() === 'today';
    return (
      <>
        {pendingDelete === category && (
          <DeleteConfirm
            label={`Delete ${title}`}
            onCancel={() => setPendingDelete(null)}
            onConfirm={() => removeEntry(category)}
          >
            Delete {isToday ? "today's" : `${selectedDayMeta.dayLabel}'s`} {title.toLowerCase()}?
            This action cannot be undone.
          </DeleteConfirm>
        )}
        <ChannelDetail
          category={category}
          workout={workout}
          cardio={cardio}
          food={food}
          sleep={sleep}
          mindful={mindful}
          steps={visibleSteps}
          rowActions={rowActionsFor(category)}
        />
        {category === 'nutrition' && pendingMealDelete && (
          <DeleteConfirm
            label={`Delete ${pendingMealDelete.name}`}
            onCancel={() => setPendingMealDelete(null)}
            onConfirm={() => removeMeal(pendingMealDelete.index)}
          >
            Delete {pendingMealDelete.name}? This action cannot be undone.
          </DeleteConfirm>
        )}
        {category === 'workout' && pendingLiftDelete && (
          <DeleteConfirm
            label={`Delete ${pendingLiftDelete}`}
            onCancel={() => setPendingLiftDelete(null)}
            onConfirm={() => removeLift(pendingLiftDelete)}
          >
            Delete {pendingLiftDelete} from {isToday ? 'today' : selectedDayMeta.dayLabel}? This
            action cannot be undone.
          </DeleteConfirm>
        )}
      </>
    );
  };

  return (
    <div className="o1-log space-y-2.5 select-none font-sans">
      <LogCalendarCard
        monthView={monthView}
        rangeLabel={rangeLabel}
        atPresent={atPresent}
        weekDays={weekDays}
        monthDays={monthDays}
        monthLeading={(monthStart.getDay() + 6) % 7}
        selectedDateStr={selectedDateStr}
        onViewChange={changeView}
        onStep={stepPeriod}
        onToday={jumpToToday}
        onSelectDate={selectDate}
      />

      <div className="rounded-2xl bg-o1-card border border-white/[0.07] overflow-hidden text-o1-bone">
        <LogProgressCard
          open={towersOpen}
          onToggle={() => setTowersOpen(!towersOpen)}
          channels={channels}
          channel={towerChannel}
          onChannelChange={setTowerChannel}
          span={chartSpan}
          onSpanChange={setChartSpan}
          series={tower}
          onSelectKey={selectTowerKey}
        />

        <div className="border-t border-white/[0.07] px-4 pt-3 pb-2.5 flex items-baseline justify-between gap-2">
          <h3 className="text-o1-control font-semibold text-o1-text">{ledgerTitle}</h3>
          <span className="text-o1-label text-o1-muted">
            {loggedChannels.length} of {channels.length} logged
          </span>
        </div>
        {loggedChannels.length === 0 && (
          <p className="px-4 pb-3 text-o1-caption text-o1-muted">
            Nothing is logged for this day yet.
          </p>
        )}
        {loggedChannels.map((channel) => (
          <LogChannelRow
            key={channel.id}
            title={channel.title}
            icon={channel.icon}
            iconClass={channel.color}
            headline={channel.headline}
            open={openChannel === channel.id}
            onToggle={() => {
              tactileEngine.triggerSelectionBuzz();
              setOpenChannel(openChannel === channel.id ? null : channel.id);
              setPendingDelete(null);
            }}
          >
            {renderChannelEntries(channel.id, channel.title)}
          </LogChannelRow>
        ))}
        <LogStillToLog actions={quickActions} />
      </div>

      <LiftHistoryCard />

      {editor && (
        <LogDayTelemetryModal
          isOpen
          onClose={() => setEditor(null)}
          category={editor.category}
          mode={editor.mode}
          focusLift={editor.lift}
          dayMeta={selectedDayMeta}
          onSaved={showToast}
        />
      )}
    </div>
  );
};
