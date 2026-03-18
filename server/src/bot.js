import TelegramBot from 'node-telegram-bot-api'
import { supabase } from './supabase.js'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN

// Временное хранилище кодов: code → { userId, expires }
const linkCodes = new Map()

export let bot

export function setupBot(app) {
  bot = new TelegramBot(TOKEN)

  // Webhook mode для продакшена
  const WEBHOOK_URL = process.env.WEBHOOK_URL // например: https://your-app.onrender.com
  bot.setWebHook(`${WEBHOOK_URL}/telegram/webhook`)

  app.post('/telegram/webhook', (req, res) => {
    bot.processUpdate(req.body)
    res.sendStatus(200)
  })

  // Генерация кода привязки для пользователя
  // Фронтенд вызывает POST /telegram/generate-code с { userId }
  app.post('/telegram/generate-code', async (req, res) => {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ error: 'userId required' })

    const code    = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = Date.now() + 10 * 60 * 1000 // 10 минут

    linkCodes.set(code, { userId, expires })
    res.json({ code })
  })

  // Команда /start — пользователь пишет боту
  bot.onText(/\/start(?:\s+(\d{6}))?/, async (msg, match) => {
    const chatId = msg.chat.id
    const code   = match[1]

    if (!code) {
      bot.sendMessage(chatId,
        '👋 Привет! Я бот для уведомлений о днях рождения.\n\n' +
        'Чтобы подключить меня к своему аккаунту, зайди в приложение → Настройки → Telegram и введи там команду /start с кодом из приложения.'
      )
      return
    }

    const entry = linkCodes.get(code)

    if (!entry) {
      bot.sendMessage(chatId, '❌ Код не найден или истёк. Сгенерируй новый в настройках приложения.')
      return
    }

    if (Date.now() > entry.expires) {
      linkCodes.delete(code)
      bot.sendMessage(chatId, '⏱ Код истёк. Сгенерируй новый в настройках приложения.')
      return
    }

    // Сохраняем chat_id в user_settings
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: entry.userId, telegram_chat_id: chatId }, { onConflict: 'user_id' })

    linkCodes.delete(code)

    if (error) {
      bot.sendMessage(chatId, '❌ Ошибка при сохранении. Попробуй ещё раз.')
      return
    }

    bot.sendMessage(chatId,
      '✅ Telegram подключён! Теперь я буду присылать тебе напоминания о днях рождения.'
    )
  })

  console.log('Telegram bot started')
}
