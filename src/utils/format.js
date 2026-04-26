export const RUPEE = String.fromCharCode(8377)
export const fmt = (n) => RUPEE + Number(n || 0).toLocaleString('en-IN')
export const EXPENSE_KEYS = ['emi', 'invest', 'rent', 'insurance', 'medicine', 'personal', 'credit', 'family']
