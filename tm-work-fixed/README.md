# Timetable Enhancements

Fix and add these 4 things. Do not change anything else.

1. LAYOUT FIX — Cards still overlap content below.
   In TimetableGrid.tsx, change the grid container to:
   display: flex, flex-direction: column, gap: 1rem
   Remove any absolute or negative margin positioning on session cards.
   Do not use overflow: hidden.

2. PRINT BUTTON — make sure window.print() is called and add a 
   print stylesheet:
   @media print {
     hide: sidebar, filters, buttons, header controls
     show: only the timetable grid for the selected day/lab
     each session card on its own clean row
   }

3. INSTRUCTOR FILTER — add a text input next to the existing lab 
   and day filters. Filters visible session cards by instructor name.
   No new dependencies.

4. DARK MODE TOGGLE — add a 🌙/☀️ button in the header.
   Toggles between light and dark mode.
   Save preference in localStorage key "theme".
   On page load, read localStorage and apply saved theme instantly
   before render to avoid flash.

No new libraries. No new files if avoidable.

VERIFICATION — after all changes, open browser console (F12) and confirm:
- No red errors
- Layout: scroll down and verify no card overlaps content below it
- Print: press Ctrl+P and verify only the timetable shows, no buttons
- Instructor filter: type a name and verify cards filter live
- Dark mode: click 🌙 button, refresh page, verify dark mode persists

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://timetable-magic-37.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/326f0f92-b557-40df-80f9-53d6755312cb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
