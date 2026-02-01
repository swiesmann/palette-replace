# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Palette Replace is an offline PWA that replaces hexadecimal colors in text files with colors from popular predefined palettes. It uses CIE2000 color distance (via colorsea) to find the nearest matching color.

## Commands

```bash
pnpm dev      # Start development server
pnpm build    # Build for production (outputs to dist/)
pnpm preview  # Preview production build
```

## Architecture

- `src/index.html` - Main HTML entry point (plain HTML, styled by Pico CSS)
- `src/main.ts` - Application logic: file reading, color replacement, file download
- `src/palettes.ts` - Predefined color palettes (Catppuccin, Dracula, Nord, Gruvbox, Solarized, Tokyo Night, One Dark, Monokai, GitHub Dark)
- `vite.config.ts` - Build config with PWA plugin (vite-plugin-pwa)

## Key Implementation Details

- Color matching uses `colorsea.deltaE(color, 'ciede2000')` for perceptual color distance
- Hex colors are matched via regex: `/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g`
- PWA configured with workbox for offline caching
