import { useState, useMemo, useEffect } from 'react';
import { Search, X, Calendar, ExternalLink, ChevronDown, Play } from 'lucide-react';
import videos from './videos.json';
import dayNotes from './dayNotes.json';
import crossfitSessions from './crossfitSessions.json';
import { supabase } from './supabase.js';

const LIFT_LABELS = {
  snatch: 'Snatch',
  power_snatch: 'Power Snatch',
  hip_power_snatch_ohs: '2 Hip Power Snatch + 2 OHS',
  drop_snatch: 'Drop Snatch',
  floating_snatch: 'Floating Snatch',
  clean_and_jerk: 'Clean & Jerk',
  pause_off_floor_clean_jerk: 'Pause Off-Floor Clean + 2 Jerks',
  clean: 'Clean',
  pause_above_knee_clean: 'Pause Above-Knee Clean',
  power_clean: 'Power Clean',
  hang_power_clean_push_press: 'Below-the-Knee HPC + PP',
  jerk: 'Jerk',
  behind_neck_jerk: 'Behind-the-Neck Jerk',
  btn_strict_press_snatch_grip: 'BTN Strict Press, Snatch Grip',
  press_in_split: 'Press in Split',
  push_jerk_in_split: 'Push Jerk in Split',
  raised_snatch_deadlift: 'Raised Snatch Deadlift',
  paused_snatch_pull: 'Paused Snatch Pull (BTK + ATK)',
  tempo_clean_grip_deadlift: 'Tempo Clean-Grip Deadlift',
  front_squat: 'Front Squat',
  back_squat: 'Back Squat',
  paused_back_squat: 'Paused Back Squat',
  bulgarian_split_squat: 'Bulgarian Split Squat',
  single_leg_glute_bridge: 'Single-Leg Glute Bridge',
  deadlift: 'Deadlift',
  bb_bent_over_row_supinated: 'BB Bent-Over Row, Supinated',
  dips: 'Dips',
  pull_ups: 'Pull-Ups',
};

// Movement family of each lift, for grouping chips in the Lift filter.
const LIFT_CATEGORIES = {
  snatch: 'snatch',
  power_snatch: 'snatch',
  drop_snatch: 'snatch',
  floating_snatch: 'snatch',
  hip_power_snatch_ohs: 'snatch',
  btn_strict_press_snatch_grip: 'snatch',
  paused_snatch_pull: 'snatch',
  raised_snatch_deadlift: 'snatch',
  clean_and_jerk: 'clean_jerk',
  pause_off_floor_clean_jerk: 'clean_jerk',
  clean: 'clean_jerk',
  power_clean: 'clean_jerk',
  hang_power_clean_push_press: 'clean_jerk',
  pause_above_knee_clean: 'clean_jerk',
  tempo_clean_grip_deadlift: 'clean_jerk',
  jerk: 'clean_jerk',
  behind_neck_jerk: 'clean_jerk',
  press_in_split: 'clean_jerk',
  push_jerk_in_split: 'clean_jerk',
  front_squat: 'squat_pull',
  back_squat: 'squat_pull',
  paused_back_squat: 'squat_pull',
  deadlift: 'squat_pull',
  bb_bent_over_row_supinated: 'squat_pull',
  dips: 'accessory',
  pull_ups: 'accessory',
  bulgarian_split_squat: 'accessory',
  single_leg_glute_bridge: 'accessory',
};

const LIFT_CATEGORY_ORDER = ['snatch', 'clean_jerk', 'squat_pull', 'accessory'];
const LIFT_CATEGORY_LABELS = {
  snatch: 'Snatch',
  clean_jerk: 'Clean & Jerk',
  squat_pull: 'Squat & Pull',
  accessory: 'Accessory',
};

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

