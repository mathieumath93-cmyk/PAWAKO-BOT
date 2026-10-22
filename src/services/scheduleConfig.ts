/**
 * Schedule Configuration and Computation for PAWAKO FORMATION
 *
 * Official Hours Specification:
 * - À compter du lundi 26/10/2026 :
 *   • Formation Outils : 09h00 – 13h00 HF, du lundi au vendredi (début de session à 09h00 HF).
 *   • Simulations : 13h00 – 17h00 HF, du lundi au vendredi (début de session à 13h00 HF).
 *   • Week-end : Aucune session le samedi et le dimanche.
 *
 * - Application automatique dès le vendredi 23/10/2026 :
 *   • Dès le vendredi 23/10/2026, toute convocation créée ou envoyée pour une session prévue le lundi 26/10/2026
 *     ou ultérieurement utilise automatiquement les nouveaux horaires (09h00 et 13h00 HF).
 *   • Les sessions antérieures au 26/10/2026 conservent leurs anciens horaires (10h00-14h00 HF et 14h00-18h00 HF).
 */

import { Member } from '../types';

/**
 * Returns exact epoch timestamp for a specific target year, month (0-indexed), day, hour, minute in Europe/Paris.
 * Correctly accounts for Daylight Saving Time (DST / changement d'heure) transitions (e.g. 25 Oct 2026 CEST -> CET).
 */
export function getParisEpoch(year: number, monthIndex: number, day: number, hour: number, minute: number = 0): number {
  const approx = new Date(Date.UTC(year, monthIndex, day, hour, minute));
  const parisStr = approx.toLocaleString('en-US', { timeZone: 'Europe/Paris', hour12: false });
  const match = parisStr.match(/(\d+)\/(\d+)\/(\d+),\s+(\d+):(\d+):(\d+)/);
  if (!match) return approx.getTime();

  let pHour = parseInt(match[4], 10);
  if (pHour === 24) pHour = 0;
  const pMinute = parseInt(match[5], 10);

  const targetMinutes = hour * 60 + minute;
  const actualMinutes = pHour * 60 + pMinute;
  const diffMinutes = targetMinutes - actualMinutes;

  return approx.getTime() + diffMinutes * 60 * 1000;
}

/**
 * Checks whether a given Date or timestamp falls on or after Monday, October 26, 2026 in Europe/Paris timezone.
 */
export function isNewScheduleDate(input: Date | number): boolean {
  const d = typeof input === 'number' ? new Date(input) : input;
  const parisString = d.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
  const p = new Date(parisString);

  const y = p.getFullYear();
  const m = p.getMonth(); // 0-indexed: 9 = October
  const day = p.getDate();

  return y > 2026 || (y === 2026 && (m > 9 || (m === 9 && day >= 26)));
}

/**
 * Returns the official start hour and range for Tools Formation based on the target session date.
 */
export function getToolsFormationScheduleInfo(targetDate: Date | number): {
  startHour: number;
  endHour: number;
  startHourStr: string;
  rangeStr: string;
} {
  const isNew = isNewScheduleDate(targetDate);
  if (isNew) {
    return {
      startHour: 9,
      endHour: 13,
      startHourStr: '09h00',
      rangeStr: '09h00–13h00',
    };
  }
  return {
    startHour: 10,
    endHour: 14,
    startHourStr: '10h00',
    rangeStr: '10h00–14h00',
  };
}

/**
 * Returns the official start hour and range for Simulations based on the target session date.
 */
export function getSimulationScheduleInfo(targetDate: Date | number): {
  startHour: number;
  endHour: number;
  startHourStr: string;
  rangeStr: string;
} {
  const isNew = isNewScheduleDate(targetDate);
  if (isNew) {
    return {
      startHour: 13,
      endHour: 17,
      startHourStr: '13h00',
      rangeStr: '13h00–17h00',
    };
  }
  return {
    startHour: 14,
    endHour: 18,
    startHourStr: '14h00',
    rangeStr: '14h00–18h00',
  };
}

/**
 * Calculates epoch timestamp and schedule details for the next Simulation session (Europe/Paris timezone).
 * - Mon-Fri only (Saturday 6 & Sunday 0 are excluded).
 * - If current time in Paris is before the cutoff on a weekday, returns today's session.
 * - Otherwise advances to the next weekday.
 * - Dynamically applies:
 *   • 14h00 for sessions prior to 26/10/2026.
 *   • 13h00 for sessions on or after 26/10/2026 (including sessions created from Friday 23/10 for Monday 26/10).
 */
