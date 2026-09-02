import { useState, useMemo, useEffect } from 'react';
import { Search, X, Calendar, ExternalLink, ChevronDown, Play } from 'lucide-react';
import videos from './videos.json';
import dayNotes from './dayNotes.json';
import crossfitSessions from './crossfitSessions.json';
import whoopDays from './whoopDays.json';
import maxes from './maxes.json';
import coachNotes from './coachNotes.json';
import nutrition from './nutrition.json';
import weightDays from './weightDays.json';
import { supabase } from './supabase.js';

const LIFT_LABELS = {
  snatch: 'Snatch',
  power_snatch: 'Power Snatch',
  hip_power_snatch_ohs: '2 Hip Power Snatch + 2 OHS',
  power_snatch_ohs: 'Power Snatch + OHS',
  drop_snatch: 'Drop Snatch',
  paused_overhead_squat: 'Paused Overhead Squat',
  above_knee_hang_snatch: 'Above-Knee Hang Snatch',
  floating_snatch: 'Floating Snatch',
  clean_and_jerk: 'Clean & Jerk',
  pause_off_floor_clean_jerk: 'Pause Off-Floor Clean + 2 Jerks',
  clean_2_jerks: 'Clean + 2 Jerks',
  clean: 'Clean',
  pause_above_knee_clean: 'Pause Above-Knee Clean',
  above_knee_hang_clean: 'Above-Knee Hang Clean',
  tempo_clean: 'Tempo Clean',
  power_clean: 'Power Clean',
  hang_power_clean_push_press: 'Below-the-Knee HPC + PP',
  jerk: 'Jerk',
  tall_jerk: 'Tall Jerk',
  power_clean_jerk: 'Power Clean + Jerk',
  behind_neck_jerk: 'Behind-the-Neck Jerk',
  btn_strict_press_snatch_grip: 'BTN Strict Press, Snatch Grip',
  btn_push_press: 'BTN Push Press',
  press_in_split: 'Press in Split',
  barbell_strict_press: 'Barbell Strict Press',
  push_jerk_in_split: 'Push Jerk in Split',
  raised_snatch_deadlift: 'Raised Snatch Deadlift',
  paused_snatch_pull: 'Paused Snatch Pull (BTK + ATK)',
  tempo_clean_grip_deadlift: 'Tempo Clean-Grip Deadlift',
  front_squat: 'Front Squat',
  back_squat: 'Back Squat',
  paused_back_squat: 'Paused Back Squat',
  bulgarian_split_squat: 'Bulgarian Split Squat',
  ssb_split_squat: 'SSB Split Squat',
  knee_raises: 'Knee Raises (Dip Bar)',
  cossack_squat: 'Cossack Squat',
  sunrise_situps: 'Sunrise Sit-ups',
  single_leg_glute_bridge: 'Single-Leg Glute Bridge',
  deadlift: 'Deadlift',
  bb_bent_over_row_supinated: 'BB Bent-Over Row, Supinated',
  snatch_grip_rdl: 'Snatch-Grip RDL',
  dips: 'Dips',
  pull_ups: 'Pull-Ups',
  chin_ups: 'Chin-Ups',
};

// Movement family of each lift, for grouping chips in the Lift filter.
const LIFT_CATEGORIES = {
  snatch: 'snatch',
  power_snatch: 'snatch',
  drop_snatch: 'snatch',
  paused_overhead_squat: 'snatch',
  above_knee_hang_snatch: 'snatch',
  floating_snatch: 'snatch',
  hip_power_snatch_ohs: 'snatch',
  power_snatch_ohs: 'snatch',
  btn_strict_press_snatch_grip: 'snatch',
  btn_push_press: 'snatch',
  paused_snatch_pull: 'snatch',
  raised_snatch_deadlift: 'snatch',
  clean_and_jerk: 'clean_jerk',
  pause_off_floor_clean_jerk: 'clean_jerk',
  clean_2_jerks: 'clean_jerk',
  clean: 'clean_jerk',
  power_clean: 'clean_jerk',
  hang_power_clean_push_press: 'clean_jerk',
  pause_above_knee_clean: 'clean_jerk',
  above_knee_hang_clean: 'clean_jerk',
  tempo_clean: 'clean_jerk',
  tempo_clean_grip_deadlift: 'clean_jerk',
  jerk: 'clean_jerk',
  tall_jerk: 'clean_jerk',
  power_clean_jerk: 'clean_jerk',
  behind_neck_jerk: 'clean_jerk',
  press_in_split: 'clean_jerk',
  barbell_strict_press: 'clean_jerk',
  push_jerk_in_split: 'clean_jerk',
  front_squat: 'squat_pull',
  back_squat: 'squat_pull',
  paused_back_squat: 'squat_pull',
  deadlift: 'squat_pull',
  bb_bent_over_row_supinated: 'squat_pull',
  dips: 'accessory',
  pull_ups: 'accessory',
  chin_ups: 'accessory',
  bulgarian_split_squat: 'accessory',
  ssb_split_squat: 'squat_pull',
  knee_raises: 'accessory',
  cossack_squat: 'accessory',
  sunrise_situps: 'accessory',
  single_leg_glute_bridge: 'accessory',
  snatch_grip_rdl: 'accessory',
};

const LIFT_CATEGORY_ORDER = ['snatch', 'clean_jerk', 'squat_pull', 'accessory'];
const LIFT_CATEGORY_LABELS = {
  snatch: 'Snatch',
  clean_jerk: 'Clean & Jerk',
  squat_pull: 'Squat & Pull',
  accessory: 'Accessory',
};

// Day banner gradients by session type. The teal one is the original
// CrossFit-card treatment, promoted to the day level; Oly gets the warm
// accent twin and hybrid days blend both hues.
const DAY_BANNERS = {
  oly: `
    radial-gradient(ellipse at 85% -20%, rgba(233, 78, 27, 0.30), transparent 55%),
    linear-gradient(135deg, #3A1A0E 0%, #261712 55%, #141210 100%)
  `,
  crossfit: `
    radial-gradient(ellipse at 85% -20%, rgba(45, 182, 196, 0.35), transparent 55%),
    linear-gradient(135deg, #0E3A40 0%, #16282C 55%, #141210 100%)
  `,
  hybrid: `
    radial-gradient(ellipse at 90% -20%, rgba(45, 182, 196, 0.30), transparent 50%),
    radial-gradient(ellipse at 15% -30%, rgba(233, 78, 27, 0.28), transparent 50%),
    linear-gradient(135deg, #2E1911 0%, #15282C 60%, #141210 100%)
  `,
  // Fuel (nutrition) days: a green tint so food reads as its own concept
  // next to the warm Oly and cool CrossFit banners.
  fuel: `
    radial-gradient(ellipse at 85% -20%, rgba(63, 191, 127, 0.28), transparent 55%),
    linear-gradient(135deg, #0F3A26 0%, #16281F 55%, #141210 100%)
  `,
};
const DAY_TYPE_LABELS = { oly: 'Oly', crossfit: 'CrossFit', hybrid: 'Hybrid' };

// dayNotes entries can be a plain string (just a note) or an object
// { note, dayLabel } where dayLabel overrides the auto-computed "Day N".
function getDayNoteText(date) {
  const entry = dayNotes[date];
  if (!entry) return null;
  return typeof entry === 'string' ? entry : entry.note || null;
}
function getDayLabelOverride(date) {
  const entry = dayNotes[date];
  return entry && typeof entry === 'object' ? entry.dayLabel || null : null;
}

// Whoop recovery color bands (matches Whoop's own convention).
function recoveryColor(score) {
  if (score == null) return null;
  if (score >= 67) return '#3FBF7F';
  if (score >= 34) return '#E8B84B';
  return '#E4574F';
}

