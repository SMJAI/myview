const GOV_UK_URL = 'https://www.gov.uk/bank-holidays.json'

export async function getEnglandBankHolidays(): Promise<string[]> {
  try {
    const res = await fetch(GOV_UK_URL, {
      next: { revalidate: 86400 }, // cache 24 hours
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data['england-and-wales']?.events ?? []).map(
      (e: { date: string }) => e.date
    )
  } catch {
    return []
  }
}
