import { useState, useEffect } from 'react'
import { MONTHS_NAMES, daysInMonth } from '../utils/dateHelpers'

export default function ContactForm({ contact, onSave, onClose, onCancel }) {
  const [name,   setName]   = useState('')
  const [day,    setDay]    = useState(1)
  const [month,  setMonth]  = useState(1)
  const [year,   setYear]   = useState('')
  const [noYear, setNoYear] = useState(false)
  const [errors, setErrors] = useState({})

  const currentYear = new Date().getFullYear()

  useEffect(() => {
    if (contact) {
      setName(contact.name)
      setDay(contact.day)
      setMonth(contact.month)
      setYear(contact.year ?? '')
      setNoYear(contact.noYear ?? false)
    }
  }, [contact])

  // Ограничиваем день при смене месяца
  useEffect(() => {
    const max = daysInMonth(month)
    if (day > max) setDay(max)
  }, [month])

  const maxDays = daysInMonth(month)
  const days    = Array.from({ length: maxDays }, (_, i) => i + 1)

  function validate() {
    const errs = {}
    if (!name.trim()) errs.name = 'Введите имя'
    if (!noYear && year !== '') {
      const y = parseInt(year, 10)
      if (isNaN(y) || y < 1900 || y > currentYear) {
        errs.year = `Год: от 1900 до ${currentYear}`
      }
    }
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    onSave({
      ...(contact?.id ? { id: contact.id } : {}),
      name:   name.trim(),
      day:    Math.min(day, daysInMonth(month)),
      month,
      year:   (!noYear && year !== '') ? parseInt(year, 10) : null,
      noYear,
    })
  }

  return (
    <div className="overlay overlay--center" onClick={onClose}>
      <div className="modal modal--dialog" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{contact ? 'Редактировать' : 'Новый контакт'}</h2>

        <form onSubmit={handleSubmit}>
          {/* Имя */}
          <div className="field">
            <label htmlFor="f-name">Имя</label>
            <input
              id="f-name"
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
              placeholder="Имя контакта"
              autoFocus
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          {/* Дата */}
          <div className="field">
            <label>День рождения</label>
            <div className="date-row">
              <select value={day} onChange={e => setDay(Number(e.target.value))}>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select value={month} onChange={e => setMonth(Number(e.target.value))}>
                {MONTHS_NAMES.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>

              {!noYear && (
                <input
                  type="number"
                  className="year-input"
                  value={year}
                  onChange={e => { setYear(e.target.value); setErrors(p => ({ ...p, year: '' })) }}
                  placeholder="Год"
                  min="1900"
                  max={currentYear}
                />
              )}

              <label className="noyear-label">
                <input
                  type="checkbox"
                  checked={noYear}
                  onChange={e => setNoYear(e.target.checked)}
                />
                <span>без года</span>
              </label>
            </div>
            {errors.year && <span className="field-error">{errors.year}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--secondary" onClick={onCancel ?? onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn--primary">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
