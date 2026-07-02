// Muted, editorial identity palette — earth tones that stay legible on the
// light paper map without turning it into a neon dashboard
export const MEMBER_COLORS = [
  '#C05B33', // terracotta
  '#3E7C7B', // pine teal
  '#8E5A80', // plum
  '#B98A2E', // ochre
  '#6B7F3B', // moss
  '#A8524A', // brick
  '#4E7D67', // sea green
  '#7A6C54', // taupe
]

export function assignColor(usedColors = []) {
  const used = new Set(usedColors)
  return MEMBER_COLORS.find(c => !used.has(c)) ?? MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)]
}
