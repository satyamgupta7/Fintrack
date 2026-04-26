function normalizeName(name) {
  return String(name || '').trim().toLowerCase()
}

export function getNetWorthSummary(data) {
  const savings = data.savings || []
  const entries = data.networth || []
  const loans = data.loans || []

  const assets = entries.filter((n) => n.category === 'Assets')
  const liabilities = entries.filter((n) => n.category === 'Liabilities')
  const liabilityNames = new Set(liabilities.map((n) => normalizeName(n.name)))
  const loanLiabilities = loans
    .filter((loan) => Number(loan.remaining || 0) > 0)
    .filter((loan) => !liabilityNames.has(normalizeName(loan.name)))
    .map((loan) => ({
      id: loan.id,
      name: loan.name,
      value: Number(loan.remaining || 0),
    }))

  const totalSavings = savings.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const totalAssets = assets.reduce((sum, item) => sum + Number(item.value || 0), 0) + totalSavings
  const manualLiabilities = liabilities.reduce((sum, item) => sum + Number(item.value || 0), 0)
  const linkedLoanLiabilities = loanLiabilities.reduce((sum, item) => sum + item.value, 0)
  const totalLiabilities = manualLiabilities + linkedLoanLiabilities

  return {
    assets,
    liabilities,
    loanLiabilities,
    totalSavings,
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  }
}
