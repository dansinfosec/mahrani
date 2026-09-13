/**
 * CMS heading convention (see backend cms/blocks.py):
 *   - a line break starts a new line
 *   - _text_ renders in italic serif
 *
 * parseHeading("Light,\n_perfected._") →
 *   [[{text:'Light,'}], [{text:'perfected.', italic:true}]]
 */
export function parseHeading(text) {
  if (!text) return []
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseLine)
}

function parseLine(line) {
  const segments = []
  const pattern = /_([^_]+)_/g
  let last = 0
  let match
  while ((match = pattern.exec(line)) !== null) {
    if (match.index > last) segments.push({ text: line.slice(last, match.index) })
    segments.push({ text: match[1], italic: true })
    last = match.index + match[0].length
  }
  if (last < line.length) segments.push({ text: line.slice(last) })
  return segments
}

export function headingToPlainText(text) {
  return parseHeading(text)
    .map((line) => line.map((s) => s.text).join(''))
    .join(' ')
}
