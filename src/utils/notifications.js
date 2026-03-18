import { getDaysUntil, MONTHS_RU } from './dateHelpers'

const TRIGGERS = [
  { days: 0,  key: 'today', title: 'Сегодня день рождения!',       body: (name)       => `Сегодня у ${name} день рождения. Поздравь!` },
  { days: 1,  key: '1d',    title: 'Завтра день рождения!',         body: (name)       => `Завтра у ${name} день рождения. Приготовь поздравление!` },
  { days: 3,  key: '3d',    title: 'День рождения через 3 дня',     body: (name, date) => `У ${name} день рождения ${date}. Не забудь поздравить!` },
  { days: 7,  key: '7d',    title: 'День рождения через неделю',    body: (name, date) => `У ${name} день рождения ${date}` },
  { days: 14, key: '14d',   title: 'День рождения через 2 недели',  body: (name, date) => `У ${name} день рождения ${date}` },
]

export const DEFAULT_SETTINGS = {
  days: [],
  time: '09:00',
}

export function getNotifSettings() {
  try {
    const raw = localStorage.getItem('notif_settings')
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {}
  return { ...DEFAULT_SETTINGS }
}

export function saveNotifSettings(settings) {
  localStorage.setItem('notif_settings', JSON.stringify(settings))
}

export async function requestPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const res = await Notification.requestPermission()
  return res === 'granted'
}

export function checkAndNotify(contacts) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const settings = getNotifSettings()
  const allowedDays = settings.days.length > 0 ? settings.days : [0]

  const [hh, mm] = settings.time.split(':').map(Number)
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const configMinutes  = hh * 60 + mm
  if (currentMinutes < configMinutes) return

  const year = now.getFullYear()

  for (const c of contacts) {
    const days    = getDaysUntil(c.day, c.month)
    const dateStr = `${c.day} ${MONTHS_RU[c.month - 1]}`

    for (const t of TRIGGERS) {
      if (!allowedDays.includes(t.days)) continue
      if (days !== t.days) continue
      const key = `notif_${c.id}_${t.key}_${year}`
      if (localStorage.getItem(key)) continue

      new Notification(t.title, { body: t.body(c.name, dateStr), icon: '/icon.png' })
      localStorage.setItem(key, '1')
    }
  }
}
