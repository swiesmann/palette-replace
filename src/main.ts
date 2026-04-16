import colorsea from 'colorsea'
import { palettes, type Palette } from './palettes'

// Matches #RGB, #RGBA, #RRGGBB, #RRGGBBAA - captures color and alpha separately
const HEX_COLOR_REGEX = /#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?\b|#([0-9a-fA-F]{3})([0-9a-fA-F])?\b/g

function normalizeHex(hex: string): string {
  hex = hex.replace('#', '')
  // Handle 3-digit hex (RGB)
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }
  // Handle 4-digit hex (RGBA) - extract just the color part
  if (hex.length === 4) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }
  return '#' + hex.slice(0, 6).toLowerCase()
}

function findNearestColor(targetHex: string, palette: Palette): string {
  const target = colorsea(normalizeHex(targetHex))
  let nearestColor = palette.colors[0]
  let minDistance = Infinity

  for (const paletteHex of palette.colors) {
    const paletteColor = colorsea(paletteHex)
    const distance = target.deltaE(paletteColor, 'cie2000')

    if (distance < minDistance) {
      minDistance = distance
      nearestColor = paletteHex
    }
  }

  return nearestColor
}

function replaceColors(content: string, palette: Palette): string {
  return content.replace(HEX_COLOR_REGEX, (match) => {
    const hex = match.replace('#', '')
    let colorPart: string
    let alphaPart = ''

    if (hex.length === 8) {
      // #RRGGBBAA
      colorPart = '#' + hex.slice(0, 6)
      alphaPart = hex.slice(6, 8)
    } else if (hex.length === 4) {
      // #RGBA
      colorPart = '#' + hex.slice(0, 3)
      alphaPart = hex[3] + hex[3] // Expand single alpha digit to two
    } else {
      // #RGB or #RRGGBB (no alpha)
      colorPart = match
    }

    const newColor = findNearestColor(colorPart, palette)
    return newColor + alphaPart
  })
}

function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function init(): void {
  const fileInput = document.getElementById('file-input') as HTMLInputElement
  const paletteSelect = document.getElementById('palette-select') as HTMLSelectElement
  const processBtn = document.getElementById('process-btn') as HTMLButtonElement
  const status = document.getElementById('status') as HTMLElement
const step1Next = document.getElementById('step1-next') as HTMLButtonElement
  const step2Next = document.getElementById('step2-next') as HTMLButtonElement
  const step2Back = document.getElementById('step2-back') as HTMLButtonElement
  const step3Back = document.getElementById('step3-back') as HTMLButtonElement

  // Populate palette dropdown
  for (const palette of palettes) {
    const option = document.createElement('option')
    option.value = palette.name
    option.textContent = palette.name
    paletteSelect.appendChild(option)
  }

  let fileContent = ''
  let fileName = ''
  let currentStep = 1

  function showStep(step: number): void {
    for (let i = 1; i <= 3; i++) {
      document.getElementById(`step-${i}`)!.classList.toggle('active', i === step)
    }
    currentStep = step
  }

  // Breadcrumb click: navigate back to done steps
  document.getElementById('crumb-1-2')!.addEventListener('click', () => showStep(1))
  document.getElementById('crumb-1-3')!.addEventListener('click', () => showStep(1))
  document.getElementById('crumb-2-3')!.addEventListener('click', () => showStep(2))

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0]
    if (!file) return

    fileName = file.name
    const reader = new FileReader()
    reader.onload = (e) => {
      fileContent = e.target?.result as string
step1Next.disabled = false
    }
    reader.readAsText(file)
  })

  step1Next.addEventListener('click', () => showStep(2))
  step2Back.addEventListener('click', () => showStep(1))
  step2Next.addEventListener('click', () => {
    status.textContent = `File: ${fileName} → Palette: ${paletteSelect.value}`
    showStep(3)
  })
  step3Back.addEventListener('click', () => showStep(2))

  paletteSelect.addEventListener('change', () => {
    step2Next.disabled = !paletteSelect.value
  })

  processBtn.addEventListener('click', () => {
    const selectedPalette = palettes.find(p => p.name === paletteSelect.value)
    if (!selectedPalette) return

    const processedContent = replaceColors(fileContent, selectedPalette)
    const newFileName = fileName.replace(/(\.[^.]+)$/, `-${selectedPalette.name.toLowerCase().replace(/\s+/g, '-')}$1`)

    downloadFile(processedContent, newFileName)
    status.textContent = `Downloaded: ${newFileName}`
  })
}

document.addEventListener('DOMContentLoaded', init)
