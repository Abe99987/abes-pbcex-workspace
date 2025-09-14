import { DCACadence } from '../entities/dca-rule.entity';
import { logInfo, logError } from '@/utils/logger';

/**
 * Schedule Service
 * Handles timezone-aware DCA rule scheduling with DST support
 */
export class ScheduleService {
  private static readonly SCHED_TZ = process.env.SCHED_TZ || 'America/New_York';

  /**
   * Compute next run time for a DCA rule
   * Handles daily/weekly/monthly cadence with DST-safe conversion
   */
  static computeNextRunAt(
    cadence: DCACadence,
    startDate: Date,
    executionTimeUtc: string,
    monthlyDay?: number,
    nowUtc?: Date
  ): Date {
    const now = nowUtc || new Date();
    const [hours, minutes] = executionTimeUtc.split(':').map(Number);

    try {
      // Convert execution time from ET to UTC for the given date
      const nextExecution = ScheduleService.getNextExecutionDate(
        cadence,
        startDate,
        now,
        monthlyDay
      );

      // Set the execution time (already in UTC from conversion)
      nextExecution.setUTCHours(hours || 14, minutes || 0, 0, 0);

      // Ensure we don't schedule in the past
      if (nextExecution <= now) {
        return ScheduleService.getNextExecutionDate(
          cadence,
          nextExecution,
          now,
          monthlyDay
        );
      }

      logInfo('Next run calculated', {
        cadence,
        startDate: startDate.toISOString(),
        executionTimeUtc,
        monthlyDay,
        nextRunAt: nextExecution.toISOString(),
      });

      return nextExecution;
    } catch (error) {
      logError('Failed to compute next run time', error as Error);
      // Fallback to simple calculation
      return ScheduleService.fallbackNextRunAt(
        cadence,
        startDate,
        executionTimeUtc
      );
    }
  }

  /**
   * Convert 10:00 ET to UTC for a specific date (DST-aware)
   */
  static convertETtoUTC(
    date: Date,
    etHour: number = 10,
    etMinute: number = 0
  ): Date {
    try {
      // Create a date in ET timezone
      const etDate = new Date(date);
      etDate.setHours(etHour, etMinute, 0, 0);

      // Use Intl.DateTimeFormat to handle DST conversion
      const etString = etDate.toLocaleString('en-US', {
        timeZone: ScheduleService.SCHED_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      // Parse back to get UTC equivalent
      const [datePart, timePart] = etString.split(', ');
      const [month, day, year] = (datePart || '1/1/2024').split('/');
      const [hour, minute, second] = (timePart || '14:00:00').split(':');

      const utcDate = new Date(
        parseInt(year || '2024'),
        parseInt(month || '1') - 1,
        parseInt(day || '1'),
        parseInt(hour || '14'),
        parseInt(minute || '0'),
        parseInt(second || '0')
      );

      // Convert to UTC by getting the timezone offset
      const offsetMs = utcDate.getTimezoneOffset() * 60 * 1000;
      return new Date(utcDate.getTime() + offsetMs);
    } catch (error) {
      logError('ET to UTC conversion failed', error as Error);
      // Fallback: assume EST (UTC-5)
      const utcDate = new Date(date);
      utcDate.setUTCHours((etHour || 10) + 5, etMinute || 0, 0, 0); // EST offset
      return utcDate;
    }
  }

  /**
   * Get next execution date based on cadence
   */
  private static getNextExecutionDate(
    cadence: DCACadence,
    fromDate: Date,
    nowUtc: Date,
    monthlyDay?: number
  ): Date {
    const nextDate = new Date(fromDate);

    switch (cadence) {
      case 'daily':
        // If start date is in the past, start from tomorrow
        if (fromDate <= nowUtc) {
          nextDate.setUTCDate(nowUtc.getUTCDate() + 1);
        }
        break;

      case 'weekly':
        // Find next occurrence of the same day of week
        if (fromDate <= nowUtc) {
          const daysUntilNext =
            7 - ((nowUtc.getUTCDay() - fromDate.getUTCDay() + 7) % 7);
          nextDate.setUTCDate(nowUtc.getUTCDate() + daysUntilNext);
        }
        break;

      case 'monthly': {
        const targetDay = monthlyDay || 1;

        // Start from current month if start date is in past
        if (fromDate <= nowUtc) {
          nextDate.setUTCFullYear(
            nowUtc.getUTCFullYear(),
            nowUtc.getUTCMonth(),
            targetDay
          );

          // If target day has passed this month, go to next month
          if (nextDate <= nowUtc) {
            nextDate.setUTCMonth(nextDate.getUTCMonth() + 1, targetDay);
          }
        } else {
          // Use start date's month but with target day
          nextDate.setUTCDate(targetDay);
        }

        // Handle month-end edge cases (e.g., Feb 30 -> Feb 28)
        if (nextDate.getUTCDate() !== targetDay) {
          nextDate.setUTCDate(0); // Last day of previous month
        }
        break;
      }

      default:
        // Default to daily
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    }

    return nextDate;
  }

  /**
   * Fallback calculation for when timezone conversion fails
   */
  private static fallbackNextRunAt(
    cadence: DCACadence,
    startDate: Date,
    executionTimeUtc: string
  ): Date {
    const [hours, minutes] = executionTimeUtc.split(':').map(Number);
    const nextDate = new Date(startDate);
    nextDate.setUTCHours(hours || 14, minutes || 0, 0, 0);

    const now = new Date();

    // Simple increment if in the past
    while (nextDate <= now) {
      switch (cadence) {
        case 'daily':
          nextDate.setUTCDate(nextDate.getUTCDate() + 1);
          break;
        case 'weekly':
          nextDate.setUTCDate(nextDate.getUTCDate() + 7);
          break;
        case 'monthly':
          nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
          break;
      }
    }

    return nextDate;
  }

  /**
   * Check if a date falls on a weekend
   */
  static isWeekend(date: Date): boolean {
    const day = date.getUTCDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  /**
   * Check if a date is a US market holiday (basic implementation)
   */
  static isHoliday(date: Date): boolean {
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();

    // Basic US holidays (can be expanded)
    const holidays = [
      { month: 1, day: 1 }, // New Year's Day
      { month: 7, day: 4 }, // Independence Day
      { month: 12, day: 25 }, // Christmas Day
    ];

    return holidays.some(
      holiday => holiday.month === month && holiday.day === day
    );
  }

  /**
   * Get execution time display in ET for UI
   */
  static getExecutionTimeET(utcTime: string, date: Date): string {
    try {
      const [hours, minutes] = utcTime.split(':').map(Number);
      const utcDate = new Date(date);
      utcDate.setUTCHours(hours || 14, minutes || 0, 0, 0);

      // Convert to ET for display
      const etTime = utcDate.toLocaleString('en-US', {
        timeZone: ScheduleService.SCHED_TZ,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      return etTime;
    } catch (error) {
      logError('Failed to convert UTC to ET for display', error as Error);
      return utcTime; // Fallback to UTC
    }
  }
}
