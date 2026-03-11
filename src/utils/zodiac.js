// [name, endMonth, endDay]
const SIGNS = [
  ['Козерог',   1, 19],
  ['Водолей',   2, 18],
  ['Рыбы',      3, 20],
  ['Овен',      4, 19],
  ['Телец',     5, 20],
  ['Близнецы',  6, 20],
  ['Рак',       7, 22],
  ['Лев',       8, 22],
  ['Дева',      9, 22],
  ['Весы',     10, 22],
  ['Скорпион', 11, 21],
  ['Стрелец',  12, 21],
  ['Козерог',  12, 31],
]

export function getZodiac(day, month) {
  for (const [name, endMonth, endDay] of SIGNS) {
    if (month < endMonth || (month === endMonth && day <= endDay)) {
      return name
    }
  }
  return 'Козерог'
}
