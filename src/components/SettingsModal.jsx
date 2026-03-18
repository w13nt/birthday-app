import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { saveNotifSettings } from '../utils/notifications'

const DAY_OPTIONS = [
  { days: 14, label: 'За 2 недели' },
  { days: 7,  label: 'За 1 неделю' },
  { days: 3,  label: 'За 3 дня' },
  { days: 1,  label: 'За 1 день' },
  { days: 0,  label: 'В день рождения' },
]

export default function SettingsModal({ onClose }) {
  const { user } = useAuth()
  const [selectedDays, setSelectedDays] = useState([])
  const [time,   setTime]   = useState('09:00')
  const [dark,   setDark]   = useState(localStorage.getItem('theme') === 'dark')
  const [saved,  setSaved]  = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    console.log('settings loaded:', data, error)

    if (data) {
      setSelectedDays(data.notif_days ?? [])
      setTime(data.notif_time ?? '09:00')
      setDark(data.theme === 'dark')
      // Синхронизируем с localStorage для checkAndNotify
      saveNotifSettings({ days: data.notif_days ?? [], time: data.notif_time ?? '09:00' })
      localStorage.setItem('theme', data.theme ?? 'light')
      document.documentElement.setAttribute('data-theme', data.theme ?? 'light')
    }
    setLoading(false)
  }

  function toggleDay(days) {
    setSelectedDays(prev =>
      prev.includes(days) ? prev.filter(d => d !== days) : [...prev, days]
    )
    setSaved(false)
  }

  function toggleDark(value) {
    setDark(value)
    const theme = value ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    setSaved(false)
  }

  async function handleSave() {
    const theme = dark ? 'dark' : 'light'
    const settings = { notif_days: selectedDays, notif_time: time, theme }

    await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, ...settings }, { onConflict: 'user_id' })

    // Синхронизируем с localStorage
    saveNotifSettings({ days: selectedDays, time })
    localStorage.setItem('theme', theme)

    setSaved(true)
    setTimeout(onClose, 700)
  }

  if (loading) return null

  return (
    <div className="overlay overlay--center" onClick={onClose}>
      <div className="modal modal--dialog" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Настройки</h2>

        <div className="settings-section">
          <div className="settings-section-title">Тема</div>
          <label className="settings-toggle-row">
            <span>Тёмный режим</span>
            <span className={`toggle${dark ? ' toggle--on' : ''}`} onClick={() => toggleDark(!dark)}>
              <span className="toggle-thumb" />
            </span>
          </label>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Когда уведомлять</div>
          <div className="settings-hint">Если ничего не выбрано — уведомление придёт в день рождения</div>
          <div className="settings-days">
            {DAY_OPTIONS.map(opt => (
              <label key={opt.days} className="settings-check">
                <input
                  type="checkbox"
                  checked={selectedDays.includes(opt.days)}
                  onChange={() => toggleDay(opt.days)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Время уведомлений</div>
          <input
            type="time"
            className="settings-time"
            value={time}
            onChange={e => { setTime(e.target.value); setSaved(false) }}
          />
        </div>

        <div className="form-actions">
          <button className="btn btn--secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn--primary" onClick={handleSave}>
            {saved ? 'Сохранено ✓' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}
