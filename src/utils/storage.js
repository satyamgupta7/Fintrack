import initialData from '../data/db.json'

const key = (email) => `fintrack_data_${email || 'guest'}`
const versionKey = (email) => `fintrack_ver_${email || 'guest'}`

const DEFAULT_INVESTMENTS = { savingAccount: 200000, fixedDeposit: 0, mutualFund: 0, cash: 0 }
const DATA_VERSION = 2

export function loadData(email) {
  try {
    const storedVer = Number(localStorage.getItem(versionKey(email)) || 0)
    const stored = localStorage.getItem(key(email))

    // First time or version mismatch → load fresh defaults, mark version
    if (!stored || storedVer < DATA_VERSION) {
      const fresh = structuredClone(initialData)
      if (!fresh.investments) fresh.investments = { ...DEFAULT_INVESTMENTS }
      localStorage.setItem(key(email), JSON.stringify(fresh))
      localStorage.setItem(versionKey(email), String(DATA_VERSION))
      return fresh
    }

    const parsed = JSON.parse(stored)
    if (!parsed.investments) parsed.investments = { ...DEFAULT_INVESTMENTS }
    return parsed
  } catch {
    return structuredClone(initialData)
  }
}

export function saveData(data, email) {
  // save data as-is, version is tracked separately
  localStorage.setItem(key(email), JSON.stringify(data))
  localStorage.setItem(versionKey(email), String(DATA_VERSION))
}

export function clearData(email) {
  localStorage.removeItem(key(email))
  localStorage.removeItem(versionKey(email))
}
