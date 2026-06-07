const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS  = '0123456789'

function randChar(str) {
  return str[Math.floor(Math.random() * str.length)]
}

export function generateTripCode() {
  const letters = Array.from({ length: 4 }, () => randChar(LETTERS)).join('')
  const digits  = Array.from({ length: 4 }, () => randChar(DIGITS)).join('')
  return letters + digits
}

export function validateTripCode(code) {
  if (!code || typeof code !== 'string') return false
  return /^[A-Z0-9]{6,10}$/i.test(code)
}
