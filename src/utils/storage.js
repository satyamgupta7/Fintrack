import initialData from '../data/db.json'

const key = (email) => `fintrack_data_${email || 'guest'}`

export function loadData(email) {
  try {
    const stored = localStorage.getItem(key(email))
    return stored ? JSON.parse(stored) : structuredClone(initialData)
  } catch {
    return structuredClone(initialData)
  }
}

export function saveData(data, email) {
  localStorage.setItem(key(email), JSON.stringify(data))
}

export function clearData(email) {
  localStorage.removeItem(key(email))
}
