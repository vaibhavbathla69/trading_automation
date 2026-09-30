export const money = (value: number, digits = 2) => `₹${new Intl.NumberFormat('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)}`
export const signedMoney = (value: number, digits = 2) => `${value >= 0 ? '+' : '−'}${money(Math.abs(value), digits)}`
export const number = (value: number) => new Intl.NumberFormat('en-IN').format(value)
export const time = (value: string | Date) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value))
export const timeSeconds = (value: string | Date) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date(value))
export const date = (value: string | Date) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
export const shortDate = (value: string | Date) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' }).format(new Date(value))
export const instrument = (item: { underlying: string; strike: number; optionType: string }) => `${item.underlying} ${item.strike} ${item.optionType}`
export const label = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase())