export function getSimulationScheduleDetails(fromDate: Date = new Date()): {
  timestamp: number;
  isToday: boolean;
  formattedDate: string;
  hour: number;
  hourStr: string;
  rangeStr: string;
} {
  const parisString = fromDate.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
  const parisDate = new Date(parisString);

  const currentDay = parisDate.getDay();
  const isWeekday = currentDay !== 0 && currentDay !== 6;

  if (isWeekday) {
    const info = getSimulationScheduleInfo(parisDate);
    const todayCutoff = new Date(parisDate);
    todayCutoff.setHours(info.startHour, 0, 0, 0);

    if (parisDate.getTime() < todayCutoff.getTime()) {
      const ts = getParisEpoch(parisDate.getFullYear(), parisDate.getMonth(), parisDate.getDate(), info.startHour, 0);
      return {
        timestamp: ts,
        isToday: true,
        formattedDate: todayCutoff.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }),
        hour: info.startHour,
        hourStr: info.startHourStr,
        rangeStr: info.rangeStr,
      };
    }
  }

  // Advance to next open weekday (skip Saturday & Sunday)
  const targetParis = new Date(parisDate);
  targetParis.setDate(targetParis.getDate() + 1);
  while (targetParis.getDay() === 0 || targetParis.getDay() === 6) {
    targetParis.setDate(targetParis.getDate() + 1);
  }

  const info = getSimulationScheduleInfo(targetParis);
  const ts = getParisEpoch(targetParis.getFullYear(), targetParis.getMonth(), targetParis.getDate(), info.startHour, 0);

  return {
    timestamp: ts,
    isToday: false,
    formattedDate: targetParis.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
    hour: info.startHour,
    hourStr: info.startHourStr,
    rangeStr: info.rangeStr,
  };
}

/**
 * Calculates epoch timestamp for the next Tools Formation session (Europe/Paris timezone).
 * - Mon-Fri only (Saturday & Sunday excluded).
 * - Prior to 26/10/2026: 10h00 HF.
 * - On or after 26/10/2026: 09h00 HF.
 * - Automatically schedules for Monday 26/10 at 09h00 HF if triggered from Friday 23/10 afternoon.
 */
export function getNextToolsFormationTimestamp(fromDate: Date = new Date()): number {
  const parisString = fromDate.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
  const parisDate = new Date(parisString);

  const currentDay = parisDate.getDay();
  const isWeekday = currentDay !== 0 && currentDay !== 6;

  if (isWeekday) {
    const info = getToolsFormationScheduleInfo(parisDate);
    const todayCutoff = new Date(parisDate);
    todayCutoff.setHours(info.startHour, 0, 0, 0);

    if (parisDate.getTime() < todayCutoff.getTime()) {
      return getParisEpoch(parisDate.getFullYear(), parisDate.getMonth(), parisDate.getDate(), info.startHour, 0);
    }
  }

  // Advance to next open weekday
  const targetParis = new Date(parisDate);
  targetParis.setDate(targetParis.getDate() + 1);
  while (targetParis.getDay() === 0 || targetParis.getDay() === 6) {
    targetParis.setDate(targetParis.getDate() + 1);
  }

  const info = getToolsFormationScheduleInfo(targetParis);
  return getParisEpoch(targetParis.getFullYear(), targetParis.getMonth(), targetParis.getDate(), info.startHour, 0);
}

/**
 * Parses French date/time strings with dynamic default hours:
 * - If target date is on/after 26/10/2026: default is 13h (simu) or 9h (tools).
 * - If target date is before 26/10/2026: default is 14h (simu) or 10h (tools).
 * - Preserves explicit hours entered by user (e.g. 15h00).
 */
