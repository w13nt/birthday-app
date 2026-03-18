import { useState, useEffect, useRef } from 'react'
import { db } from './db/db'
import { getDaysUntil } from './utils/dateHelpers'
import { checkAndNotify, requestPermission } from './utils/notifications'
import ContactCard   from './components/ContactCard'
import ContactForm   from './components/ContactForm'
import ConfirmDialog from './components/ConfirmDialog'
import SettingsModal from './components/SettingsModal'

export default function App() {
  const [contacts,       setContacts]       = useState([])
  const [showForm,       setShowForm]       = useState(false)
  const [editContact,    setEditContact]    = useState(null)
  const [deleteContact,  setDeleteContact]  = useState(null)
  const [notifDenied,    setNotifDenied]    = useState(false)
  const [importError,    setImportError]    = useState('')
  const [showSettings,   setShowSettings]   = useState(false)
  const [menuContactId,  setMenuContactId]  = useState(null)
  const importRef = useRef()

  useEffect(() => {
    loadContacts()
    const theme = localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  async function loadContacts() {
    const all = await db.contacts.toArray()
    setContacts(sortContacts(all))
    checkAndNotify(all)
  }

  function sortContacts(list) {
    return [...list].sort(
      (a, b) => getDaysUntil(a.day, a.month) - getDaysUntil(b.day, b.month)
    )
  }

  async function handleSave(data) {
    if (data.id) {
      await db.contacts.update(data.id, { ...data, updatedAt: Date.now() })
    } else {
      await db.contacts.add({ ...data, createdAt: Date.now() })
    }
    closeForm()
    loadContacts()

    // Запрашиваем разрешение на уведомления при первом сохранении
    if ('Notification' in window && Notification.permission === 'default') {
      const granted = await requestPermission()
      if (!granted) setNotifDenied(true)
    }
  }

  async function handleDelete(contact) {
    await db.contacts.delete(contact.id)
    setDeleteContact(null)
    loadContacts()
  }

  function openEdit(contact) {
    setMenuContactId(null)
    setEditContact(contact)
    setShowForm(true)
  }

  function handleEditCancel() {
    setShowForm(false)
    setMenuContactId(editContact?.id ?? null)
    setEditContact(null)
  }

  function openAdd() {
    setEditContact(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditContact(null)
  }

  function handleExport() {
    const data = JSON.stringify(
      contacts.map(({ id, createdAt, updatedAt, ...rest }) => rest),
      null, 2
    )
    const blob = new Blob([data], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `birthdays-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''

    try {
      const text    = await file.text()
      const parsed  = JSON.parse(text)
      const records = Array.isArray(parsed) ? parsed : [parsed]

      const valid = records.filter(r =>
        r.name && typeof r.day === 'number' && typeof r.month === 'number'
      )
      if (valid.length === 0) throw new Error('Нет корректных записей')

      await db.contacts.bulkAdd(
        valid.map(r => ({ ...r, createdAt: Date.now() }))
      )
      loadContacts()
      setImportError(`Импортировано: ${valid.length} контактов`)
      setTimeout(() => setImportError(''), 3000)
    } catch (err) {
      setImportError('Ошибка импорта: ' + err.message)
      setTimeout(() => setImportError(''), 4000)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Дни рождения</h1>
        <div className="header-actions">
          <button className="btn-icon btn-icon--settings" title="Настройки" onClick={() => setShowSettings(true)}>
            ⚙
          </button>
          <button className="btn-icon" title="Импорт" onClick={() => importRef.current.click()}>
            ↑
          </button>
          <button className="btn-icon" title="Экспорт" onClick={handleExport} disabled={contacts.length === 0}>
            ↓
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>
      </header>

      <main className="main">
        {notifDenied && (
          <div className="banner">
            Уведомления отключены. Разрешите в настройках браузера для этого сайта.
            <button onClick={() => setNotifDenied(false)}>✕</button>
          </div>
        )}
        {importError && (
          <div className={`banner ${importError.startsWith('Ошибка') ? 'banner--error' : 'banner--ok'}`}>
            {importError}
          </div>
        )}

        {contacts.length === 0 ? (
          <div className="empty">
            <p className="empty-title">Контактов пока нет</p>
            <p className="empty-hint">Нажми «+», чтобы добавить первый день рождения</p>
          </div>
        ) : (
          <div className="list">
            {contacts.map(c => (
              <ContactCard
                key={c.id}
                contact={c}
                menuOpen={menuContactId === c.id}
                onMenuOpen={() => setMenuContactId(c.id)}
                onMenuClose={() => setMenuContactId(null)}
                onEdit={() => openEdit(c)}
                onDelete={() => setDeleteContact(c)}
              />
            ))}
          </div>
        )}
      </main>

      <button className="fab" onClick={openAdd} aria-label="Добавить контакт">+</button>

      {showForm && (
        <ContactForm
          contact={editContact}
          onSave={handleSave}
          onClose={closeForm}
          onCancel={handleEditCancel}
        />
      )}

      {deleteContact && (
        <ConfirmDialog
          contact={deleteContact}
          onConfirm={() => handleDelete(deleteContact)}
          onClose={() => {
            setMenuContactId(deleteContact?.id ?? null)
            setDeleteContact(null)
          }}
        />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
