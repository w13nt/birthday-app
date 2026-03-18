import 'dotenv/config'
import express from 'express'
import { setupBot } from './bot.js'
import { setupCron } from './cron.js'

const app  = express()
const PORT = process.env.PORT || 3001

app.use(express.json())

// Health check для Render.com
app.get('/', (_req, res) => res.json({ status: 'ok' }))

setupBot(app)
setupCron()

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
