import { useState } from 'react'
import { isToday, getDaysUntil, getAge, MONTHS_RU, pluralDays, pluralYears } from '../utils/dateHelpers'
import { getZodiac } from '../utils/zodiac'

export default function ContactCard({ contact, menuOpen, onMenuOpen, onMenuClose, onEdit, onDelete, onNoteUpdate }) {
  const { name, day, month, year, noYear } = contact
  const [note, setNote]       = useState(contact.note || '')
  const [noteSaved, setNoteSaved] = useState(false)

  const today     = isToday(day, month)
  const daysUntil = getDaysUntil(day, month)
  const zodiac    = getZodiac(day, month)
  const age       = (!noYear && year) ? getAge(day, month, year) : null

  const dateStr = (!noYear && year)
    ? `${day} ${MONTHS_RU[month - 1]}, ${year}г`
    : `${day} ${MONTHS_RU[month - 1]}`

  let ageStr = ''
  if (age !== null) {
    ageStr = today
      ? `сегодня исполнилось: ${age} ${pluralYears(age)}`
      : `полных лет: ${age}`
  }

  const details = [dateStr, zodiac, ageStr].filter(Boolean).join(', ')

  async function saveNote() {
    await onNoteUpdate(contact.id, note)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 1500)
  }

  return (
    <>
      <div
        className={`card${today ? ' card--today' : ''}`}
        onClick={onMenuOpen}
      >
        <div className="card-row">
          <span className="card-name-wrap">
            <span className="card-name">{name}</span>
            {note && (
              <svg className="card-note-icon" width="16" height="16" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="#9ca3af" strokeWidth="2"/>
                <line x1="4.5" y1="4.5" x2="9.5" y2="4.5" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round"/>
                <line x1="4.5" y1="7" x2="9.5" y2="7" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round"/>
                <line x1="4.5" y1="9.5" x2="7.5" y2="9.5" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            )}
          </span>
          <span className="card-count-num">{today ? '' : daysUntil}</span>
        </div>
        <div className="card-row">
          <span className="card-details">{details}</span>
          <span className={`card-count-label${today ? ' card-count-label--today' : ''}`}>
            {today ? 'Сегодня' : pluralDays(daysUntil)}
          </span>
        </div>
      </div>

      {menuOpen && (
        <div className="overlay overlay--center" onClick={onMenuClose}>
          <div className="action-sheet action-sheet--center" onClick={e => e.stopPropagation()}>
            <div className="action-sheet-title">{name}</div>
            <div className="action-sheet-note">
              <div className="action-sheet-note-label">Заметка. Добавляйте идеи для подарков, поздравления, увлечения и тд</div>
              <textarea
                rows={6}
                placeholder="Напишите что-нибудь..."
                value={note}
                onChange={e => { setNote(e.target.value); setNoteSaved(false) }}
              />
              <button
                className="btn btn--primary action-sheet-note-save"
                onClick={saveNote}
              >
                {noteSaved ? 'Сохранено ✓' : 'Сохранить'}
              </button>
            </div>
            <button
              className="action-btn"
              onClick={() => { onMenuClose(); onEdit() }}
            >
              Редактировать
            </button>
            <button
              className="action-btn action-btn--danger"
              onClick={() => { onMenuClose(); onDelete() }}
            >
              Удалить
            </button>
            <button
              className="action-btn action-btn--cancel"
              onClick={() => { setNote(contact.note || ''); onMenuClose() }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </>
  )
}
