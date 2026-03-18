import { useState } from 'react'
import { getNotifSettings, saveNotifSettings, requestPermission } from '../utils/notifications'

const DAY_OPTIONS = [
  { days: 14, label: 'За 2 недели' },
  { days: 7,  label: 'За 1 неделю' },
  { days: 3,  label: 'За 3 дня' },
  { days: 1,  label: 'За 1 день' },
  { days: 0,  label: 'В день рождения' },
]

export default function SettingsModal({ onClose }) {
  const initial = getNotifSettings()
  const [selectedDays, setSelectedDays] = useState(initial.days)
  const [time, setTime]   = useState(initial.time)
  const [dark, setDark]   = useState(localStorage.getItem('theme') === 'dark')
  const [saved, setSaved] = useState(false)

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
    await requestPermission()
    saveNotifSettings({ days: selectedDays, time })
    localStorage.setItem('theme', dark ? 'dark' : 'light')
    setSaved(true)
    setTimeout(onClose, 700)
  }

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