function formatSleep(min) {
  if (min == null) return null;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export default function App() {
  const [search, setSearch] = useState('');
  const [selectedLifts, setSelectedLifts] = useState(new Set());
  const [selectedWeeks, setSelectedWeeks] = useState(() => {
    // Default to the latest week present in the data, where "latest"
    // means highest cycle, then highest week within that cycle.
    // Class-only weeks (crossfitSessions) count too — a deload week with
    // no filmed lifts still has to be reachable and selected by default.
    let latest = null;
    let latestCycle = -Infinity;
    let latestWeek = -Infinity;
    const consider = (t) => {
      if (!t || !t.startsWith('week-')) return;
      const [w, c] = parseWeekTag(t);
      if (!Number.isFinite(w)) return;
      if (c > latestCycle || (c === latestCycle && w > latestWeek)) {
        latestCycle = c;
        latestWeek = w;
        latest = t;
      }
    };
    for (const v of videos) for (const t of v.tags) consider(t);
    for (const s of Object.values(crossfitSessions)) consider(s.week);
    return latest ? new Set([latest]) : new Set();
  });
  const [selectedCycles, setSelectedCycles] = useState(new Set());
  const [selectedLocations, setSelectedLocations] = useState(new Set());
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [selectedClasses, setSelectedClasses] = useState(new Set());
  const [activeGroup, setActiveGroup] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [liftFilterOpen, setLiftFilterOpen] = useState(false);
  const [tagFilterOpen, setTagFilterOpen] = useState(false);
  const [weeksExpanded, setWeeksExpanded] = useState(false);
  const [view, setView] = useState('log');
  // Days are open by default; collapsedDays tracks ones the user has folded.
  const [collapsedDays, setCollapsedDays] = useState(new Set());

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Geist:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    document.body.style.overflow = activeGroup ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [activeGroup]);

  const allTags = useMemo(() => {
    const tags = new Set();
    videos.forEach(v => v.tags.forEach(t => {
      if (t.startsWith('week-')) return;
      if (t.startsWith('cycle-')) return;
      if (t.startsWith('loc-')) return;
      tags.add(t);
    }));
    return Array.from(tags).sort();
  }, []);

  const allWeeks = useMemo(() => {
    const weeks = new Set();
    videos.forEach(v => v.tags.forEach(t => {
      if (t.startsWith('week-')) weeks.add(t);
    }));
    // Weeks that only exist as class sessions (e.g. a deload week with no
    // filmed lifts) still get a chip.
    Object.values(crossfitSessions).forEach(s => {
      if (s.week && s.week.startsWith('week-')) weeks.add(s.week);
    });
    return Array.from(weeks).sort((a, b) => {
      const [wa, ca] = parseWeekTag(a);
      const [wb, cb] = parseWeekTag(b);
      if (cb !== ca) return cb - ca;
      return wb - wa;
    });
  }, []);

  const allCycles = useMemo(() => {
    const cycles = new Set();
    videos.forEach(v => v.tags.forEach(t => {
      if (t.startsWith('cycle-')) cycles.add(t);
    }));
    return Array.from(cycles).sort();
  }, []);

  const allLocations = useMemo(() => {
    const locations = new Set();
    videos.forEach(v => v.tags.forEach(t => {
      if (t.startsWith('loc-')) locations.add(t);
    }));
    return Array.from(locations).sort();
  }, []);

  const allLifts = useMemo(() => {
    const counts = new Map();
    videos.forEach(v => counts.set(v.lift, (counts.get(v.lift) || 0) + 1));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([lift]) => lift);
  }, []);

  const visibleVideos = useMemo(() => {
    const q = search.trim().toLowerCase();
    return videos
      .filter(v => {
        if (selectedLifts.size > 0 && !selectedLifts.has(v.lift)) return false;
        if (selectedWeeks.size > 0 && !v.tags.some(t => selectedWeeks.has(t))) return false;
        if (selectedCycles.size > 0 && !v.tags.some(t => selectedCycles.has(t))) return false;
        if (selectedLocations.size > 0 && !v.tags.some(t => selectedLocations.has(t))) return false;
        if (selectedTags.size > 0 && !v.tags.some(t => selectedTags.has(t))) return false;
        if (q) {
          const haystack = `${v.title} ${v.notes} ${v.tags.join(' ')} ${LIFT_LABELS[v.lift] || v.lift} ${v.weight}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [search, selectedLifts, selectedWeeks, selectedCycles, selectedLocations, selectedTags]);

  // Group by (lift, date). Map insertion order preserves the upstream
  // date-descending sort, so groups are also date-descending. Within a
  // group, sets are sorted weight-descending (top set first).
  const groupedVideos = useMemo(() => {
    const groups = new Map();
    for (const v of visibleVideos) {
      const key = `${v.date}|${v.lift}`;
      if (!groups.has(key)) {
        groups.set(key, { key, date: v.date, lift: v.lift, videos: [] });
      }
      groups.get(key).videos.push(v);
    }
    for (const g of groups.values()) {
      // Stable sort by weight desc so same-weight ordering is preserved.
      g.videos.sort((a, b) => b.weight - a.weight);
    }
    return Array.from(groups.values());
  }, [visibleVideos]);

  // For each week, number the training days starting at Day 1 = earliest date.
  // Day numbers are stable across filters because they're computed from the
  // full data set.
  const dayNumberByKey = useMemo(() => {
    const datesByWeek = new Map();
    for (const v of videos) {
      const week = v.tags.find(t => t.startsWith('week-'));
      if (!week) continue;
      if (!datesByWeek.has(week)) datesByWeek.set(week, new Set());
      datesByWeek.get(week).add(v.date);
    }
    const result = new Map();
    for (const [week, dates] of datesByWeek) {
      const sorted = Array.from(dates).sort(); // ascending
      sorted.forEach((d, i) => result.set(`${week}|${d}`, i + 1));
    }
    return result;
  }, []);

  // Bucket the groups by training day so we can render a "Day N" header
  // above each day's set of cards. Within a day, split main lifts from
  // accessories so accessories can render in their own muted sub-grid
  // below the main lifts.
  const groupedByDay = useMemo(() => {
    const buckets = new Map();
    for (const g of groupedVideos) {
      const week = g.videos[0].tags.find(t => t.startsWith('week-'));
      const dayKey = `${week || 'no-week'}|${g.date}`;
      const dayNum = week ? dayNumberByKey.get(`${week}|${g.date}`) : null;
      const dayLabel = getDayLabelOverride(g.date) || (dayNum != null ? String(dayNum) : null);
      const isAccessory = g.videos.some(v => v.accessory);
      if (!buckets.has(dayKey)) {
        buckets.set(dayKey, { dayKey, date: g.date, dayLabel, week, mainGroups: [], accessoryGroups: [] });
      }
      const bucket = buckets.get(dayKey);
      (isAccessory ? bucket.accessoryGroups : bucket.mainGroups).push(g);
    }

    // CrossFit-only dates: dates that have a class session but no OWL videos.
    // Honour the active filters — lift/tag filters hide CrossFit-only days
    // (no lifts/tags to match against). Week/cycle/location pull from the
    // session's own fields.
    if (selectedLifts.size === 0 && selectedTags.size === 0) {
      for (const [date, session] of Object.entries(crossfitSessions)) {
        if (videos.some(v => v.date === date)) continue; // already has an OWL bucket
        const week = session.week || null;
        if (selectedWeeks.size > 0 && (!week || !selectedWeeks.has(week))) continue;
        if (selectedCycles.size > 0 && (!session.cycle || !selectedCycles.has(session.cycle))) continue;
        if (selectedLocations.size > 0 && (!session.location || !selectedLocations.has(session.location))) continue;
        const dayKey = `${week || 'no-week'}|${date}`;
        if (!buckets.has(dayKey)) {
          buckets.set(dayKey, { dayKey, date, dayLabel: getDayLabelOverride(date), week, mainGroups: [], accessoryGroups: [] });
        }
      }
    }

    // Class filter: when active, only keep days that match one of the
    // selected class types. 'oly' = day has OWL videos; 'crossfit' = day
    // has a CrossFit class session. Everything that isn't a class is Oly.
    let result = Array.from(buckets.values());
    if (selectedClasses.size > 0) {
      result = result.filter(d => {
        const hasOly = d.mainGroups.length + d.accessoryGroups.length > 0;
        const hasCrossfit = !!crossfitSessions[d.date];
        if (selectedClasses.has('oly') && hasOly) return true;
        if (selectedClasses.has('crossfit') && hasCrossfit) return true;
        return false;
      });
    }

    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [groupedVideos, dayNumberByKey, selectedLifts, selectedTags, selectedWeeks, selectedCycles, selectedLocations, selectedClasses]);

  // Bucket the day buckets by week so we can render a week separator
  // whenever multiple weeks are visible at once.
  // (Pulled out so we can also pick up CrossFit-only dates below.)
  const groupedByWeek = useMemo(() => {
    const result = [];
    for (const day of groupedByDay) {
      const weekKey = day.week || 'no-week';
      const bucket = result[result.length - 1];
      if (!bucket || bucket.weekKey !== weekKey) {
        result.push({ weekKey, week: day.week, days: [day] });
      } else {
        bucket.days.push(day);
      }
    }
    return result;
  }, [groupedByDay]);

  const toggle = (set, value, setter) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setter(next);
  };

  const clearAll = () => {
    setSearch('');
    setSelectedLifts(new Set());
    setSelectedWeeks(new Set());
    setSelectedCycles(new Set());
    setSelectedLocations(new Set());
    setSelectedTags(new Set());
    setSelectedClasses(new Set());
  };

  const hasActiveFilters = search || selectedLifts.size > 0 || selectedWeeks.size > 0 || selectedCycles.size > 0 || selectedLocations.size > 0 || selectedTags.size > 0 || selectedClasses.size > 0;

  return (
    <div style={styles.root}>
      <style>{globalCss}</style>

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <div style={styles.eyebrow}>Training log</div>
            <div style={styles.titleRow}>
              <h1 style={styles.title}>Sergio / Lifts</h1>
              <SnatchLifter />
            </div>
            <p style={styles.intro}>
              Welcome to my Oly Fans. I log my training mostly for me — sometimes for my coach. I don't take payments; please don't offer crypto.
            </p>
          </div>
          <div style={styles.headerStats}>
            <div style={styles.stat}>
              <div style={styles.statNum}>{videos.length}</div>
              <div style={styles.statLabel}>Total</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNum}>{visibleVideos.length}</div>
              <div style={styles.statLabel}>Showing</div>
            </div>
          </div>
        </div>
      </header>

      <nav style={styles.viewTabs}>
        {[
          { key: 'log', label: 'Training log' },
          { key: 'feed', label: 'Feed' },
          { key: 'fuel', label: 'Fuel' },
          { key: 'coach', label: 'Coach summary' },
        ].map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setView(t.key)}
            style={{
              ...styles.viewTab,
              ...(view === t.key ? styles.viewTabActive : {}),
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {view === 'log' && (
      <section style={styles.filterBar}>
        <div style={styles.searchWrap}>
          <Search size={16} style={styles.searchIcon} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search lift, weight, note, tag"
            style={styles.searchInput}
          />
          {search && (
            <button onClick={() => setSearch('')} style={styles.searchClear} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        <button
          style={styles.filterToggle}
          onClick={() => setFiltersOpen(o => !o)}
          aria-expanded={filtersOpen}
        >
          Filters
          <ChevronDown size={14} style={{ transform: filtersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {hasActiveFilters && (
          <button onClick={clearAll} style={styles.clearAll}>Reset</button>
        )}
      </section>
      )}

      {view === 'log' && filtersOpen && (
        <section style={styles.filterPanel}>
          {allWeeks.length > 0 && (() => {
            // Latest 3 weeks (plus any selected outside that window) unless expanded.
            const visibleWeeks = weeksExpanded
              ? allWeeks
              : allWeeks.filter((w, i) => i < 3 || selectedWeeks.has(w));
            const hiddenCount = allWeeks.length - visibleWeeks.length;
            return (
              <div style={styles.filterGroup}>
                <div style={styles.filterLabel}>Week</div>
                <div style={styles.chipRow}>
                  {visibleWeeks.map(week => (
                    <button
                      key={week}
                      onClick={() => toggle(selectedWeeks, week, setSelectedWeeks)}
                      style={{
                        ...styles.chip,
                        ...(selectedWeeks.has(week) ? styles.chipActive : {}),
                      }}
                    >
                      {formatWeek(week)}
                    </button>
                  ))}
                  {(hiddenCount > 0 || weeksExpanded) && (
                    <button
                      onClick={() => setWeeksExpanded(e => !e)}
                      style={{ ...styles.chip, color: COLORS.textMute, borderStyle: 'dashed' }}
                    >
                      {weeksExpanded ? 'less' : `+${hiddenCount} more`}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {allCycles.length > 0 && (
            <div style={styles.filterGroup}>
              <div style={styles.filterLabel}>Cycle</div>
              <div style={styles.chipRow}>
                {allCycles.map(cycle => (
                  <button
                    key={cycle}
                    onClick={() => toggle(selectedCycles, cycle, setSelectedCycles)}
                    style={{
                      ...styles.chip,
                      ...(selectedCycles.has(cycle) ? styles.chipActive : {}),
                    }}
                  >
                    {formatCycle(cycle)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {allLocations.length > 0 && (
            <div style={styles.filterGroup}>
              <div style={styles.filterLabel}>Location</div>
              <div style={styles.chipRow}>
                {allLocations.map(loc => (
                  <button
                    key={loc}
                    onClick={() => toggle(selectedLocations, loc, setSelectedLocations)}
                    style={{
                      ...styles.chip,
                      ...(selectedLocations.has(loc) ? styles.chipActive : {}),
                    }}
                  >
                    {formatLocation(loc)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={styles.filterGroup}>
            <div style={styles.filterLabel}>Class</div>
            <div style={styles.chipRow}>
              {[
                { key: 'oly', label: 'Oly', color: COLORS.accent },
                { key: 'crossfit', label: 'CrossFit', color: COLORS.accentCool },
              ].map(({ key, label, color }) => {
                const active = selectedClasses.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggle(selectedClasses, key, setSelectedClasses)}
                    style={{
                      ...styles.chip,
                      ...(active ? {
                        background: color,
                        borderColor: color,
                        color: '#fff',
                        boxShadow: `0 4px 14px ${color}45`,
                      } : {}),
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={styles.filterGroup}>
            <button
              type="button"
              onClick={() => setLiftFilterOpen(o => !o)}
              style={styles.filterSectionToggle}
              aria-expanded={liftFilterOpen}
            >
              <span style={{ ...styles.filterLabel, marginBottom: 0 }}>Lift</span>
              {selectedLifts.size > 0 && (
                <span style={{ ...styles.filterSectionCount, marginBottom: 0 }}>{selectedLifts.size} selected</span>
              )}
              <ChevronDown
                size={12}
                style={{
                  color: COLORS.textMute,
                  transform: liftFilterOpen ? 'none' : 'rotate(-90deg)',
                  transition: 'transform 0.18s ease',
                  marginLeft: 'auto',
                }}
              />
            </button>
            {liftFilterOpen && (
              <div style={{ ...styles.liftCategories, marginTop: 12 }}>
                {LIFT_CATEGORY_ORDER.map(cat => {
                  const liftsInCat = allLifts.filter(l => (LIFT_CATEGORIES[l] || 'accessory') === cat);
                  if (liftsInCat.length === 0) return null;
                  return (
                    <div key={cat} style={styles.liftCategory}>
                      <div style={styles.liftCategoryLabel}>{LIFT_CATEGORY_LABELS[cat]}</div>
                      <div style={styles.chipRow}>
                        {liftsInCat.map(lift => (
                          <button
                            key={lift}
                            onClick={() => toggle(selectedLifts, lift, setSelectedLifts)}
                            style={{
                              ...styles.chip,
                              ...(selectedLifts.has(lift) ? styles.chipActive : {}),
                            }}
                          >
                            {LIFT_LABELS[lift] || lift}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={styles.filterGroup}>
            <button
              type="button"
              onClick={() => setTagFilterOpen(o => !o)}
              style={styles.filterSectionToggle}
              aria-expanded={tagFilterOpen}
            >
              <span style={{ ...styles.filterLabel, marginBottom: 0 }}>Tag</span>
              {selectedTags.size > 0 && (
                <span style={{ ...styles.filterSectionCount, marginBottom: 0 }}>{selectedTags.size} selected</span>
              )}
              <ChevronDown
                size={12}
                style={{
                  color: COLORS.textMute,
                  transform: tagFilterOpen ? 'none' : 'rotate(-90deg)',
                  transition: 'transform 0.18s ease',
                  marginLeft: 'auto',
                }}
              />
            </button>
            {tagFilterOpen && (
              <div style={{ ...styles.chipRow, marginTop: 12 }}>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggle(selectedTags, tag, setSelectedTags)}
                    style={{
                      ...styles.chip,
                      ...(selectedTags.has(tag) ? styles.chipActive : {}),
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <main style={styles.main}>
        {view === 'coach' ? (
          <CoachPage />
        ) : view === 'fuel' ? (
          <FuelPage />
        ) : view === 'feed' ? (
          <FeedPage />
        ) : visibleVideos.length === 0 && groupedByDay.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyTitle}>No lifts match.</div>
            <div style={styles.emptySub}>Try clearing a filter or different search term.</div>
            {hasActiveFilters && (
              <button onClick={clearAll} style={styles.emptyBtn}>Reset filters</button>
            )}
          </div>
        ) : (
          <div style={styles.days}>
            {groupedByWeek.map((weekBucket, wi) => {
              // Per-week rollup for the header: Oly days, classes, sets, top lift.
              let sets = 0;
              let top = null;
              let olyDays = 0;
              let classDays = 0;
              for (const d of weekBucket.days) {
                const groups = [...d.mainGroups, ...d.accessoryGroups];
                if (groups.length > 0) olyDays += 1;
                if (crossfitSessions[d.date]) classDays += 1;
                for (const g of groups) {
                  sets += g.videos.length;
                  for (const v of g.videos) {
                    if (!v.accessory && (!top || v.weight > top.weight)) top = v;
                  }
                }
              }
              const statParts = [
                olyDays > 0 && `${olyDays} oly ${olyDays === 1 ? 'day' : 'days'}`,
                classDays > 0 && `${classDays} ${classDays === 1 ? 'class' : 'classes'}`,
                sets > 0 && `${sets} sets`,
                top && `top ${top.weight}kg ${(LIFT_LABELS[top.lift] || top.lift).toLowerCase()}`,
              ].filter(Boolean);
              return (
              <div key={weekBucket.weekKey} style={styles.weekSection}>
                {(weekBucket.week || groupedByWeek.length > 1) && (
                  <div style={styles.weekDivider}>
                    <span style={styles.weekDividerLabel}>
                      {weekBucket.week ? formatWeek(weekBucket.week) : 'No week'}
                    </span>
                    {statParts.length > 0 && (
                      <span style={styles.weekStats}>{statParts.join(' · ')}</span>
                    )}
                    <span style={styles.weekDividerLine} />
                  </div>
                )}
                <div style={styles.days}>
                  {weekBucket.days.map(day => {
              const collapsed = collapsedDays.has(day.dayKey);
              const totalCards = day.mainGroups.length + day.accessoryGroups.length;
              const noteText = getDayNoteText(day.date);
              const isCrossfitOnly = totalCards === 0 && !!crossfitSessions[day.date];
              const dayType = isCrossfitOnly ? 'crossfit' : crossfitSessions[day.date] ? 'hybrid' : 'oly';
              const whoop = whoopDays[day.date];
              return (
                <section key={day.dayKey} style={styles.daySection}>
                  <button
                    type="button"
                    className="day-header"
                    onClick={() => {
                      setCollapsedDays(prev => {
                        const next = new Set(prev);
                        if (next.has(day.dayKey)) next.delete(day.dayKey);
                        else next.add(day.dayKey);
                        return next;
                      });
                    }}
                    style={{
                      ...styles.dayHeader,
                      background: DAY_BANNERS[dayType],
                    }}
                    aria-expanded={!collapsed}
                  >
                    <span style={styles.dayHeaderInner}>
                      <span style={styles.dayLabel}>
                        {day.dayLabel != null ? `Day ${day.dayLabel} · ${DAY_TYPE_LABELS[dayType]}` : DAY_TYPE_LABELS[dayType]}
                      </span>
                      <span style={styles.daySep}>·</span>
                      <span style={styles.dayDate}>{formatDayDate(day.date)}</span>
                      {totalCards > 0 && (
                        <span style={styles.dayCount}>{totalCards} {totalCards === 1 ? 'lift' : 'lifts'}</span>
                      )}
                      {whoop && whoop.recovery != null && (
                        <span style={styles.recoveryPill}>
                          <span style={{ ...styles.recoveryDot, background: recoveryColor(whoop.recovery) }} />
                          {whoop.recovery}%
                        </span>
                      )}
                    </span>
                    <ChevronDown
                      size={16}
                      className="day-chevron"
                      style={{
                        marginLeft: 'auto',
                        flexShrink: 0,
                        alignSelf: 'center',
                        color: COLORS.textDim,
                        transform: collapsed ? 'rotate(-90deg)' : 'none',
                        transition: 'transform 0.18s ease, color 0.15s ease',
                      }}
                    />
                  </button>
                  {!collapsed && (
                    <>
                      {whoop && <WhoopStrip data={whoop} />}
                      {noteText && (
                        <div style={styles.dayNote}>
                          <div style={styles.dayNoteLabel}>Session note</div>
                          <div style={styles.dayNoteBody}>{noteText}</div>
                        </div>
                      )}
                      {crossfitSessions[day.date] && (
                        <CrossfitCard session={crossfitSessions[day.date]} />
                      )}
                      {day.mainGroups.length > 0 && (
                        <div style={styles.grid}>
                          {day.mainGroups.map(g => (
                            <GroupCard key={g.key} group={g} onClick={() => setActiveGroup(g)} />
                          ))}
                        </div>
                      )}
                      {day.accessoryGroups.length > 0 && (
                        <div style={styles.accessoryBlock}>
                          <div style={styles.accessoryLabel}>Accessories</div>
                          <div style={styles.accessoryGrid}>
                            {day.accessoryGroups.map(g => (
                              <GroupCard key={g.key} group={g} onClick={() => setActiveGroup(g)} accessory />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </section>
              );
            })}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <span style={styles.footerText}>Lifts manifest, YouTube embedded.</span>
      </footer>

      {activeGroup && (
        <GroupModal group={activeGroup} onClose={() => setActiveGroup(null)} />
      )}
    </div>
  );
}

function GroupCard({ group, onClick, accessory }) {
  const date = new Date(group.date);
  const dateStr = date.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: '2-digit' });

  const top = group.videos[0]; // sorted weight-desc
  const otherWeights = Array.from(new Set(group.videos.slice(1).map(v => v.weight))).filter(w => w !== top.weight);
  const setCount = group.videos.reduce((sum, v) => sum + (v.sets || 1), 0);
  const allTags = Array.from(new Set(group.videos.flatMap(v => v.tags)));
  const reps = top.reps;
  const isBodyweight = accessory && (top.weight == null || top.weight === 0);
  const hasVideo = group.videos.some(v => v.youtubeId);

  // Hybrid card: main lift cards with video lead with a thumbnail hero
  // (feed-style), keeping the log's day structure around them.
  const heroVideo = group.videos.find(v => v.youtubeId);
  const showHero = hasVideo && !accessory && heroVideo;

  return (
    <button
      onClick={hasVideo ? onClick : undefined}
      style={{
        ...styles.card,
        ...(accessory ? styles.cardAccessory : {}),
        ...(hasVideo ? {} : styles.cardLogged),
      }}
      className={accessory ? 'lift-card lift-card-accessory' : 'lift-card'}
    >
      {showHero && (
        <div style={styles.cardHero}>
          <img
            src={`https://i.ytimg.com/vi/${heroVideo.youtubeId}/hqdefault.jpg`}
            alt=""
            style={styles.cardHeroImg}
            loading="lazy"
            onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
          />
          <div style={styles.cardHeroShade} />
          <div style={styles.cardHeroText}>
            <div style={styles.cardHeroName}>{LIFT_LABELS[group.lift] || group.lift}</div>
            <div style={styles.cardHeroWeight}>
              {isBodyweight ? (
                <>{setCount}×{reps || '?'}<span style={styles.cardHeroUnit}>BW</span></>
              ) : (
                <>{top.weight}<span style={styles.cardHeroUnit}>kg</span></>
              )}
            </div>
            {!isBodyweight && top.bodyweight && top.weight > 0 && (
              <div style={styles.cardHeroBwLine}>{Math.round((top.weight / top.bodyweight) * 100)}% bodyweight</div>
            )}
          </div>
          <div style={styles.cardHeroSets}>
            <Play size={10} fill="currentColor" />
            {setCount} {setCount === 1 ? 'set' : 'sets'}
          </div>
        </div>
      )}
      {!showHero && (
        <div style={styles.cardTop}>
          <div style={{ ...styles.cardLift, ...(accessory ? styles.cardLiftAccessory : {}) }}>
            {LIFT_LABELS[group.lift] || group.lift}
          </div>
          <div style={styles.cardDate}>{dateStr}</div>
        </div>
      )}
      {!showHero && (
        isBodyweight ? (
          <div style={styles.cardWeight}>
            <span style={styles.cardWeightAccessoryNum}>{setCount}×{reps || '?'}</span>
            <span style={styles.cardWeightUnit}>BW</span>
          </div>
        ) : (
          <>
            <div style={styles.cardWeight}>
              <span style={{ ...styles.cardWeightNum, ...(accessory ? styles.cardWeightAccessoryNum : {}) }}>{top.weight}</span>
              <span style={styles.cardWeightUnit}>kg</span>
            </div>
            {top.bodyweight && top.weight > 0 && (
              <div style={styles.cardBwPct}>
                {Math.round((top.weight / top.bodyweight) * 100)}% BW
              </div>
            )}
          </>
        )
      )}
      <div style={styles.cardSetMeta}>
        {showHero && <span>{dateStr} · </span>}
        <span>{setCount} {setCount === 1 ? 'set' : 'sets'}{reps && !isBodyweight ? ` × ${reps}` : ''}</span>
        {otherWeights.length > 0 && (
          <span style={styles.cardSetMetaSecondary}> · also {otherWeights.join(', ')}kg</span>
        )}
      </div>
      {(top.summary || top.notes) && (
        <div style={styles.cardNotes}>{top.summary || top.notes}</div>
      )}
      {!showHero && (
        <div style={styles.cardTags}>
          {allTags.map(t => (
            <span key={t} style={styles.cardTag}>{t}</span>
          ))}
        </div>
      )}
      {hasVideo ? (
        !showHero && (
          <div style={{ ...styles.cardFooter, ...(accessory ? styles.cardFooterAccessory : {}) }}>
            <Play size={11} style={{ marginRight: 6 }} fill="currentColor" />
            Play {setCount} {setCount === 1 ? 'set' : 'sets'}
          </div>
        )
      ) : (
        <div style={styles.cardLoggedFooter}>Logged · no video</div>
      )}
    </button>
  );
}

function Comments({ video }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [author, setAuthor] = useState(() => {
    try { return localStorage.getItem('lifts.author') || ''; } catch { return ''; }
  });
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    supabase
      .from('comments')
      .select('id, author, body, created_at')
      .eq('video_youtube_id', video.youtubeId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setError(error.message);
        else setList(data || []);
        setLoading(false);
      });
    return () => { alive = false; };
  }, [video.youtubeId]);

  const canSubmit = author.trim() && body.trim() && !submitting;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const a = author.trim();
    const b = body.trim();
    setSubmitting(true);
    setError(null);
    const { data, error } = await supabase
      .from('comments')
      .insert({ video_youtube_id: video.youtubeId, author: a, body: b })
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setList(prev => [...prev, data]);
    setBody('');
    try { localStorage.setItem('lifts.author', a); } catch {}
  };

  return (
    <div style={styles.commentsBlock}>
      <div style={styles.commentsHeader}>
        <span style={styles.modalNotesLabel}>Comments</span>
        <span style={styles.commentsCount}>{loading ? '…' : list.length}</span>
      </div>

      {error && <div style={styles.commentsError}>{error}</div>}

      {!loading && list.length === 0 && !error && (
        <div style={styles.commentsEmpty}>No comments yet. Be the first.</div>
      )}

      {list.length > 0 && (
        <ul style={styles.commentsList}>
          {list.map((c) => (
            <li key={c.id} style={styles.comment}>
              <div style={styles.commentMeta}>
                <span style={styles.commentAuthor}>{c.author}</span>
                <span style={styles.commentDate}>{formatCommentDate(c.created_at)}</span>
              </div>
              <div style={styles.commentBody}>{c.body}</div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} style={styles.commentForm}>
        <input
          type="text"
          placeholder="Your name"
          value={author}
          onChange={e => setAuthor(e.target.value)}
          maxLength={50}
          style={styles.commentInputName}
        />
        <textarea
          placeholder="Add a comment…"
          value={body}
          onChange={e => setBody(e.target.value)}
          maxLength={2000}
          rows={3}
          style={styles.commentInputBody}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            ...styles.commentSubmit,
            ...(canSubmit ? {} : styles.commentSubmitDisabled),
          }}
        >
          {submitting ? 'Posting…' : 'Post comment'}
        </button>
      </form>
    </div>
  );
}

// Compact per-day readiness strip from Whoop (src/whoopDays.json).
// Shows the signals a coach cares about: recovery, HRV, RHR, sleep, strain.
function WhoopStrip({ data }) {
  const stats = [
    data.recovery != null && {
      label: 'Recovery',
      value: `${data.recovery}%`,
      color: recoveryColor(data.recovery),
    },
    data.hrv != null && { label: 'HRV', value: `${data.hrv} ms` },
    data.rhr != null && { label: 'RHR', value: `${data.rhr} bpm` },
    data.sleepMin != null && {
      label: 'Sleep',
      value: formatSleep(data.sleepMin),
      sub: data.sleepPerf != null ? `${data.sleepPerf}%` : null,
    },
    data.strain != null && { label: 'Strain', value: data.strain.toFixed(1) },
  ].filter(Boolean);
  if (stats.length === 0) return null;
  return (
    <div style={styles.whoopStrip}>
      <span style={styles.whoopTag}>Whoop</span>
      {stats.map(s => (
        <span key={s.label} style={styles.whoopStat}>
          <span style={styles.whoopStatLabel}>{s.label}</span>
          <span style={{ ...styles.whoopStatValue, ...(s.color ? { color: s.color } : {}) }}>
            {s.value}
            {s.sub && <span style={styles.whoopStatSub}> · {s.sub}</span>}
          </span>
        </span>
      ))}
    </div>
  );
}

// Single-series bar chart (inline SVG, no library). Bars grow from a
// zero baseline, rounded 3px at the data end, square at the base, with
// a surface gap between bars and a per-bar hover tooltip.
function BarChart({ points, color, colorFor, unit, showXLabels, domainMax, ticks }) {
  const [hoverI, setHoverI] = useState(null);
  const W = 260, H = showXLabels ? 92 : 72, TOP = 6;
  const PADL = ticks ? 26 : 6, PADR = 6;
  const BASE = showXLabels ? H - 14 : H - 2;
  const n = points.length;
  // Fixed domain (0-100 for recovery %, 0-21 for Whoop strain) so bar
  // height is honest; falls back to the data max for unbounded metrics.
  const max = domainMax || Math.max(...points.map(p => p.value)) || 1;
  const slot = (W - PADL - PADR) / n;
  const bw = Math.max(1.5, Math.min(24, slot - 2));
  const x = i => PADL + i * slot + (slot - bw) / 2;
  const y = v => BASE - (v / max) * (BASE - TOP);
  const bar = (i, v) => {
    const bx = x(i), by = y(v), r = Math.min(3, bw / 2);
    return `M${bx},${BASE} V${(by + r).toFixed(1)} Q${bx},${by.toFixed(1)} ${(bx + r).toFixed(1)},${by.toFixed(1)} H${(bx + bw - r).toFixed(1)} Q${(bx + bw).toFixed(1)},${by.toFixed(1)} ${(bx + bw).toFixed(1)},${(by + r).toFixed(1)} V${BASE} Z`;
  };
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (W / rect.width);
    const i = Math.max(0, Math.min(n - 1, Math.floor((px - PADL) / slot)));
    setHoverI(i);
  };
  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseMove={onMove}
        onMouseLeave={() => setHoverI(null)}
      >
        {ticks && ticks.map(t => (
          <g key={`t${t}`}>
            <line
              x1={PADL} y1={y(t)} x2={W - PADR} y2={y(t)}
              stroke={COLORS.border} strokeWidth="1" opacity="0.55"
            />
            <text
              x={PADL - 5} y={y(t) + 2.5} textAnchor="end"
              fontFamily="JetBrains Mono, monospace" fontSize="7" fill={COLORS.textMute}
            >
              {t}{unit}
            </text>
          </g>
        ))}
        <line x1={PADL} y1={BASE} x2={W - PADR} y2={BASE} stroke={COLORS.border} strokeWidth="1" />
        {points.map((p, i) => (
          <path
            key={i}
            d={bar(i, p.value)}
            fill={colorFor ? colorFor(p.value) : color}
            opacity={hoverI == null || hoverI === i ? 1 : 0.45}
          />
        ))}
        {showXLabels && points.map((p, i) => (
          <text
            key={`l${i}`}
            x={x(i) + bw / 2}
            y={H - 3}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="8"
            fill={COLORS.textMute}
          >
            {p.short || p.label || ''}
          </text>
        ))}
      </svg>
      {hoverI != null && (
        <div
          style={{
            ...styles.sparkTooltip,
            left: `${((x(hoverI) + bw / 2) / W) * 100}%`,
            transform: x(hoverI) > W * 0.6 ? 'translateX(-100%)' : 'none',
          }}
        >
          {points[hoverI].label || formatDayDate(points[hoverI].date)} · {points[hoverI].value}{unit}
        </div>
      )}
    </div>
  );
}