export default function App() {
  const [search, setSearch] = useState('');
  const [selectedLifts, setSelectedLifts] = useState(new Set());
  const [selectedWeeks, setSelectedWeeks] = useState(() => {
    // Default to the latest week present in the data, where "latest"
    // means highest cycle, then highest week within that cycle.
    let latest = null;
    let latestCycle = -Infinity;
    let latestWeek = -Infinity;
    for (const v of videos) {
      for (const t of v.tags) {
        if (!t.startsWith('week-')) continue;
        const [w, c] = parseWeekTag(t);
        if (!Number.isFinite(w)) continue;
        if (c > latestCycle || (c === latestCycle && w > latestWeek)) {
          latestCycle = c;
          latestWeek = w;
          latest = t;
        }
      }
    }
    return latest ? new Set([latest]) : new Set();
  });
  const [selectedCycles, setSelectedCycles] = useState(new Set());
  const [selectedLocations, setSelectedLocations] = useState(new Set());
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [selectedClasses, setSelectedClasses] = useState(new Set());
  const [activeGroup, setActiveGroup] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [liftFilterOpen, setLiftFilterOpen] = useState(false);
  // Days are collapsed by default; openDays tracks ones the user has opened.
  const [openDays, setOpenDays] = useState(new Set());

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

      {filtersOpen && (
        <section style={styles.filterPanel}>
          {allWeeks.length > 0 && (
            <div style={styles.filterGroup}>
              <div style={styles.filterLabel}>Week</div>
              <div style={styles.chipRow}>
                {allWeeks.map(week => (
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
              </div>
            </div>
          )}

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
            <div style={styles.filterLabel}>Tag</div>
            <div style={styles.chipRow}>
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
          </div>
        </section>
      )}

      <main style={styles.main}>
        {visibleVideos.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyTitle}>No lifts match.</div>
            <div style={styles.emptySub}>Try clearing a filter or different search term.</div>
            {hasActiveFilters && (
              <button onClick={clearAll} style={styles.emptyBtn}>Reset filters</button>
            )}
          </div>
        ) : (
          <div style={styles.days}>
            {groupedByWeek.map((weekBucket, wi) => (
              <div key={weekBucket.weekKey} style={styles.weekSection}>
                {groupedByWeek.length > 1 && (
                  <div style={styles.weekDivider}>
                    <span style={styles.weekDividerLabel}>
                      {weekBucket.week ? formatWeek(weekBucket.week) : 'No week'}
                    </span>
                    <span style={styles.weekDividerLine} />
                  </div>
                )}
                <div style={styles.days}>
                  {weekBucket.days.map(day => {
              const collapsed = !openDays.has(day.dayKey);
              const totalCards = day.mainGroups.length + day.accessoryGroups.length;
              const noteText = getDayNoteText(day.date);
              const isCrossfitOnly = totalCards === 0 && !!crossfitSessions[day.date];
              return (
                <section key={day.dayKey} style={styles.daySection}>
                  <button
                    type="button"
                    className="day-header"
                    onClick={() => {
                      setOpenDays(prev => {
                        const next = new Set(prev);
                        if (next.has(day.dayKey)) next.delete(day.dayKey);
                        else next.add(day.dayKey);
                        return next;
                      });
                    }}
                    style={{
                      ...styles.dayHeader,
                      borderLeftColor: isCrossfitOnly ? COLORS.accentCool : COLORS.accent,
                    }}
                    aria-expanded={!collapsed}
                  >
                    {day.dayLabel != null && <span style={styles.dayLabel}>Day {day.dayLabel}</span>}
                    {day.dayLabel != null && <span style={styles.daySep}>·</span>}
                    <span style={styles.dayDate}>{formatDayDate(day.date)}</span>
                    {totalCards > 0 ? (
                      <span style={styles.dayCount}>{totalCards} {totalCards === 1 ? 'lift' : 'lifts'}</span>
                    ) : (
                      crossfitSessions[day.date] && (
                        <span style={{ ...styles.dayCount, color: COLORS.accentCool }}>Class only</span>
                      )
                    )}
                    <ChevronDown
                      size={16}
                      className="day-chevron"
                      style={{
                        marginLeft: 'auto',
                        color: COLORS.textDim,
                        transform: collapsed ? 'rotate(-90deg)' : 'none',
                        transition: 'transform 0.18s ease, color 0.15s ease',
                      }}
                    />
                  </button>
                  {!collapsed && (
                    <>
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
            ))}
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
      <div style={styles.cardTop}>
        <div style={{ ...styles.cardLift, ...(accessory ? styles.cardLiftAccessory : {}) }}>
          {LIFT_LABELS[group.lift] || group.lift}
        </div>
        <div style={styles.cardDate}>{dateStr}</div>
      </div>
      {isBodyweight ? (
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
      )}
      <div style={styles.cardSetMeta}>
        <span>{setCount} {setCount === 1 ? 'set' : 'sets'}{reps && !isBodyweight ? ` × ${reps}` : ''}</span>
        {otherWeights.length > 0 && (
          <span style={styles.cardSetMetaSecondary}> · also {otherWeights.join(', ')}kg</span>
        )}
      </div>
      {(top.summary || top.notes) && (
        <div style={styles.cardNotes}>{top.summary || top.notes}</div>
      )}
      <div style={styles.cardTags}>
        {allTags.map(t => (
          <span key={t} style={styles.cardTag}>{t}</span>
        ))}
      </div>
      {hasVideo ? (
        <div style={{ ...styles.cardFooter, ...(accessory ? styles.cardFooterAccessory : {}) }}>
          <Play size={11} style={{ marginRight: 6 }} fill="currentColor" />
          Play {setCount} {setCount === 1 ? 'set' : 'sets'}
        </div>
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

function CrossfitCard({ session }) {
  const [open, setOpen] = useState(false);
  const strengthItems = Array.isArray(session.strength) ? session.strength : (session.strength ? [session.strength] : []);
  return (
    <div style={styles.crossfitCard}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={styles.crossfitHeader}
        aria-expanded={open}
      >
        <span style={styles.crossfitTag}>Class</span>
        <span style={styles.crossfitTitle}>{session.className || 'CrossFit'}</span>
        {session.time && <span style={styles.crossfitTime}>{session.time}</span>}
        <ChevronDown
          size={16}
          style={{
            marginLeft: 'auto',
            color: COLORS.textDim,
            transform: open ? 'none' : 'rotate(-90deg)',
            transition: 'transform 0.18s ease',
          }}
        />
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

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.modalClose} aria-label="Close">
          <X size={18} />
        </button>

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
        <div style={styles.setIndex}>Set {setNumber} of {totalSets}</div>
        <div style={styles.setWeight}>
          <span style={styles.setWeightNum}>{video.weight}</span>
          <span style={styles.setWeightUnit}>kg</span>
        </div>
        {video.bodyweight && (
          <span style={styles.setBwPct}>{Math.round((video.weight / video.bodyweight) * 100)}% BW</span>
        )}
        <div style={styles.setTitle}>{video.title}</div>
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
          <div style={video.vertical ? styles.modalVideoWrapVertical : styles.modalVideoWrap}>
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeId}`}
              style={video.vertical ? styles.modalVideoVertical : styles.modalVideo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title={video.title}
            />
          </div>

          {video.notes && (
            <div style={styles.modalNotes}>
              <div style={styles.modalNotesLabel}>Notes</div>
              <div style={styles.modalNotesBody}>{video.notes}</div>
            </div>
          )}

          <Comments video={video} />

          <div style={styles.modalTags}>
            {video.tags.map(t => (
              <span key={t} style={styles.modalTag}># {t}</span>
            ))}
          </div>

          <a
            href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
            target="_blank"
            rel="noreferrer"
            style={styles.modalDriveLink}
          >
            Open on YouTube
            <ExternalLink size={13} />
          </a>
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
  body { margin: 0; }
  .lift-card { transition: border-color 0.15s ease, transform 0.15s ease, background 0.15s ease; }
  .lift-card:hover { border-color: ${COLORS.borderStrong}; background: ${COLORS.surfaceLift}; }
  .lift-card-accessory:hover { border-color: ${COLORS.accent}; background: #221c18; }
  .lift-card:active { transform: scale(0.99); }
  .day-header:hover { background: ${COLORS.surface}; }
  .day-header:hover .day-chevron { color: ${COLORS.accent}; }
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 18,
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
    gap: 18,
    marginTop: 16,
    marginBottom: 6,
  },
  weekDividerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: COLORS.accent,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  weekDividerLine: {
    flex: 1,
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
    gap: 14,
    width: '100%',
    paddingLeft: 18,
    paddingRight: 14,
    paddingTop: 14,
    paddingBottom: 14,
    background: 'transparent',
    borderTop: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    borderLeft: `3px solid ${COLORS.accent}`,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    cursor: 'pointer',
    color: COLORS.text,
    fontFamily: FONTS.body,
    textAlign: 'left',
    transition: 'background 0.15s ease, border-color 0.15s ease',
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
    fontSize: 26,
    letterSpacing: '-0.01em',
    lineHeight: 1,
    color: COLORS.text,
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
    borderRadius: 10,
    padding: 20,
    cursor: 'pointer',
    color: COLORS.text,
    fontFamily: FONTS.body,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 11,
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
    padding: 14,
    gap: 8,
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 14,
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
    fontSize: 36,
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
    fontSize: 12,
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
    padding: 32,
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
};
