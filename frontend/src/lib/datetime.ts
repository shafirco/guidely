export function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const min = pad(date.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

export function dateTimeLocalToIso(dateTimeLocal: string): string {
  // `datetime-local` has no timezone; JS treats it as local time.
  // Converting to ISO gives a UTC-aware string (ends with "Z").
  return new Date(dateTimeLocal).toISOString()
}

