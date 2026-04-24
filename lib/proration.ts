const FULL_TIME_HOURS = 37.5

/**
 * Prorate a leave entitlement based on employment start date and contracted hours.
 * Rounds to the nearest half day.
 */
export function prorateEntitlement(
  fullEntitlement: number,
  startDate: string,
  year: number,
  weeklyHours: number = FULL_TIME_HOURS
): number {
  if (fullEntitlement === 0) return 0

  const partTimeRatio = Math.min(weeklyHours / FULL_TIME_HOURS, 1)

  const start = new Date(startDate)
  const yearStart = new Date(`${year}-01-01`)
  const yearEnd = new Date(`${year}-12-31`)

  // Started before or on the first day of the year — no date proration needed
  if (start <= yearStart) {
    return roundHalfDay(fullEntitlement * partTimeRatio)
  }

  // Started after the year ended — no entitlement
  if (start > yearEnd) return 0

  const daysInYear = (yearEnd.getTime() - yearStart.getTime()) / 86_400_000 + 1
  const daysRemaining = (yearEnd.getTime() - start.getTime()) / 86_400_000 + 1
  const yearRatio = daysRemaining / daysInYear

  return roundHalfDay(fullEntitlement * partTimeRatio * yearRatio)
}

/**
 * Count how many England & Wales bank holidays fall on or after the start date in a given year.
 */
export function proratedBankHolidays(
  allBankHolidays: string[],
  startDate: string,
  year: number
): number {
  const start = new Date(startDate)
  const yearStart = new Date(`${year}-01-01`)
  const yearEnd = new Date(`${year}-12-31`)

  return allBankHolidays.filter((d) => {
    const bh = new Date(d)
    return bh >= (start > yearStart ? start : yearStart) && bh <= yearEnd
  }).length
}

function roundHalfDay(n: number): number {
  return Math.round(n * 2) / 2
}
