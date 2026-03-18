import cron from 'node-cron'
import { supabase } from './supabase.js'
import { bot }      from './bot.js'

const MONTHS_RU = ['января','февраля','марта','апреля','мая','июня',
                   'июля','августа','сентября','октября','ноября','декабря']

function getDaysUntil(day, month) {
  const now    = new Date()
  const target = new Date(now.getFullYear(), month - 1, day)
  if (target < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    target.setFullYear(now.getFullYear() + 1)
  }
  const diff = target - new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round(diff / 86400000)
}

const TRIGGERS = [
  { days: 0,  text: (name)       => `🎂 Сегодня день рождения!\n${name} отмечает день рождения сегодня. Поздравь!` },
  { days: 1,  text: (name)       => `🎁 Завтра день рождения!\nЗавтра у ${name} день рождения. Приготовь поздравление!` },
  { days: 3,  text: (name, date) => `📅 День рождения через 3 дня\nУ ${name} день рождения ${date}. Не забудь поздравить!` },
  { days: 7,  text: (name, date) => `📅 День рождения через неделю\nУ ${name} день рождения ${date}.` },
  { days: 14, text: (name, date) => `📅 День рождения через 2 недели\nУ ${name} день рождения ${date}.` },
]

export function setupCron() {
  // Запускаем каждую минуту, проверяем у каких пользователей сейчас время уведомлений
  cron.schedule('* * * * *', async () => {
    const now = new Date()
    const hh  = now.getHours().toString().padStart(2, '0')
    const mm  = now.getMinutes().toString().padStart(2, '0')
    const currentTime = `${hh}:${mm}`

    // Получаем всех пользователей у кого время уведомлений совпадает с текущим
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('user_id, telegram_chat_id, notif_days, notif_time')
      .eq('notif_time', currentTime)
      .not('telegram_chat_id', 'is', null)

    if (error || !settings?.length) return

    for (const s of settings) {
      const allowedDays = s.notif_days?.length > 0 ? s.notif_days : [0]

      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', s.user_id)

      if (!contacts?.length) continue

      const year = now.getFullYear()

      for (const c of contacts) {
        const days    = getDaysUntil(c.day, c.month)
        const dateStr = `${c.day} ${MONTHS_RU[c.month - 1]}`

        for (const t of TRIGGERS) {
          if (!allowedDays.includes(t.days)) continue
          if (days !== t.days) continue

          const key = `notif_${c.id}_${t.days}_${year}`
          const { data: sent } = await supabase
            .from('sent_notifications')
            .select('id')
            .eq('key', key)
            .single()

          if (sent) continue

          try {
            await bot.sendMessage(s.telegram_chat_id, t.text(c.name, dateStr))
            await supabase.from('sent_notifications').insert({ key, user_id: s.user_id })
          } catch (err) {
            console.error(`Failed to send to ${s.telegram_chat_id}:`, err.message)
          }
        }
      }
    }
  })

  console.log('Cron scheduler started')
}
