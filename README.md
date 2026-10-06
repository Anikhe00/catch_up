# Catch-Up

A small, calm web app for getting through a backlog of study material before a deadline. Installable on your phone, works offline, and keeps everything on your device (localStorage). No backend, no accounts, no paid services.

Courses, dates, the study routine and the unit label are all set up inside the app. Nothing is hardcoded to one term.

## Run locally

Requires Node 20 or newer.

```bash
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173).

Other commands:

```bash
npm test          # unit tests for the pace and rotation logic
npm run build     # type-check and build to dist/
npm run preview   # serve the production build (needed to try install and offline)
```

The service worker only runs in the production build, so use `npm run build && npm run preview` to test installing and offline mode.

## Deploy to Vercel (free tier)

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Vercel detects Vite. Leave the defaults: build command `npm run build`, output directory `dist`.
4. Deploy. You'll get an `https://….vercel.app` address.

Or from the command line:

```bash
npx vercel --prod
```

## Install on your phone

Open the deployed address in your phone's browser, then:

- **iPhone (Safari):** Share → Add to Home Screen.
- **Android (Chrome):** menu → Install app.

Open it once while online so it can cache itself. After that it works offline.

## Your data

Everything is stored in your browser's localStorage on that device. It does not sync between devices. Use **Settings → Export backup** to save one JSON file with every term, including archived ones, and **Import backup** to restore it. Clearing the browser's site data deletes the app's data, so export now and then.

## Studying one course at a time

By default the app studies one course at a time: finish a course, take its assessment while everything is fresh, then move on. You can switch to rotating through every course (all first units, then all second units) in Settings.

- Each course can have an assessment: CMA (quiz), Virtual lab, Individual project, or Case study, with an optional closing date.
- The days from today to your study target date are split across courses in your course order, in proportion to their open units, so Today can say "Aim to finish MIT 8101 by 9 Oct, then take the CMA".
- When a course's units are all done, Today shows a "Ready to take" card and the finish pop-up offers to record the assessment (taken date and an optional score).
- Today has a "Coming up" card for assessments that close within 10 days. A course with no closing date uses your final deadline.
- Prefer your own dates? Set "Course dates" to "I will set them" and give each course a finish-by date. Today's target then follows the course you are on.
- The Grid has a CA column, and History keeps each assessment's result.

## How the pace works

- Daily target = units remaining at the start of today ÷ study days left (today through the study target date).
- A busy day counts as half a day of capacity.
- Missed days quietly raise the daily target. There are no streaks to break.
- After the study target date, Today switches to "The final stretch": the countdown to the final deadline, any units still open, and your assessments.

## Project layout

```
src/
  logic/     dates, unit rotation, pace maths (pure, tested)
  store/     state, localStorage, backup, theme
  screens/   Setup, Today, Routine, Grid, Settings, History
  components/ shared UI
  data/      pre-filled setup data
```
