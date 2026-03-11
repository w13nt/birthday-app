import Dexie from 'dexie'

export const db = new Dexie('BirthdayTracker')

db.version(1).stores({
  contacts: '++id, name, day, month',
})
