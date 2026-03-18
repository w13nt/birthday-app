import { useState, useEffect, useRef } from 'react'
import { supabase }       from './lib/supabase'
import { useAuth }        from './contexts/AuthContext'
import { getDaysUntil }   from './utils/dateHelpers'
import { checkAndNotify, requestPermission } from './utils/notifications'
import ContactCard   from './components/ContactCard'
import ContactForm   from './components/ContactForm'
import ConfirmDialog from './components/ConfirmDialog'
import SettingsModal from './components/SettingsModal'

export default function App() {
  const { user, signOut }                    = useAuth()
  const [contacts,       setContacts]        = useState([])
  const [showForm,       setShowForm]        = useState(false)
  const [editContact,    setEditContact]     = useState(null)
  const [deleteContact,  setDeleteContact]   = useState(null)
  const [notifDenied,    setNotifDenied]     = useState(false)
  const [importError,    setImportError]     = useState('')
  const [showSettings,   setShowSettings]    = useState(false)
  const [menuContactId,  setMenuContactId]   = useState(null)
  const importRef = useRef()

  useEffect(() => {
    loadContacts()
    loadTheme()
  }, [user])

  async function loadTheme() {
    const { data } = await supabase
      .from('user_settings')
      .select('theme')
      .eq('user_id', user.id)
      .single()
    const theme = data?.theme || localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }

  function sortContacts(list) {
    return [...list].sort(
      (a, b) => getDaysUntil(a.day, a.month) - getDaysUntil(b.day, b.month)
    )
  }

  async function loadContacts() {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
    if (error) { console.error(error); return }
    // Маппим snake_case → camelCase
    const mapped = data.map(c => ({ ...c, noYear: c.no_year }))
    const sorted = sortContacts(mapped)
    setContacts(sorted)
    checkAndNotify(sorted)
  }

  function toDbContact(data) {
    return {
      name:       data.name,
      day:        data.day,
      month:      data.month,
      year:       data.year ?? null,
      no_year:    data.noYear ?? false,
      note:       data.note ?? '',
    }
  }

  async function handleSave(data) {
    if (data.id) {
      await supabase
        .from('contacts')
        .update({ ...toDbContact(data), updated_at: new Date().toISOString() })
        .eq('id', data.id)
    } else {
      await supabase
        .from('contacts')
        .insert({ ...toDbContact(data), user_id: user.id })
    }
    closeForm()
    loadContacts()

    if ('Notification' in window && Notification.permission === 'default') {
      const granted = await requestPermission()
      if (!granted) setNotifDenied(true)
    }
  }

  async function handleDelete(contact) {
    await supabase.from('contacts').delete().eq('id', contact.id)
    setDeleteContact(null)
    loadContacts()
  }

  async function handleNoteUpdate(contactId, note) {
    await supabase
      .from('contacts')
      .update({ note, updated_at: new Date().toISOString() })
      .eq('id', contactId)
    setContacts(prev =>
      prev.map(c => c.id === contactId ? { ...c, note } : c)
    )
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
      contacts.map(({ id, user_id, created_at, updated_at, ...rest }) => rest),
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

      await supabase.from('contacts').insert(
        valid.map(r => ({ ...r, user_id: user.id }))
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
          <button className="btn-icon" title="Выйти" onClick={signOut}>
            ⎋
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
            Уведомления отключены. Разрешите в настройках браузера.
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
                onNoteUpdate={handleNoteUpdate}
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
