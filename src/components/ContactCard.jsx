import { useState } from 'react'
import { isToday, getDaysUntil, getAge, MONTHS_RU, pluralDays, pluralYears } from '../utils/dateHelpers'
import { getZodiac } from '../utils/zodiac'

export default function ContactCard({ contact, onEdit, onDelete }) {
  const { name, day, month, year, noYear } = contact
  const [menuOpen, setMenuOpen] = useState(false)

  const today      = isToday(day, month)
  const daysUntil  = getDaysUntil(day, month)
  const zodiac     = getZodiac(day, month)
  const age        = (!noYear && year) ? getAge(day, month, year) : null

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

  return (
    <>
      <div
        className={`card${today ? ' card--today' : ''}`}
        onClick={() => setMenuOpen(true)}
      >
        <div className="card-row">
          <span className="card-name">{name}</span>
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
        <div className="overlay" onClick={() => setMenuOpen(false)}>
          <div className="action-sheet" onClick={e => e.stopPropagation()}>
            <div className="action-sheet-title">{name}</div>
            <button
              className="action-btn"
              onClick={() => { setMenuOpen(false); onEdit() }}
            >
              Редактировать
            </button>
            <button
              className="action-btn action-btn--danger"
              onClick={() => { setMenuOpen(false); onDelete() }}
            >
              Удалить
            </button>
            <button
              className="action-btn action-btn--cancel"
              onClick={() => setMenuOpen(false)}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </>
  )
}