export function parseFrenchDateTimeInputWithContext(
  inputStr: string,
  isTools: boolean = false,
  referenceDate: Date = new Date()
): number | null {
  if (!inputStr || !inputStr.trim()) return null;
  const raw = inputStr.trim().toLowerCase();

  const parisString = referenceDate.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
  const pDate = new Date(parisString);

  let targetYear = pDate.getFullYear();
  let targetMonth = pDate.getMonth();
  let targetDay = pDate.getDate();
  let explicitHour: number | null = null;
  let targetMinute = 0;
  let matchedDate = false;

  if (raw.includes('demain')) {
    const nextDay = new Date(pDate);
    nextDay.setDate(nextDay.getDate() + 1);
    targetYear = nextDay.getFullYear();
    targetMonth = nextDay.getMonth();
    targetDay = nextDay.getDate();
    matchedDate = true;
  } else if (raw.includes("aujourd'hui") || raw.includes("aujourdhui") || raw.includes("ce jour")) {
    targetYear = pDate.getFullYear();
    targetMonth = pDate.getMonth();
    targetDay = pDate.getDate();
    matchedDate = true;
  }

  const dateMatch = raw.match(/(\d{1,2})[\/\-\.](?:(\d{1,2})[\/\-\.])?(\d{2,4})?/);
  if (dateMatch) {
    const isoMatch = raw.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (isoMatch) {
      targetYear = parseInt(isoMatch[1], 10);
      targetMonth = parseInt(isoMatch[2], 10) - 1;
      targetDay = parseInt(isoMatch[3], 10);
      matchedDate = true;
    } else {
      const day = parseInt(dateMatch[1], 10);
      const monthStr = dateMatch[2];
      const yearStr = dateMatch[3];

      if (day >= 1 && day <= 31) {
        targetDay = day;
        if (monthStr) {
          targetMonth = parseInt(monthStr, 10) - 1;
        }
        if (yearStr) {
          targetYear = yearStr.length === 2 ? 2000 + parseInt(yearStr, 10) : parseInt(yearStr, 10);
        }
        matchedDate = true;
      }
    }
  }

  const timeMatch = raw.match(/(\d{1,2})h(\d{1,2})?/) || raw.match(/(\d{1,2}):(\d{1,2})/);
  if (timeMatch) {
    const h = parseInt(timeMatch[1], 10);
    const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      explicitHour = h;
      targetMinute = m;
    }
  }

  const provisionalDate = new Date(targetYear, targetMonth, targetDay, 12, 0, 0, 0);
  const isTargetNewSchedule = isNewScheduleDate(provisionalDate);

  let defaultHour: number;
  if (isTools) {
    defaultHour = isTargetNewSchedule ? 9 : 10;
  } else {
    defaultHour = isTargetNewSchedule ? 13 : 14;
  }

  const targetHour = explicitHour !== null ? explicitHour : defaultHour;

  if (!matchedDate) {
    const checkToday = new Date(pDate);
    checkToday.setHours(targetHour, targetMinute, 0, 0);
    if (pDate.getTime() >= checkToday.getTime()) {
      checkToday.setDate(checkToday.getDate() + 1);
    }
    targetYear = checkToday.getFullYear();
    targetMonth = checkToday.getMonth();
    targetDay = checkToday.getDate();
  }

  return getParisEpoch(targetYear, targetMonth, targetDay, targetHour, targetMinute);
}

/**
 * Safely updates any pre-existing appointments scheduled on or after 26/10/2026
 * to the new hours (14h -> 13h, 10h -> 09h).
 * - Leaves sessions prior to 26/10/2026 strictly unchanged.
 * - Preserves candidate progression, state, and prevents double reminder notifications.
 */
export function adjustScheduledAppointmentsForNewSchedule(members: Member[]): {
  updatedCount: number;
  details: string[];
} {
  let updatedCount = 0;
  const details: string[] = [];

  for (const m of members) {
    let modified = false;

    // 1. Simulation session check
    if (m.simulationScheduledTimestamp) {
      const d = new Date(m.simulationScheduledTimestamp);
      if (isNewScheduleDate(d)) {
        const pStr = d.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
        const pDate = new Date(pStr);
        if (pDate.getHours() === 14) {
          // Adjust from 14h00 to 13h00 on the same date
          const newTs = getParisEpoch(pDate.getFullYear(), pDate.getMonth(), pDate.getDate(), 13, 0);
          m.simulationScheduledTimestamp = newTs;
          modified = true;
          details.push(`Simulation de ${m.username} le ${pDate.toLocaleDateString('fr-FR')} ajustée de 14h00 à 13h00 HF.`);
        }
      }
    }

    // 2. Tools Formation session check
    if (m.toolsFormationScheduledTimestamp) {
      const d = new Date(m.toolsFormationScheduledTimestamp);
      if (isNewScheduleDate(d)) {
        const pStr = d.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
        const pDate = new Date(pStr);
        if (pDate.getHours() === 10) {
          // Adjust from 10h00 to 09h00 on the same date
          const newTs = getParisEpoch(pDate.getFullYear(), pDate.getMonth(), pDate.getDate(), 9, 0);
          m.toolsFormationScheduledTimestamp = newTs;
          modified = true;
          details.push(`Formation Outils de ${m.username} le ${pDate.toLocaleDateString('fr-FR')} ajustée de 10h00 à 09h00 HF.`);
        }
      }
    }

    if (modified) {
      updatedCount++;
    }
  }

  return { updatedCount, details };
}
