export const MEMBER_COLORS = [
  '#FF6B35',
  '#00D4FF',
  '#FFD700',
  '#FF4D6D',
  '#C77DFF',
  '#FF9F1C',
  '#2EC4B6',
  '#F72585',
]

export function assignColor(usedColors = []) {
  const used = new Set(usedColors)
  return MEMBER_COLORS.find(c => !used.has(c)) ?? MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)]
}
