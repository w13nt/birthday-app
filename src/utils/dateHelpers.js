export const MONTHS_RU = [
  'января','февраля','марта','апреля','мая','июня',
  'июля','августа','сентября','октября','ноября','декабря',
]

export const MONTHS_NAMES = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
]

/** Количество дней в месяце (year=2000 для февраля — будет 29) */
export function daysInMonth(month, year = 2000) {
  return new Date(year, month, 0).getDate()
}

/** Количество дней до следующего дня рождения (0 = сегодня) */
export function getDaysUntil(day, month) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const year = today.getFullYear()
  let next = new Date(year, month - 1, day)
  if (next < today) next = new Date(year + 1, month - 1, day)
  return Math.round((next - today) / 86_400_000)
}

/** Полных лет на сегодня */
export function getAge(day, month, year) {
  const today = new Date()
  let age = today.getFullYear() - year
  if (
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day)
  ) age--
  return age
}

/** Сегодня ли день рождения */
export function isToday(day, month) {
  const t = new Date()
  return t.getDate() === day && t.getMonth() + 1 === month
}

/** Склонение "День / Дня / Дней" */
export function pluralDays(n) {
  const last  = n % 10
  const last2 = n % 100
  if (last2 >= 11 && last2 <= 14) return 'Дней'
  if (last === 1) return 'День'
  if (last >= 2 && last <= 4) return 'Дня'
  return 'Дней'
}

/** Склонение "год / года / лет" */
export function pluralYears(n) {
  const last  = n % 10
  const last2 = n % 100
  if (last2 >= 11 && last2 <= 14) return 'лет'
  if (last === 1) return 'год'
  if (last >= 2 && last <= 4) return 'года'
  return 'лет'
}