// 1RM board: every main lift on one screen — current max, a bar scaled
// against the heaviest lift, the previous max as a tick, and the delta.
// Data lives in src/maxes.json; append to a lift's history on a new test.
function MaxBoard() {
  const entries = Object.entries(maxes)
    .map(([key, m]) => {
      const hist = m.history.slice().sort((a, b) => a.date.localeCompare(b.date));
      const cur = hist[hist.length - 1];
      const prev = hist.length > 1 ? hist[hist.length - 2] : null;
      return { key, label: m.label, cur, prev };
    })
    .sort((a, b) => b.cur.kg - a.cur.kg);
  if (entries.length === 0) return null;
  const maxKg = Math.max(...entries.map(e => e.cur.kg));
  return (
    <section style={styles.trendsPanel}>
      <div style={styles.coachSectionHead}>
        <span style={styles.filterLabel}>Max lifts</span>
        <span style={styles.trendsSub}>1RM — bar scale is relative to the heaviest lift</span>
      </div>
      <div style={styles.maxBoard}>
        {entries.map(e => {
          const delta = e.prev ? e.cur.kg - e.prev.kg : 0;
          return (
            <div key={e.key} style={styles.maxRow}>
              <div style={styles.maxRowHead}>
                <span style={styles.maxRowLabel}>{e.label}</span>
                <span style={styles.maxRowMeta}>
                  {e.cur.ref ? 'program ref' : e.cur.est ? 'estimated' : `tested ${formatDayDate(e.cur.date)}`}
                </span>
                <span style={styles.maxRowValue}>
                  {e.prev && <span style={styles.maxRowPrev}>{e.prev.kg} → </span>}
                  {e.cur.kg}<span style={styles.maxRowUnit}>kg</span>
                  {delta > 0 && (
                    <span style={{ ...styles.trendDelta, color: '#3FBF7F' }}>+{delta}</span>
                  )}
                </span>
              </div>
              <div style={styles.maxTrack}>
                <div style={{ ...styles.maxFill, width: `${(e.cur.kg / maxKg) * 100}%` }} />
                {e.prev && (
                  <div style={{ ...styles.maxPrevTick, left: `${(e.prev.kg / maxKg) * 100}%` }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Whoop recovery, last 30 days, as one compact band-colored bar chart.
// Whoop weekly averages, bucketed by cycle week (week 1 = 11 May 2026,
// matching the week-N-c2 tags used across the log).
const CYCLE2_START_MS = Date.UTC(2026, 4, 11);
function RecoveryPanel() {
  const weekly = useMemo(() => {
    const buckets = new Map();
    for (const [date, d] of Object.entries(whoopDays)) {
      const [y, m, day] = date.split('-').map(Number);
      const idx = Math.floor((Date.UTC(y, m - 1, day) - CYCLE2_START_MS) / (7 * 86400000)) + 1;
      if (idx < 1) continue;
      if (!buckets.has(idx)) buckets.set(idx, { rec: [], strain: [] });
      const b = buckets.get(idx);
      if (d.recovery != null) b.rec.push(d.recovery);
      if (d.strain != null) b.strain.push(d.strain);
    }
    const weeks = Array.from(buckets.keys()).sort((a, b) => a - b);
    const avg = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
    return {
      recovery: weeks
        .map(w => ({ label: `Week ${w}`, short: `W${w}`, value: avg(buckets.get(w).rec) }))
        .filter(p => p.value != null)
        .map(p => ({ ...p, value: Math.round(p.value) })),
      strain: weeks
        .map(w => ({ label: `Week ${w}`, short: `W${w}`, value: avg(buckets.get(w).strain) }))
        .filter(p => p.value != null)
        .map(p => ({ ...p, value: Math.round(p.value * 10) / 10 })),
    };
  }, []);
  if (weekly.recovery.length < 2) return null;
  const lastRec = weekly.recovery[weekly.recovery.length - 1];
  const lastStrain = weekly.strain[weekly.strain.length - 1];
  return (
    <section style={styles.trendsPanel}>
      <div style={styles.coachSectionHead}>
        <span style={styles.filterLabel}>Whoop</span>
        <span style={styles.trendsSub}>weekly averages, cycle 2 (week 1 = 11 may)</span>
      </div>
      <div style={styles.trendsGrid}>
        <div style={styles.trendCell}>
          <div style={styles.trendCellHead}>
            <span style={styles.trendCellLabel}>Avg recovery / week</span>
            <span style={styles.trendCellValue}>{lastRec.value}%</span>
          </div>
          <BarChart points={weekly.recovery} colorFor={recoveryColor} unit="%" showXLabels domainMax={100} ticks={[50, 100]} />
        </div>
        {weekly.strain.length >= 2 && (
          <div style={styles.trendCell}>
            <div style={styles.trendCellHead}>
              <span style={styles.trendCellLabel}>Avg strain / week</span>
              <span style={styles.trendCellValue}>{lastStrain.value}</span>
            </div>
            <BarChart points={weekly.strain} color={COLORS.accentCool} unit="" showXLabels domainMax={21} ticks={[7, 14, 21]} />
          </div>
        )}
      </div>
    </section>
  );
}

// Athlete notes (src/coachNotes.json): Sergio's own read on where each
// main lift is at — struggles in his words, not coaching prescriptions.
function AthleteNotes() {
  if (!coachNotes.length) return null;
  return (
    <section style={styles.trendsPanel}>
      <div style={styles.coachSectionHead}>
        <span style={styles.filterLabel}>Athlete notes</span>
        <span style={styles.trendsSub}>where each lift is at, in my own words</span>
      </div>
      <div style={styles.noteGrid}>
        {coachNotes.map(n => (
          <div key={n.lift} style={styles.noteCard}>
            <div style={styles.noteLift}>{n.lift}</div>
            <div style={styles.noteBody}>{n.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Coach summary view: maxes, athlete notes, Whoop trends. The training
// feed stays clean; this page is the birds-eye read for Seb.
function CoachPage() {
  return (
    <div>
      <MaxBoard />
      <AthleteNotes />
      <RecoveryPanel />
    </div>
  );
}

// ---------------------------------------------------------------------
// Fuel: the nutrition log (src/nutrition.json) + morning weight
// (src/weightDays.json, RENPHO). Same day-card grammar as the training
// log, with Seb's calorie band and the pre/intra/post protocol surfaced
// so a coach can read adherence at a glance.
// ---------------------------------------------------------------------
const SLOT_LABELS = { pre: 'Pre', intra: 'Intra', post: 'Post', veg: 'Veg', fruit: 'Fruit', supp: 'Supp' };
const BAND_OK = '#3FBF7F';
const BAND_OFF = '#E8B84B';

function sumItems(items) {
  return items.reduce((a, i) => ({
    kcal: a.kcal + (i.kcal || 0),
    p: a.p + (i.p || 0),
    c: a.c + (i.c || 0),
    f: a.f + (i.f || 0),
    fibre: a.fibre + (i.fibre || 0),
  }), { kcal: 0, p: 0, c: 0, f: 0, fibre: 0 });
}

function shortDay(s) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return `${['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()]}${d.getDate()}`;
}

// Strip the "PRE-TRAINING (40 min out): " style prefix once the slot is
// shown as its own tag next to the item.
function cleanItemName(name) {
  return name.replace(/^(PRE-TRAINING|PRE-CLASS|INTRA-TRAINING|INTRA-CLASS|POST-TRAINING|BETWEEN SESSIONS)[^:]*:\s*/i, '');
}

function useFuelDays() {
  return useMemo(() => Object.entries(nutrition.days)
    .map(([date, d]) => ({
      date,
      ...d,
      totals: sumItems(d.items),
      slots: new Set(d.items.map(i => i.slot).filter(Boolean)),
      weight: weightDays[date] ?? null,
      whoop: whoopDays[date] || null,
      isTraining: !/^rest/i.test(d.training || ''),
    }))
    .sort((a, b) => a.date.localeCompare(b.date)), []);
}

function FuelStat({ label, value, unit, sub, color }) {
  return (
    <div style={styles.fuelStat}>
      <div style={styles.fuelStatLabel}>{label}</div>
      <div style={{ ...styles.fuelStatNum, ...(color ? { color } : {}) }}>
        {value}<span style={styles.fuelStatUnit}>{unit}</span>
      </div>
      {sub && <div style={styles.fuelStatSub}>{sub}</div>}
    </div>
  );
}

// Daily kcal bars against Seb's maintenance band, with the morning
// weigh-in as a line on a right-hand axis. Open (in-progress) days draw
// as a dashed outline so a half-logged day never reads as a low day.
function FuelChart({ days, targets }) {
  const [hoverI, setHoverI] = useState(null);
  const W = 360, H = 128, TOP = 10, BASE = H - 16, PADL = 30, PADR = 32;
  const n = days.length;
  if (!n) return null;
  const maxK = Math.max(3200, Math.ceil(Math.max(...days.map(d => d.totals.kcal)) / 200) * 200);
  const slot = (W - PADL - PADR) / n;
  const bw = Math.max(2, Math.min(22, slot - 3));
  const x = i => PADL + i * slot + (slot - bw) / 2;
  const yK = v => BASE - (v / maxK) * (BASE - TOP);
  const ws = days.map(d => d.weight).filter(v => v != null);
  const wMin = ws.length ? Math.floor(Math.min(...ws) - 0.5) : 0;
  const wMax = ws.length ? Math.ceil(Math.max(...ws) + 0.5) : 1;
  const yW = v => BASE - ((v - wMin) / (wMax - wMin || 1)) * (BASE - TOP);
  let path = '';
  let pen = false;
  days.forEach((d, i) => {
    if (d.weight == null) { pen = false; return; }
    path += `${pen ? ' L' : ' M'}${(x(i) + bw / 2).toFixed(1)},${yW(d.weight).toFixed(1)}`;
    pen = true;
  });
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (W / rect.width);
    setHoverI(Math.max(0, Math.min(n - 1, Math.floor((px - PADL) / slot))));
  };
  const kTicks = [1000, 2000, 3000].filter(t => t < maxK);
  const labelEvery = Math.max(1, Math.ceil(n / 16));
  const bandTop = yK(targets.kcalHigh);
  const bandH = yK(targets.kcalLow) - bandTop;
  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseMove={onMove}
        onMouseLeave={() => setHoverI(null)}
      >
        <rect x={PADL} y={bandTop} width={W - PADL - PADR} height={bandH} fill={COLORS.accent} opacity="0.10" />
        {[targets.kcalLow, targets.kcalHigh].map(v => (
          <line key={v} x1={PADL} y1={yK(v)} x2={W - PADR} y2={yK(v)} stroke={COLORS.accent} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        ))}
        {kTicks.map(t => (
          <g key={t}>
            <line x1={PADL} y1={yK(t)} x2={W - PADR} y2={yK(t)} stroke={COLORS.border} strokeWidth="1" opacity="0.55" />
            <text x={PADL - 5} y={yK(t) + 2.5} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="8" fill={COLORS.textMute}>{t / 1000}k</text>
          </g>
        ))}
        <line x1={PADL} y1={BASE} x2={W - PADR} y2={BASE} stroke={COLORS.border} strokeWidth="1" />
        {days.map((d, i) => (
          <rect
            key={d.date}
            x={x(i)}
            y={yK(d.totals.kcal)}
            width={bw}
            height={Math.max(0, BASE - yK(d.totals.kcal))}
            rx="2"
            fill={d.closed ? COLORS.accent : 'transparent'}
            stroke={COLORS.accent}
            strokeWidth={d.closed ? 0 : 1}
            strokeDasharray={d.closed ? undefined : '2 2'}
            opacity={hoverI == null || hoverI === i ? (d.closed ? 0.9 : 0.75) : 0.4}
          />
        ))}
        {path && <path d={path} fill="none" stroke={COLORS.text} strokeWidth="1.6" strokeLinejoin="round" />}
        {days.map((d, i) => d.weight != null && (
          <circle key={`w${d.date}`} cx={x(i) + bw / 2} cy={yW(d.weight)} r="2.6" fill={COLORS.bg} stroke={COLORS.text} strokeWidth="1.4" />
        ))}
        {ws.length > 0 && [wMin, wMax].map(v => (
          <text key={`wt${v}`} x={W - PADR + 5} y={yW(v) + 2.5} fontFamily="JetBrains Mono, monospace" fontSize="8" fill={COLORS.textMute}>{v}kg</text>
        ))}
        {days.map((d, i) => i % labelEvery === 0 && (
          <text key={`l${d.date}`} x={x(i) + bw / 2} y={H - 4} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fill={COLORS.textMute}>{shortDay(d.date)}</text>
        ))}
      </svg>
      {hoverI != null && (
        <div
          style={{
            ...styles.sparkTooltip,
            left: `${((x(hoverI) + bw / 2) / W) * 100}%`,
            transform: x(hoverI) > W * 0.6 ? 'translateX(-100%)' : 'none',
          }}
        >
          {formatDayDate(days[hoverI].date)} · {days[hoverI].totals.kcal.toLocaleString()} kcal
          {days[hoverI].weight != null ? ` · ${days[hoverI].weight.toFixed(1)}kg` : ''}
          {days[hoverI].closed ? '' : ' · so far'}
        </div>
      )}
    </div>
  );
}

// The long view: every morning weigh-in since the 103kg peak.
function WeightJourney() {
  const [open, setOpen] = useState(false);
  const pts = useMemo(() => Object.entries(weightDays).sort((a, b) => a[0].localeCompare(b[0])), []);
  if (pts.length < 2) return null;
  const first = pts[0];
  const last = pts[pts.length - 1];
  const peak = pts.reduce((m, p) => (p[1] > m[1] ? p : m), pts[0]);
  const low = pts.reduce((m, p) => (p[1] < m[1] ? p : m), pts[0]);
  const delta = last[1] - peak[1];
  const W = 360, H = 90, PADL = 6, PADR = 36, TOP = 8, BASE = H - 14;
  const t0 = Date.parse(first[0]);
  const t1 = Date.parse(last[0]);
  const x = d => PADL + ((Date.parse(d) - t0) / (t1 - t0 || 1)) * (W - PADL - PADR);
  const yLo = low[1] - 1;
  const yHi = peak[1] + 1;
  const y = v => BASE - ((v - yLo) / (yHi - yLo)) * (BASE - TOP);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(' ');
  const labels = [];
  let lastMonth = null;
  for (const p of pts) {
    const m = p[0].slice(0, 7);
    if (m === lastMonth) continue;
    lastMonth = m;
    const d = new Date(p[0]);
    if (d.getMonth() % 3 === 0) labels.push([p[0], d.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })]);
  }
  return (
    <section style={styles.trendsPanel}>
      <button type="button" onClick={() => setOpen(o => !o)} style={styles.fuelJourneyBar} aria-expanded={open}>
        <span style={{ ...styles.filterLabel, marginBottom: 0 }}>Weight since the peak</span>
        <span style={styles.fuelJourneyDelta}>{delta.toFixed(1)} kg</span>
        <span style={styles.trendsSub}>{peak[1]}kg {formatDayDate(peak[0])} → {last[1]}kg {formatDayDate(last[0])}</span>
        <ChevronDown size={14} style={{ marginLeft: 'auto', flexShrink: 0, color: COLORS.textDim, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s ease' }} />
      </button>
      {open && (
        <div style={{ ...styles.trendCell, marginTop: 12 }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <line x1={PADL} y1={BASE} x2={W - PADR} y2={BASE} stroke={COLORS.border} strokeWidth="1" />
            <path d={path} fill="none" stroke={COLORS.accent} strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx={x(last[0])} cy={y(last[1])} r="3" fill={COLORS.accent} />
            <text x={x(last[0]) + 6} y={y(last[1]) + 3} fontFamily="JetBrains Mono, monospace" fontSize="8" fill={COLORS.text}>{last[1]}</text>
            <text x={x(peak[0]) + 5} y={y(peak[1]) + 3} fontFamily="JetBrains Mono, monospace" fontSize="8" fill={COLORS.textDim}>{peak[1]}</text>
            {labels.map(([d, l]) => (
              <text key={d} x={x(d)} y={H - 3} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="7" fill={COLORS.textMute}>{l}</text>
            ))}
          </svg>
          <div style={styles.trendsSub}>renpho scale, first weigh-in of each day · {pts.length} readings</div>
        </div>
      )}
    </section>
  );
}

function FuelDay({ day, targets, open, onToggle }) {
  const t = day.totals;
  const inBand = t.kcal >= targets.kcalLow && t.kcal <= targets.kcalHigh;
  const kcalColor = !day.closed ? COLORS.textDim : inBand ? BAND_OK : BAND_OFF;
  const checks = day.isTraining ? ['pre', 'intra', 'post', 'veg', 'fruit'] : ['veg', 'fruit'];
  const nums = (v) => (
    <span style={styles.fuelItemNums}>
      <b style={styles.fuelItemKcal}>{Math.round(v.kcal).toLocaleString()}</b>
      <span>P{Math.round(v.p)} C{Math.round(v.c)} F{Math.round(v.f)} Fb{Math.round(v.fibre)}</span>
    </span>
  );
  return (
    <section style={styles.daySection}>
      <button
        type="button"
        className="day-header"
        onClick={onToggle}
        style={{ ...styles.dayHeader, background: DAY_BANNERS.fuel }}
        aria-expanded={open}
      >
        <span style={styles.dayHeaderInner}>
          <span style={styles.dayLabel}>{formatDayDate(day.date)}</span>
          <span style={styles.daySep}>·</span>
          <span style={styles.dayDate}>{day.training}</span>
          <span style={{ ...styles.fuelKcal, color: kcalColor }}>
            {t.kcal.toLocaleString()}<span style={styles.fuelKcalUnit}> kcal{day.closed ? '' : ' so far'}</span>
          </span>
          <span style={styles.fuelMacros}>P {Math.round(t.p)} · C {Math.round(t.c)} · F {Math.round(t.f)} · Fb {Math.round(t.fibre)}</span>
          {day.fluidsMl > 0 && <span style={styles.dayCount}>{(day.fluidsMl / 1000).toFixed(1)}L</span>}
          {day.whoop && day.whoop.recovery != null && (
            <span style={styles.recoveryPill}>
              <span style={{ ...styles.recoveryDot, background: recoveryColor(day.whoop.recovery) }} />
              {day.whoop.recovery}%
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          className="day-chevron"
          style={{ marginLeft: 'auto', flexShrink: 0, alignSelf: 'center', color: COLORS.textDim, transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 0.18s ease, color 0.15s ease' }}
        />
      </button>
      {open && (
        <>
          <div style={styles.fuelAdherence}>
            <span style={styles.whoopTag}>Protocol</span>
            {checks.map(s => {
              const ok = day.slots.has(s);
              return (
                <span key={s} style={{ ...styles.fuelAdhItem, color: ok ? COLORS.text : COLORS.textMute, borderColor: ok ? COLORS.accent : COLORS.border }}>
                  {ok ? '✓' : '·'} {SLOT_LABELS[s]}
                </span>
              );
            })}
            {day.weight != null && (
              <span style={{ ...styles.whoopStat, marginLeft: 'auto' }}>
                <span style={styles.whoopStatLabel}>Weight</span>
                <span style={styles.whoopStatValue}>{day.weight.toFixed(1)} kg</span>
              </span>
            )}
          </div>
          {day.whoop && <WhoopStrip data={day.whoop} />}
          <div style={styles.fuelItems}>
            {day.items.map((it, i) => {
              const slot = it.slot && it.slot !== 'supp' ? it.slot : null;
              return (
                <div key={i} style={{ ...styles.fuelItem, ...(slot ? styles.fuelItemSlot : {}) }}>
                  <span style={styles.fuelItemName}>
                    {slot && <span style={styles.fuelSlotTag}>{SLOT_LABELS[slot]}</span>}
                    {slot ? cleanItemName(it.name) : it.name}
                  </span>
                  {nums(it)}
                </div>
              );
            })}
            <div style={{ ...styles.fuelItem, ...styles.fuelItemTotal }}>
              <span style={styles.fuelItemName}>{day.closed ? 'Day total' : 'Running total'}</span>
              {nums(t)}
            </div>
          </div>
          {day.note && (
            <div style={styles.dayNote}>
              <div style={styles.dayNoteLabel}>Session note</div>
              <div style={styles.dayNoteBody}>{day.note}</div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function FuelPage() {
  const days = useFuelDays();
  const targets = nutrition.targets;
  const [range, setRange] = useState('all');
  const [openDays, setOpenDays] = useState(() => new Set(days.slice(-1).map(d => d.date)));
  const weightSeries = useMemo(() => Object.entries(weightDays).sort((a, b) => a[0].localeCompare(b[0])), []);
  if (days.length === 0) return null;

  const closed = days.filter(d => d.closed);
  const last7 = closed.slice(-7);
  const avg = f => (last7.length ? last7.reduce((s, d) => s + f(d), 0) / last7.length : null);
  const avgK = avg(d => d.totals.kcal);
  const avgP = avg(d => d.totals.p);
  const avgC = avg(d => d.totals.c);
  const avgFb = avg(d => d.totals.fibre);
  const avgFl = avg(d => d.fluidsMl) / 1000;
  const mean = a => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  const wNow = mean(weightSeries.slice(-7).map(e => e[1]));
  const wBefore = mean(weightSeries.slice(-14, -7).map(e => e[1]));
  const wDelta = wNow != null && wBefore != null ? wNow - wBefore : null;
  const inBand = avgK != null && avgK >= targets.kcalLow && avgK <= targets.kcalHigh;
  const bandWord = avgK == null ? null : inBand ? 'inside band' : avgK < targets.kcalLow ? 'below band' : 'above band';

  const rangeDays = range === 'all' ? days : days.slice(-(range === '2w' ? 14 : 28));
  const newestFirst = days.slice().reverse();
  const toggleDay = date => setOpenDays(prev => {
    const next = new Set(prev);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    return next;
  });

  return (
    <div>
      <section style={styles.trendsPanel}>
        <div style={styles.coachSectionHead}>
          <span style={styles.filterLabel}>Fuel</span>
          <span style={styles.trendsSub}>last {last7.length} closed days · seb's band {targets.kcalLow.toLocaleString()}–{targets.kcalHigh.toLocaleString()} kcal</span>
        </div>
        <div style={styles.fuelStatRow}>
          {avgK != null && <FuelStat label="Avg intake" value={Math.round(avgK).toLocaleString()} unit="kcal" color={inBand ? BAND_OK : BAND_OFF} sub={bandWord} />}
          {avgC != null && <FuelStat label="Carbs" value={Math.round(avgC)} unit="g" sub={`heading to ~${targets.carbsG}`} />}
          {avgP != null && <FuelStat label="Protein" value={Math.round(avgP)} unit="g" sub={`trim toward ~${targets.proteinG}`} />}
          {avgFb != null && <FuelStat label="Fibre" value={Math.round(avgFb)} unit="g" sub={`goal ${targets.fibreLowG}–${targets.fibreHighG}`} />}
          {avgFl != null && <FuelStat label="Fluids" value={avgFl.toFixed(1)} unit="L" sub="incl. protein waters + gatorade" />}
          {wNow != null && (
            <FuelStat
              label="Weight, 7d avg"
              value={wNow.toFixed(1)}
              unit="kg"
              color={wDelta != null && Math.abs(wDelta) < 0.5 ? BAND_OK : undefined}
              sub={wDelta == null ? null : Math.abs(wDelta) < 0.05 ? 'flat vs previous 7d' : `${wDelta > 0 ? '+' : ''}${wDelta.toFixed(1)} vs previous 7d`}
            />
          )}
        </div>
      </section>

      <section style={styles.trendsPanel}>
        <div style={{ ...styles.coachSectionHead, flexWrap: 'wrap' }}>
          <span style={{ ...styles.filterLabel, whiteSpace: 'nowrap' }}>Intake vs weight</span>
          <span style={styles.trendsSub}>bars: kcal · shaded: seb's band · line: morning weight</span>
          <span style={styles.fuelRangeRow}>
            {['2w', '4w', 'all'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                style={{ ...styles.fuelRangeBtn, ...(range === r ? styles.fuelRangeBtnActive : {}) }}
              >
                {r}
              </button>
            ))}
          </span>
        </div>
        <div style={{ ...styles.trendCell, maxWidth: 760 }}>
          <FuelChart days={rangeDays} targets={targets} />
        </div>
      </section>

      <WeightJourney />

      <section style={styles.trendsPanel}>
        <div style={styles.coachSectionHead}>
          <span style={styles.filterLabel}>Days</span>
          <span style={styles.trendsSub}>newest first · open a day for every item</span>
        </div>
        <div style={styles.fuelDayList}>
          {newestFirst.map(d => (
            <FuelDay key={d.date} day={d} targets={targets} open={openDays.has(d.date)} onToggle={() => toggleDay(d.date)} />
          ))}
        </div>
      </section>
    </div>
  );
}

// Instagram-style feed: a tight grid of video thumbnails (newest first);
// tapping a tile opens a single-set post view with caption + comments.
function FeedPage() {
  const [activePost, setActivePost] = useState(null);
  const posts = useMemo(() => (
    videos
      .filter(v => v.youtubeId)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
  ), []);
  useEffect(() => {
    document.body.style.overflow = activePost ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [activePost]);
  return (
    <div>
      <div style={styles.feedGrid}>
        {posts.map(v => (
          <button
            key={v.id}
            type="button"
            style={styles.feedTile}
            onClick={() => setActivePost(v)}
            aria-label={v.title}
          >
            <img
              src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`}
              alt=""
              style={styles.feedTileImg}
              loading="lazy"
              onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
            />
            <span style={styles.feedTileOverlay}>
              <span style={styles.feedTileWeight}>{v.weight}kg</span>
              <span style={styles.feedTileLift}>{LIFT_LABELS[v.lift] || v.lift}</span>
            </span>
          </button>
        ))}
      </div>
      {activePost && <PostModal video={activePost} onClose={() => setActivePost(null)} />}
    </div>
  );
}

function PostModal({ video, onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.modalClose} aria-label="Close">
          <X size={18} />
        </button>
        <div style={styles.postHead}>
          <span style={styles.cardLift}>{LIFT_LABELS[video.lift] || video.lift}</span>
          <span style={styles.postDate}>{formatDayDate(video.date)}</span>
        </div>
        <div style={styles.postWeightRow}>
          <span style={styles.postWeightNum}>{video.weight}</span>
          <span style={styles.postWeightUnit}>kg</span>
          {video.bodyweight && (
            <span style={styles.postBwPct}>{Math.round((video.weight / video.bodyweight) * 100)}% BW</span>
          )}
        </div>
        <div style={video.vertical ? styles.modalVideoWrapVertical : styles.modalVideoWrap}>
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}`}
            style={video.vertical ? styles.modalVideoVertical : styles.modalVideo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={video.title}
          />
        </div>
        {video.notes && <p style={styles.postCaption}>{video.notes}</p>}
        <div style={styles.modalTags}>
          {video.tags.map(t => (
            <span key={t} style={styles.modalTag}># {t}</span>
          ))}
        </div>
        <Comments video={video} />
        <a
          href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
          target="_blank"
          rel="noreferrer"
          style={styles.modalDriveLink}
        >
          Open on YouTube
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}

function CrossfitCard({ session }) {
  const [open, setOpen] = useState(false);
  const strengthItems = Array.isArray(session.strength) ? session.strength : (session.strength ? [session.strength] : []);
  return (
    <div style={styles.crossfitCard}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={styles.cfBar}
        aria-expanded={open}
      >
        <div style={styles.cfBarRow}>
          <span style={styles.cfBarPill}>Class</span>
          <span style={styles.cfBarTitle}>
            {(session.metcon && session.metcon.format) || 'Class workout'}
          </span>
          <ChevronDown
            size={15}
            style={{
              marginLeft: 'auto',
              flexShrink: 0,
              color: COLORS.textDim,
              transform: open ? 'none' : 'rotate(-90deg)',
              transition: 'transform 0.18s ease',
            }}
          />
        </div>
        <div style={styles.cfBarMeta}>
          {session.className || 'CrossFit'}
          {session.time && ` · ${session.time}`}
          {strengthItems.length > 0 &&
            ` · ${strengthItems.map(s => s.myWeight ? `${s.name} — ${s.myWeight}` : s.name).join(' · ')}`}
        </div>
      </button>
      {open && (
        <div style={styles.crossfitBody}>
          {strengthItems.length > 0 && (
            <div style={styles.crossfitSection}>
              <div style={styles.crossfitSectionLabel}>Strength</div>
              {strengthItems.map((s, i) => (
                <div key={i} style={styles.crossfitStrengthRow}>
                  <div style={styles.crossfitStrengthName}>{s.name}{s.myWeight && <span style={styles.crossfitMyWeight}> · {s.myWeight}</span>}</div>
                  {s.scheme && <div style={styles.crossfitStrengthScheme}>{s.scheme}</div>}
                </div>
              ))}
            </div>
          )}
          {session.metcon && (
            <div style={styles.crossfitSection}>
              <div style={styles.crossfitSectionLabel}>Metcon{session.metcon.format ? ` · ${session.metcon.format}` : ''}</div>
              {session.metcon.details && <div style={styles.crossfitMetconBody}>{session.metcon.details}</div>}
              {(session.metcon.scoreType || session.metcon.timeCap) && (
                <div style={styles.crossfitMetconMeta}>
                  {session.metcon.scoreType && <span>Score: {session.metcon.scoreType}</span>}
                  {session.metcon.timeCap && <span> · Time cap: {session.metcon.timeCap}</span>}
                </div>
              )}
            </div>
          )}
          {session.accessories && session.accessories.length > 0 && (
            <div style={styles.crossfitSection}>
              <div style={styles.crossfitSectionLabel}>Accessories</div>
              <ul style={styles.crossfitAccessoryList}>
                {session.accessories.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
          {session.notes && (
            <div style={styles.crossfitSection}>
              <div style={styles.crossfitSectionLabel}>Notes</div>
              <div style={styles.crossfitNotes}>{session.notes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SnatchLifter() {
  // Three failed snatch attempts to mid-thigh, then one clean overhead lock.
  // Pure CSS keyframes on the arms+bar group; cartoonish anatomy on purpose.
  return (
    <div style={styles.snatchAnim} aria-hidden="true">
      <svg viewBox="0 0 60 70" width="72" height="84">
        <line x1="6" y1="64" x2="54" y2="64" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />

        {/* Standing legs (faded out on the success catch) */}
        <g className="snatch-legs-standing">
          <line x1="30" y1="44" x2="25" y2="60" stroke="currentColor" strokeWidth="1.5" />
          <line x1="30" y1="44" x2="35" y2="60" stroke="currentColor" strokeWidth="1.5" />
        </g>

        {/* Squat legs: hip near feet, knees pushed wide, shins angle to fixed feet */}
        <g className="snatch-legs-squat">
          <line x1="30" y1="56" x2="18" y2="56" stroke="currentColor" strokeWidth="1.5" />
          <line x1="18" y1="56" x2="25" y2="60" stroke="currentColor" strokeWidth="1.5" />
          <line x1="30" y1="56" x2="42" y2="56" stroke="currentColor" strokeWidth="1.5" />
          <line x1="42" y1="56" x2="35" y2="60" stroke="currentColor" strokeWidth="1.5" />
        </g>

        {/* Upper body + arms/bar: drops on the success catch */}
        <g className="snatch-upper">
          <circle cx="30" cy="20" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <line x1="30" y1="23.5" x2="30" y2="44" stroke="currentColor" strokeWidth="1.5" />
          <g className="snatch-bar-group">
            <line x1="30" y1="28" x2="20" y2="52" stroke="currentColor" strokeWidth="1.4" />
            <line x1="30" y1="28" x2="40" y2="52" stroke="currentColor" strokeWidth="1.4" />
            <line x1="12" y1="52" x2="48" y2="52" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="52" r="2.6" fill="currentColor" />
            <circle cx="48" cy="52" r="2.6" fill="currentColor" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function parseWeekTag(weekTag) {
  // "week-12-c1" -> [12, 1]; "week-12" -> [12, 0]
  const parts = weekTag.split('-');
  const week = parseInt(parts[1], 10);
  const cycle = parts[2] && /^c\d+$/i.test(parts[2]) ? parseInt(parts[2].slice(1), 10) : 0;
  return [week, cycle];
}

function formatWeek(weekTag) {
  // "week-12" -> "Week 12"; "week-12-c1" -> "Week 12 — C1"
  const parts = weekTag.split('-');
  const n = parts[1] || '';
  const cycle = parts[2];
  if (cycle && /^c\d+$/i.test(cycle)) {
    return `Week ${n} — ${cycle.toUpperCase()}`;
  }
  return `Week ${n}`;
}

function formatCycle(cycleTag) {
  const n = cycleTag.slice('cycle-'.length);
  return `Cycle ${n}`;
}

const LOCATION_LABELS = {
  'loc-brunswick': 'Brunswick',
  'loc-altona': 'Altona',
  'loc-brians': "Brian's",
};

function formatLocation(locTag) {
  if (LOCATION_LABELS[locTag]) return LOCATION_LABELS[locTag];
  const name = locTag.slice('loc-'.length);
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function formatCommentDate(s) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: '2-digit' });
}

function formatGroupDate(s) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function formatDayDate(s) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

function GroupModal({ group, onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const date = new Date(group.date);
  const dateStr = date.toLocaleDateString('en-AU', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const top = group.videos[0];
  const setCount = group.videos.length;
  const heroVideo = group.videos.find(v => v.youtubeId);

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ ...styles.modalClose, zIndex: 2 }} aria-label="Close">
          <X size={18} />
        </button>

        {heroVideo ? (
          <div style={styles.modalHero}>
            <img
              src={`https://i.ytimg.com/vi/${heroVideo.youtubeId}/hqdefault.jpg`}
              alt=""
              style={styles.cardHeroImg}
              onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
            />
            <div style={styles.cardHeroShade} />
            <div style={styles.modalHeroText}>
              <div style={styles.modalHeroName}>{LIFT_LABELS[group.lift] || group.lift}</div>
              <div style={styles.modalHeroWeight}>
                {top.weight}<span style={styles.modalHeroUnit}>kg top</span>
              </div>
              <div style={styles.modalHeroMeta}>
                {setCount} {setCount === 1 ? 'set' : 'sets'}
                {top.bodyweight && top.weight > 0 && ` · ${Math.round((top.weight / top.bodyweight) * 100)}% bodyweight`}
                {` · ${dateStr}`}
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.modalHeader}>
            <div style={styles.modalLift}>{LIFT_LABELS[group.lift] || group.lift}</div>
            <div style={styles.modalWeight}>
              <span style={styles.modalWeightNum}>{top.weight}</span>
              <span style={styles.modalWeightUnit}>kg top</span>
            </div>
            <h2 style={styles.modalTitle}>{setCount} {setCount === 1 ? 'set' : 'sets'}</h2>
            <div style={styles.modalDate}>
              <Calendar size={13} style={{ marginRight: 6, opacity: 0.6 }} />
              {dateStr}
            </div>
          </div>
        )}

        <div style={styles.setList}>
          {group.videos.map((v, i) => (
            <SetSection
              key={v.id}
              video={v}
              setNumber={setCount - i}
              totalSets={setCount}
              isFirst={i === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SetSection({ video, setNumber, totalSets, isFirst }) {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <section style={{ ...styles.setSection, ...(isFirst ? styles.setSectionFirst : {}) }}>
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        style={styles.setHeader}
        aria-expanded={!collapsed}
      >
        <div style={styles.setThumb}>
          {video.youtubeId ? (
            <img
              src={`https://i.ytimg.com/vi/${video.youtubeId}/default.jpg`}
              alt=""
              style={styles.setThumbImg}
              loading="lazy"
              onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
            />
          ) : (
            <Play size={14} style={{ color: COLORS.textMute, opacity: 0.5 }} />
          )}
        </div>
        <div style={styles.setHeadText}>
          <div style={styles.setIndex}>Set {setNumber} of {totalSets}</div>
          <div style={styles.setHeadRow}>
            <span style={styles.setWeightNum}>{video.weight}</span>
            <span style={styles.setWeightUnit}>kg</span>
            {video.bodyweight && (
              <span style={styles.setBwPct}>{Math.round((video.weight / video.bodyweight) * 100)}% BW</span>
            )}
          </div>
        </div>
        <ChevronDown
          size={16}
          style={{
            marginLeft: 'auto',
            color: COLORS.textDim,
            transform: collapsed ? 'rotate(-90deg)' : 'none',
            transition: 'transform 0.18s ease',
          }}
        />
      </button>

      {!collapsed && (
        <>
          {video.youtubeId ? (
            <div style={video.vertical ? styles.modalVideoWrapVertical : styles.modalVideoWrap}>
              <iframe
                src={`https://www.youtube.com/embed/${video.youtubeId}`}
                style={video.vertical ? styles.modalVideoVertical : styles.modalVideo}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title={video.title}
              />
            </div>
          ) : (
            <div style={styles.modalNoVideo}>Logged · no video for this set</div>
          )}

          {video.notes && (
            <div style={styles.modalNotes}>
              <div style={styles.modalNotesLabel}>Notes</div>
              <div style={styles.modalNotesBody}>{video.notes}</div>
            </div>
          )}

          {video.youtubeId && <Comments video={video} />}

          <div style={styles.modalTags}>
            {video.tags.map(t => (
              <span key={t} style={styles.modalTag}># {t}</span>
            ))}
          </div>

          {video.youtubeId && (
            <a
              href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
              target="_blank"
              rel="noreferrer"
              style={styles.modalDriveLink}
            >
              Open on YouTube
              <ExternalLink size={13} />
            </a>
          )}
        </>
      )}
    </section>
  );
}

const COLORS = {
  bg: '#0A0908',
  surface: '#141210',
  surfaceLift: '#1B1815',
  border: '#2A2622',
  borderStrong: '#3A332D',
  text: '#F0E9DC',
  textDim: '#9A938A',
  textMute: '#6B6660',
  accent: '#E94E1B',
  accentDim: '#7A2A0E',
  // Cool complement to the warm orange accent; used for CrossFit / class
  // workout surfaces so they read as a distinct concept from OWL lifts.
  accentCool: '#2DB6C4',
};

const FONTS = {
  display: '"Big Shoulders Display", Impact, sans-serif',
  body: '"Geist", -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

const globalCss = `
  * { box-sizing: border-box; }
  html { scrollbar-gutter: stable; }
  body { margin: 0; overflow-x: hidden; }
  .lift-card { transition: border-color 0.15s ease, transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease; }
  .lift-card:hover { border-color: ${COLORS.borderStrong}; background: ${COLORS.surfaceLift}; transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35); }
  .lift-card-accessory:hover { border-color: ${COLORS.accent}; background: #221c18; }
  .lift-card:active { transform: scale(0.99); }
  .day-header:hover { filter: brightness(1.12); }
  .day-header:hover .day-chevron { color: #fff; }
  button:focus-visible { outline: 2px solid ${COLORS.accent}; outline-offset: 2px; }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
  ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: ${COLORS.borderStrong}; }
  input::placeholder { color: ${COLORS.textMute}; }
  input:focus { outline: none; }

  .snatch-bar-group {
    transform-box: view-box;
    transform-origin: 30px 28px;
    animation: snatch-attempts 14s ease-in-out infinite;
  }
  .snatch-upper {
    transform-box: view-box;
    transform-origin: 30px 44px;
    animation: snatch-upper 14s ease-in-out infinite;
  }
  .snatch-legs-squat { opacity: 0; }
  .snatch-legs-standing {
    animation: snatch-legs-standing 14s ease-in-out infinite;
  }
  .snatch-legs-squat {
    animation: snatch-legs-squat 14s ease-in-out infinite;
  }
  @keyframes snatch-upper {
    0%, 62%  { transform: translateY(0); }
    72%      { transform: translateY(12px); }
    88%      { transform: translateY(12px); }
    96%      { transform: translateY(0); }
    100%     { transform: translateY(0); }
  }
  @keyframes snatch-legs-standing {
    0%, 66%  { opacity: 1; }
    70%, 90% { opacity: 0; }
    95%      { opacity: 1; }
    100%     { opacity: 1; }
  }
  @keyframes snatch-legs-squat {
    0%, 66%  { opacity: 0; }
    70%, 90% { opacity: 1; }
    95%      { opacity: 0; }
    100%     { opacity: 0; }
  }
  @keyframes snatch-attempts {
    /* Attempt 1: fail to mid-thigh */
    0%, 4%   { transform: translate(0, 0) rotateX(0deg); }
    7%       { transform: translate(0, -2px) rotateX(0deg); }
    10%      { transform: translate(0, -13px) rotateX(0deg); }
    12%      { transform: translate(0, -10px) rotateX(0deg); }
    15%      { transform: translate(0, 2px) rotateX(0deg); }
    17%, 22% { transform: translate(0, 0) rotateX(0deg); }

    /* Attempt 2: fail */
    25%      { transform: translate(0, -2px) rotateX(0deg); }
    28%      { transform: translate(0, -13px) rotateX(0deg); }
    30%      { transform: translate(0, -10px) rotateX(0deg); }
    33%      { transform: translate(0, 2px) rotateX(0deg); }
    35%, 40% { transform: translate(0, 0) rotateX(0deg); }

    /* Attempt 3: fail */
    43%      { transform: translate(0, -2px) rotateX(0deg); }
    46%      { transform: translate(0, -13px) rotateX(0deg); }
    48%      { transform: translate(0, -11px) rotateX(0deg); }
    51%      { transform: translate(0, 2px) rotateX(0deg); }
    53%, 58% { transform: translate(0, 0) rotateX(0deg); }

    /* Attempt 4: SUCCESS — flip overhead in place */
    62%      { transform: translate(0, -8px) rotateX(0deg); }
    70%      { transform: translate(0, 0) rotateX(180deg); }
    88%      { transform: translate(0, 0) rotateX(180deg); }
    100%     { transform: translate(0, 0) rotateX(360deg); }
  }
`;

const styles = {
  root: {
    minHeight: '100vh',
    background: COLORS.bg,
    color: COLORS.text,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 1.5,
    paddingBottom: 80,
  },
  header: {
    borderBottom: `1px solid ${COLORS.border}`,
    padding: '44px 24px 32px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  intro: {
    margin: '14px 0 0',
    maxWidth: 520,
    fontSize: 15,
    lineHeight: 1.55,
    color: COLORS.textDim,
  },
  snatchAnim: {
    color: COLORS.textDim,
    opacity: 0.7,
    pointerEvents: 'none',
    flexShrink: 0,
  },
  headerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 24,
    flexWrap: 'wrap',
  },
  eyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: COLORS.accent,
    marginBottom: 8,
  },
  title: {
    fontFamily: FONTS.display,
    fontWeight: 800,
    fontSize: 'clamp(40px, 7vw, 72px)',
    lineHeight: 0.9,
    margin: 0,
    letterSpacing: '-0.02em',
  },
  headerStats: {
    display: 'flex',
    gap: 32,
  },
  stat: {
    textAlign: 'right',
  },
  statNum: {
    fontFamily: FONTS.mono,
    fontSize: 28,
    fontWeight: 500,
    color: COLORS.text,
    lineHeight: 1,
  },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: COLORS.textMute,
    marginTop: 6,
  },
  filterBar: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '28px 24px 14px',
    display: 'flex',
    gap: 14,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchWrap: {
    position: 'relative',
    flex: '1 1 280px',
    maxWidth: 480,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: COLORS.textMute,
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '11px 36px 11px 36px',
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    color: COLORS.text,
    fontFamily: FONTS.body,
    fontSize: 13,
  },
  searchClear: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: COLORS.textDim,
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
  },
  filterToggle: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    padding: '10px 14px',
    borderRadius: 6,
    fontFamily: FONTS.body,
    fontSize: 13,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  clearAll: {
    background: 'none',
    border: 'none',
    color: COLORS.accent,
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    padding: '10px 4px',
  },
  filterPanel: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '8px 24px 24px',
  },
  filterGroup: {
    marginBottom: 22,
  },
  filterLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: COLORS.textMute,
    marginBottom: 10,
  },
  filterSectionToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    background: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    textAlign: 'left',
    color: COLORS.text,
  },
  filterSectionCount: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: COLORS.accent,
    marginBottom: 10,
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  liftCategories: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  liftCategory: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  liftCategoryLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: COLORS.textMute,
    opacity: 0.7,
  },
  chip: {
    background: 'transparent',
    border: `1px solid ${COLORS.border}`,
    color: COLORS.textDim,
    padding: '7px 14px',
    borderRadius: 999,
    fontFamily: FONTS.body,
    fontSize: 12.5,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  chipActive: {
    background: COLORS.accent,
    borderColor: COLORS.accent,
    color: '#fff',
    boxShadow: '0 4px 14px rgba(233, 78, 27, 0.28)',
  },
  main: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '32px 24px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))',
    gap: 8,
  },
  days: {
    display: 'flex',
    flexDirection: 'column',
    gap: 44,
  },
  weekSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  weekDivider: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px 18px',
    marginTop: 16,
    marginBottom: 6,
  },
  weekDividerLabel: {
    fontFamily: FONTS.display,
    fontSize: 22,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: COLORS.accent,
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  weekStats: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: '0.04em',
    color: COLORS.textDim,
    minWidth: 0,
  },
  weekDividerLine: {
    flex: 1,
    minWidth: 60,
    height: 1,
    background: `linear-gradient(90deg, ${COLORS.accent} 0%, ${COLORS.border} 70%, transparent 100%)`,
  },
  daySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  dayNote: {
    background: COLORS.surfaceLift,
    border: `1px solid ${COLORS.border}`,
    borderLeft: `3px solid ${COLORS.accent}`,
    borderRadius: 6,
    padding: '12px 16px',
  },
  recoveryPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textDim,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  },
  recoveryDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    display: 'inline-block',
    flexShrink: 0,
  },
  whoopStrip: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: '10px 22px',
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: '12px 16px',
  },
  whoopTag: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: COLORS.textMute,
    marginRight: 4,
  },
  whoopStat: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: 7,
    whiteSpace: 'nowrap',
  },
  whoopStatLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: COLORS.textMute,
  },
  whoopStatValue: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.text,
  },
  whoopStatSub: {
    fontWeight: 400,
    fontSize: 11,
    color: COLORS.textDim,
  },
  viewTabs: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '18px 24px 0',
    display: 'flex',
    gap: 4,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  viewTab: {
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: COLORS.textDim,
    padding: '10px 14px',
    fontFamily: FONTS.mono,
    fontSize: 12,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    marginBottom: -1,
  },
  viewTabActive: {
    color: COLORS.text,
    borderBottomColor: COLORS.accent,
  },
  coachSectionHead: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 14,
  },
  trendsPanel: {
    marginBottom: 44,
  },
  noteGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
    gap: 18,
    alignItems: 'start',
  },
  noteCard: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderLeft: `3px solid ${COLORS.accent}`,
    borderRadius: 10,
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  noteLift: {
    fontFamily: FONTS.display,
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
    color: COLORS.accent,
    lineHeight: 1,
  },
  noteBody: {
    fontSize: 13.5,
    lineHeight: 1.65,
    color: COLORS.textDim,
  },
  maxBoard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    padding: '18px 20px',
    maxWidth: 720,
  },
  maxRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  maxRowHead: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    flexWrap: 'wrap',
  },
  maxRowLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.text,
  },
  maxRowMeta: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.06em',
    color: COLORS.textMute,
  },
  maxRowValue: {
    marginLeft: 'auto',
    fontFamily: FONTS.mono,
    fontSize: 15,
    fontWeight: 600,
    color: COLORS.text,
    whiteSpace: 'nowrap',
  },
  maxRowPrev: {
    fontWeight: 400,
    fontSize: 12,
    color: COLORS.textMute,
  },
  maxRowUnit: {
    fontWeight: 400,
    fontSize: 11,
    color: COLORS.textDim,
    marginLeft: 2,
  },
  maxTrack: {
    position: 'relative',
    height: 10,
    borderRadius: 5,
    background: COLORS.surfaceLift,
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  },
  maxFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    background: `linear-gradient(90deg, ${COLORS.accentDim}, ${COLORS.accent})`,
    borderRadius: 5,
  },
  maxPrevTick: {
    position: 'absolute',
    top: -1,
    bottom: -1,
    width: 2,
    background: COLORS.text,
    opacity: 0.55,
  },
  feedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 4,
  },
  feedTile: {
    position: 'relative',
    padding: 0,
    border: 'none',
    background: COLORS.surface,
    aspectRatio: '3 / 4',
    overflow: 'hidden',
    borderRadius: 4,
    cursor: 'pointer',
    display: 'block',
  },
  feedTileImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  feedTileOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: '20px 8px 7px',
    background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    textAlign: 'left',
    minWidth: 0,
  },
  feedTileWeight: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    flexShrink: 0,
  },
  feedTileLift: {
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    letterSpacing: '0.04em',
    color: 'rgba(255, 255, 255, 0.75)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  postHead: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 10,
    paddingRight: 44,
  },
  postDate: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textMute,
  },
  postWeightRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 14,
  },
  postWeightNum: {
    fontFamily: FONTS.display,
    fontWeight: 800,
    fontSize: 44,
    lineHeight: 0.9,
    letterSpacing: '-0.02em',
    color: COLORS.text,
  },
  postWeightUnit: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.textDim,
  },
  postBwPct: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textMute,
    marginLeft: 6,
  },
  postCaption: {
    margin: '0 0 14px',
    fontSize: 14,
    lineHeight: 1.55,
    color: COLORS.text,
  },
  trendsSub: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.06em',
    color: COLORS.textMute,
    textTransform: 'lowercase',
  },
  trendsGrid: {
    marginTop: 14,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 14,
  },
  trendCell: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    padding: '14px 16px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  trendCellHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  trendCellLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: COLORS.textMute,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  trendCellValue: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.text,
    whiteSpace: 'nowrap',
  },
  trendDelta: {
    fontSize: 11,
    fontWeight: 500,
    marginLeft: 6,
  },
  sparkTooltip: {
    position: 'absolute',
    top: -6,
    background: COLORS.surfaceLift,
    border: `1px solid ${COLORS.borderStrong}`,
    borderRadius: 5,
    padding: '3px 8px',
    fontFamily: FONTS.mono,
    fontSize: 10.5,
    color: COLORS.text,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: 2,
  },
  crossfitCard: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderLeft: `3px solid ${COLORS.accentCool}`,
    borderRadius: 8,
    overflow: 'hidden',
  },
  crossfitHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '12px 16px',
    background: 'transparent',
    borderTop: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    borderLeft: 'none',
    cursor: 'pointer',
    color: COLORS.text,
    fontFamily: FONTS.body,
    textAlign: 'left',
  },
  cfBar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    width: '100%',
    padding: '12px 14px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    color: COLORS.text,
    fontFamily: FONTS.body,
  },
  cfBarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  cfBarPill: {
    flexShrink: 0,
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: COLORS.accentCool,
    border: '1px solid rgba(45, 182, 196, 0.45)',
    padding: '2px 7px',
    borderRadius: 999,
  },
  cfBarTitle: {
    fontFamily: FONTS.display,
    fontWeight: 700,
    fontSize: 17,
    lineHeight: 1.15,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
    color: COLORS.text,
  },
  cfBarMeta: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.04em',
    lineHeight: 1.6,
    color: COLORS.textMute,
  },
  crossfitTag: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#fff',
    background: COLORS.accentCool,
    padding: '3px 8px',
    borderRadius: 4,
  },
  crossfitTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: COLORS.text,
  },
  crossfitTime: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.textDim,
  },
  crossfitBody: {
    padding: '4px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  crossfitSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  crossfitSectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: COLORS.textMute,
  },
  crossfitStrengthRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  crossfitStrengthName: {
    fontSize: 14,
    fontWeight: 500,
    color: COLORS.text,
  },
  crossfitMyWeight: {
    fontFamily: FONTS.mono,
    fontWeight: 400,
    color: COLORS.accentCool,
  },
  crossfitStrengthScheme: {
    fontSize: 13,
    color: COLORS.textDim,
    lineHeight: 1.5,
  },
  crossfitMetconBody: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap',
  },
  crossfitMetconMeta: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textMute,
  },
  crossfitAccessoryList: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 13,
    color: COLORS.textDim,
    lineHeight: 1.6,
  },
  crossfitNotes: {
    fontSize: 13,
    color: COLORS.textDim,
    lineHeight: 1.55,
  },
  dayNoteLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: COLORS.textMute,
    marginBottom: 6,
  },
  dayNoteBody: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 1.55,
  },
  dayHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
    width: '100%',
    paddingLeft: 16,
    paddingRight: 14,
    paddingTop: 15,
    paddingBottom: 15,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    cursor: 'pointer',
    color: COLORS.text,
    fontFamily: FONTS.body,
    textAlign: 'left',
    transition: 'filter 0.15s ease',
  },
  dayHeaderInner: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: '6px 12px',
    flex: 1,
    minWidth: 0,
  },
  dayCount: {
    fontFamily: FONTS.mono,
    color: COLORS.textMute,
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
  },
  dayLabel: {
    fontFamily: FONTS.display,
    fontWeight: 800,
    fontSize: 24,
    letterSpacing: '0.01em',
    lineHeight: 1,
    textTransform: 'uppercase',
    color: '#fff',
  },
  daySep: {
    color: COLORS.textMute,
    opacity: 0.4,
    fontSize: 14,
  },
  dayDate: {
    fontFamily: FONTS.mono,
    color: COLORS.textDim,
    fontSize: 12,
    letterSpacing: '0.04em',
  },
  groups: {
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 8,
    borderBottom: `1px solid ${COLORS.border}`,
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  groupLift: {
    color: COLORS.accent,
    fontWeight: 600,
  },
  groupWeight: {
    color: COLORS.text,
    fontWeight: 500,
  },
  groupDate: {
    color: COLORS.textDim,
  },
  groupSets: {
    color: COLORS.textMute,
  },
  groupSep: {
    color: COLORS.textMute,
    opacity: 0.5,
  },
  card: {
    textAlign: 'left',
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: 12,
    cursor: 'pointer',
    color: COLORS.text,
    fontFamily: FONTS.body,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHero: {
    position: 'relative',
    margin: '-12px -12px 0',
    height: 150,
    background: '#000',
    overflow: 'hidden',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  cardHeroImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    opacity: 0.92,
  },
  cardHeroShade: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(rgba(0, 0, 0, 0.15), transparent 25%, transparent 40%, rgba(0, 0, 0, 0.88))',
  },
  cardHeroText: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 9,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  cardHeroName: {
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    lineHeight: 1.5,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  cardHeroWeight: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
    fontFamily: FONTS.display,
    fontWeight: 800,
    fontSize: 30,
    lineHeight: 1,
    letterSpacing: '-0.02em',
    color: '#fff',
  },
  cardHeroUnit: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardHeroBwLine: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: '0.06em',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  cardHeroSets: {
    position: 'absolute',
    right: 8,
    top: 8,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#fff',
    background: 'rgba(0, 0, 0, 0.55)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    padding: '3px 7px',
    borderRadius: 999,
  },
  cardLift: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: COLORS.accent,
  },
  cardDate: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textMute,
  },
  cardWeight: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
    margin: '4px 0',
  },
  cardWeightNum: {
    fontFamily: FONTS.display,
    fontWeight: 800,
    fontSize: 56,
    lineHeight: 0.9,
    letterSpacing: '-0.02em',
    color: COLORS.text,
  },
  cardWeightUnit: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.textDim,
    marginLeft: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: COLORS.text,
  },
  cardBwPct: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: '0.06em',
    color: COLORS.textDim,
    marginTop: -4,
  },
  cardSetMeta: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textDim,
    letterSpacing: '0.04em',
  },
  cardSetMetaSecondary: {
    color: COLORS.textMute,
  },
  cardFooter: {
    marginTop: 8,
    paddingTop: 12,
    borderTop: `1px solid ${COLORS.border}`,
    display: 'flex',
    alignItems: 'center',
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: COLORS.accent,
  },
  cardAccessory: {
    padding: 12,
    gap: 7,
    background: COLORS.surfaceLift,
    borderColor: COLORS.borderStrong,
  },
  cardLiftAccessory: {
    color: COLORS.textDim,
  },
  cardWeightAccessoryNum: {
    fontSize: 38,
  },
  cardFooterAccessory: {
    color: COLORS.textDim,
  },
  cardLogged: {
    cursor: 'default',
    opacity: 0.85,
  },
  cardLoggedFooter: {
    marginTop: 8,
    paddingTop: 12,
    borderTop: `1px solid ${COLORS.border}`,
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: COLORS.textMute,
  },
  accessoryBlock: {
    marginTop: 14,
  },
  accessoryLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: COLORS.textMute,
    marginBottom: 12,
  },
  accessoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 8,
  },
  setList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  setSection: {
    paddingTop: 28,
    marginTop: 28,
    borderTop: `1px solid ${COLORS.border}`,
  },
  setSectionFirst: {
    paddingTop: 0,
    marginTop: 0,
    borderTop: 'none',
  },
  setHeader: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    width: '100%',
    background: 'transparent',
    borderTop: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    borderLeft: 'none',
    padding: 0,
    marginBottom: 14,
    color: COLORS.text,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  modalHero: {
    position: 'relative',
    margin: 'calc(clamp(18px, 4vw, 32px) * -1) calc(clamp(18px, 4vw, 32px) * -1) 20px',
    height: 210,
    background: '#000',
    overflow: 'hidden',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalHeroText: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  modalHeroName: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    lineHeight: 1.5,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  modalHeroWeight: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    fontFamily: FONTS.display,
    fontWeight: 800,
    fontSize: 52,
    lineHeight: 0.95,
    letterSpacing: '-0.02em',
    color: '#fff',
  },
  modalHeroUnit: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modalHeroMeta: {
    fontFamily: FONTS.mono,
    fontSize: 10.5,
    letterSpacing: '0.05em',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  setThumb: {
    width: 72,
    height: 54,
    borderRadius: 6,
    overflow: 'hidden',
    background: COLORS.surfaceLift,
    border: `1px solid ${COLORS.border}`,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setThumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  setHeadText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },
  setHeadRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 5,
  },
  setIndex: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: COLORS.textMute,
  },
  setWeight: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: 3,
  },
  setWeightNum: {
    fontFamily: FONTS.display,
    fontWeight: 800,
    fontSize: 26,
    lineHeight: 0.9,
    letterSpacing: '-0.02em',
    color: COLORS.text,
  },
  setWeightUnit: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.textDim,
  },
  setBwPct: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textDim,
    letterSpacing: '0.06em',
  },
  setTitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text,
  },
  cardNotes: {
    fontSize: 11,
    color: COLORS.textDim,
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  cardTag: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMute,
    padding: '3px 8px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 4,
  },
  empty: {
    textAlign: 'center',
    padding: '80px 24px',
  },
  emptyTitle: {
    fontFamily: FONTS.display,
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 8,
  },
  emptySub: {
    color: COLORS.textDim,
    marginBottom: 20,
  },
  emptyBtn: {
    background: COLORS.accent,
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 6,
    fontFamily: FONTS.body,
    fontSize: 13,
    cursor: 'pointer',
  },
  footer: {
    maxWidth: 1200,
    margin: '60px auto 0',
    padding: '20px 24px',
    borderTop: `1px solid ${COLORS.border}`,
  },
  footerText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: COLORS.textMute,
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.92)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    padding: '24px 16px',
  },
  modal: {
    position: 'relative',
    width: '100%',
    maxWidth: 880,
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    padding: 'clamp(18px, 4vw, 32px)',
    margin: 'auto',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: COLORS.surfaceLift,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    width: 36,
    height: 36,
    borderRadius: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    marginBottom: 20,
    paddingRight: 40,
  },
  modalLift: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: COLORS.accent,
    marginBottom: 12,
  },
  modalWeight: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  modalWeightNum: {
    fontFamily: FONTS.display,
    fontWeight: 800,
    fontSize: 'clamp(56px, 10vw, 96px)',
    lineHeight: 0.9,
    letterSpacing: '-0.03em',
    color: COLORS.text,
  },
  modalWeightUnit: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.textDim,
  },
  modalTitle: {
    fontFamily: FONTS.body,
    fontSize: 18,
    fontWeight: 500,
    margin: '4px 0 8px',
    color: COLORS.text,
  },
  modalDate: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.textDim,
    display: 'inline-flex',
    alignItems: 'center',
  },
  modalVideoWrap: {
    background: '#000',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  modalVideo: {
    width: '100%',
    aspectRatio: '16 / 9',
    border: 'none',
    display: 'block',
  },
  modalVideoWrapVertical: {
    background: '#000',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
    marginLeft: 'auto',
    marginRight: 'auto',
    width: 'min(360px, 100%)',
  },
  modalVideoVertical: {
    width: '100%',
    aspectRatio: '9 / 16',
    border: 'none',
    display: 'block',
  },
  modalNoVideo: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: COLORS.textMute,
    border: `1px dashed ${COLORS.border}`,
    borderRadius: 6,
    padding: '14px 16px',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalNotes: {
    background: COLORS.surfaceLift,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: 14,
    marginBottom: 16,
  },
  modalNotesLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: COLORS.textMute,
    marginBottom: 6,
  },
  modalNotesBody: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 1.6,
  },
  commentsBlock: {
    background: COLORS.surfaceLift,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: 14,
    marginBottom: 16,
  },
  commentsHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
  },
  commentsCount: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMute,
  },
  commentsEmpty: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textMute,
  },
  commentsList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  comment: {
    paddingTop: 10,
    borderTop: `1px solid ${COLORS.border}`,
  },
  commentMeta: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 4,
  },
  commentAuthor: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: '0.06em',
    color: COLORS.accent,
  },
  commentDate: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMute,
  },
  commentBody: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 1.55,
  },
  commentsError: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: '#E94E1B',
    marginBottom: 10,
  },
  commentForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTop: `1px solid ${COLORS.border}`,
  },
  commentInputName: {
    width: '100%',
    padding: '9px 12px',
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    color: COLORS.text,
    fontFamily: FONTS.body,
    fontSize: 13,
  },
  commentInputBody: {
    width: '100%',
    padding: '9px 12px',
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    color: COLORS.text,
    fontFamily: FONTS.body,
    fontSize: 13,
    resize: 'vertical',
    minHeight: 70,
  },
  commentSubmit: {
    alignSelf: 'flex-end',
    background: COLORS.accent,
    color: '#fff',
    border: 'none',
    padding: '9px 16px',
    borderRadius: 6,
    fontFamily: FONTS.body,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  },
  commentSubmitDisabled: {
    background: COLORS.borderStrong,
    color: COLORS.textMute,
    cursor: 'not-allowed',
  },
  modalTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  modalTag: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textDim,
    padding: '4px 10px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 4,
  },
  modalDriveLink: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: COLORS.accent,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  // ---- Fuel tab ----
  fuelStatRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 12,
  },
  fuelStat: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    padding: '14px 16px',
  },
  fuelStatLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: COLORS.textMute,
    marginBottom: 8,
  },
  fuelStatNum: {
    fontFamily: FONTS.display,
    fontWeight: 800,
    fontSize: 34,
    lineHeight: 1,
    color: COLORS.text,
  },
  fuelStatUnit: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: 400,
    color: COLORS.textDim,
    marginLeft: 5,
    letterSpacing: '0.04em',
  },
  fuelStatSub: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMute,
    marginTop: 8,
    letterSpacing: '0.04em',
  },
  fuelRangeRow: {
    marginLeft: 'auto',
    display: 'inline-flex',
    gap: 4,
  },
  fuelRangeBtn: {
    background: 'transparent',
    border: `1px solid ${COLORS.border}`,
    color: COLORS.textDim,
    borderRadius: 999,
    padding: '3px 10px',
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  fuelRangeBtnActive: {
    background: COLORS.accent,
    borderColor: COLORS.accent,
    color: '#fff',
  },
  fuelJourneyBar: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: '6px 12px',
    width: '100%',
    background: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    textAlign: 'left',
  },
  fuelJourneyDelta: {
    fontFamily: FONTS.display,
    fontWeight: 800,
    fontSize: 26,
    lineHeight: 1,
    color: COLORS.accent,
  },
  fuelDayList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  fuelKcal: {
    fontFamily: FONTS.mono,
    fontSize: 15,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  fuelKcalUnit: {
    fontSize: 10,
    fontWeight: 400,
    color: COLORS.textDim,
    letterSpacing: '0.06em',
  },
  fuelMacros: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textDim,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  },
  fuelAdherence: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 8,
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: '10px 14px',
  },
  fuelAdhItem: {
    fontFamily: FONTS.mono,
    fontSize: 10.5,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    border: '1px solid',
    borderRadius: 4,
    padding: '3px 8px',
    whiteSpace: 'nowrap',
  },
  fuelItems: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fuelItem: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '4px 14px',
    padding: '9px 14px',
    borderBottom: `1px solid ${COLORS.border}`,
    fontSize: 13.5,
    color: COLORS.text,
  },
  fuelItemSlot: {
    boxShadow: `inset 3px 0 0 ${COLORS.accent}`,
  },
  fuelItemTotal: {
    borderBottom: 'none',
    background: COLORS.surfaceLift,
    fontWeight: 600,
  },
  fuelItemName: {
    flex: '1 1 220px',
    minWidth: 0,
    lineHeight: 1.4,
  },
  fuelSlotTag: {
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: COLORS.accent,
    marginRight: 8,
  },
  fuelItemNums: {
    display: 'inline-flex',
    alignItems: 'baseline',
    marginLeft: 'auto',
    gap: 10,
    fontFamily: FONTS.mono,
    fontSize: 10.5,
    color: COLORS.textMute,
    whiteSpace: 'nowrap',
    letterSpacing: '0.02em',
  },
  fuelItemKcal: {
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.text,
  },
};
