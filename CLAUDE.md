# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React/TypeScript web application that converts armies from One Page Rules' Army Forge into formats suitable for Tabletop Simulator (TTS). The app allows users to import army lists, define model loadouts, and export them for use with the TTS mod.

## Commands

### Development
- `npm run dev` - Start development server with Vite
- `npm run netlify:dev` - Start Netlify development environment (includes serverless functions)
- `npm run build` - Build for production (runs TypeScript compiler then Vite build)
- `npm run preview` - Preview production build locally

### Type Checking
- `tsc` - Run TypeScript compiler for type checking (included in build command)

## Architecture

### State Management
- Uses **Valtio** for global state management via reactive proxies
- Main state is in `src/state.ts` with the `state` proxy object
- State includes army data, UI config, network states, and TTS output configuration
- State mutations are handled through dedicated functions (e.g., `updateWeaponQuantity`, `duplicateModel`)

### Key Data Flow
1. User inputs Army Forge share link
2. App fetches army data via Netlify function (`netlify/functions/get-army/`)
3. Army data is parsed and converted to internal unit profile format
4. User configures model loadouts and quantities
5. App generates TTS-compatible output strings
6. Final army list is saved via Netlify function (`netlify/functions/save-list/`) and shareable link generated

### File Structure
- `src/App.tsx` - Main React component with army builder UI
- `src/state.ts` - Valtio state management and mutation functions
- `src/types.ts` - TypeScript interfaces for app data structures
- `src/army-forge-types.ts` - Types for Army Forge API data
- `src/utils.tsx` - Core business logic for army processing and TTS output generation
- `src/components/` - Reusable UI components
- `netlify/functions/` - Serverless functions for Army Forge API integration and data persistence
- `tts_lua_code/mod.lua` - Lua code for the TTS mod integration

### External Dependencies
- **Army Forge API** - Fetches army data from army-forge.onepagerules.com (supports both production and beta)
- **LibSQL Database** - Stores generated army lists for sharing via `@libsql/client`
- **Netlify Functions** - Serverless backend for API calls and data persistence

### Styling
- Uses **Tailwind CSS** for styling with dark mode support
- Components use conditional styling based on state (loadout quantities, network states)

### Key Business Logic
- Army data transformation happens in `src/utils.tsx`
- TTS output formatting includes model names, descriptions, and special rules
- Supports multiple One Page Rules game systems (Grimdark Future, Age of Fantasy, etc.)
- Handles model duplication, custom naming, and equipment quantity management