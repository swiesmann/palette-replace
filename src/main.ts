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
  const carousel = document.getElementById('palette-carousel') as HTMLDivElement
  const carouselLeft = document.getElementById('carousel-left') as HTMLButtonElement
  const carouselRight = document.getElementById('carousel-right') as HTMLButtonElement
  const processBtn = document.getElementById('process-btn') as HTMLButtonElement
  const status = document.getElementById('status') as HTMLElement
  const step1Next = document.getElementById('step1-next') as HTMLButtonElement
  const step2Back = document.getElementById('step2-back') as HTMLButtonElement

  let fileContent = ''
  let fileName = ''
  let currentStep = 1
  let selectedPaletteName = ''

  function showStep(step: number): void {
    for (let i = 1; i <= 2; i++) {
      document.getElementById(`step-${i}`)!.classList.toggle('active', i === step)
    }
    currentStep = step
  }

  // Build palette cards
  for (const palette of palettes) {
    const card = document.createElement('div')
    card.className = 'palette-card'
    card.dataset.name = palette.name

    const nameEl = document.createElement('div')
    nameEl.className = 'palette-card-name'
    nameEl.textContent = palette.name

    const swatches = document.createElement('div')
    swatches.className = 'palette-swatches'
    for (const color of palette.colors) {
      const swatch = document.createElement('div')
      swatch.className = 'palette-swatch'
      swatch.style.backgroundColor = color
      swatches.appendChild(swatch)
    }

    card.appendChild(nameEl)
    card.appendChild(swatches)
    card.addEventListener('click', () => {
      carousel.querySelectorAll('.palette-card').forEach(c => c.classList.remove('selected'))
      card.classList.add('selected')
      selectedPaletteName = palette.name
      processBtn.disabled = false
    })
    carousel.appendChild(card)
  }

  const SCROLL_AMOUNT = 210
  carouselLeft.addEventListener('click', () => carousel.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' }))
  carouselRight.addEventListener('click', () => carousel.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' }))

  // Breadcrumb click: navigate back to done steps
  document.getElementById('crumb-1-2')!.addEventListener('click', () => showStep(1))

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

  processBtn.addEventListener('click', () => {
    const selectedPalette = palettes.find(p => p.name === selectedPaletteName)
    if (!selectedPalette) return

    const processedContent = replaceColors(fileContent, selectedPalette)
    const newFileName = fileName.replace(/(\.[^.]+)$/, `-${selectedPalette.name.toLowerCase().replace(/\s+/g, '-')}$1`)

    downloadFile(processedContent, newFileName)
    status.textContent = `Downloaded: ${newFileName}`
  })
}

document.addEventListener('DOMContentLoaded', init)
