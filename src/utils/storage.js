import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import initialData from "../data/db.json";

const DEFAULT_INVESTMENTS = { savingAccount: 200000, fixedDeposit: 0, mutualFund: 0, cash: 0 };

// ── Firestore helpers ──────────────────────────────────────────────────────
export async function loadData(uid) {
  if (!uid) return structuredClone(initialData);
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      if (!d.investments) d.investments = { ...DEFAULT_INVESTMENTS };
      return d;
    }
    // First login — seed with defaults
    const fresh = structuredClone(initialData);
    if (!fresh.investments) fresh.investments = { ...DEFAULT_INVESTMENTS };
    await setDoc(ref, fresh);
    return fresh;
  } catch (e) {
    console.error("loadData error", e);
    return structuredClone(initialData);
  }
}

export async function saveData(data, uid) {
  if (!uid) return;
  try {
    const ref = doc(db, "users", uid);
    await setDoc(ref, data);
  } catch (e) {
    console.error("saveData error", e);
  }
}

export function clearData() {}
