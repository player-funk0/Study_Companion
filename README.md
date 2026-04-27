# Study Companion Desktop (Windows)

This project runs as a Windows desktop app using Electron.

## Pages

- `index.html` home
- `study.html` study planner + stopwatch + countdown
- `tasbeeh.html` tasbeeh counter
- `adhkar.html` authentic adhkar with sanad and source

## 1) Prerequisites

- Install Node.js LTS (includes npm).

## 2) Install dependencies

```bash
npm install
```

## 3) Run the desktop app

```bash
npm run start
```

## 4) Build Windows installer (.exe)

```bash
npm run dist
```

The installer will be generated in:

- `dist/StudyCompanion-Setup-1.0.0.exe`

## 5) Optional portable build

```bash
npm run dist:portable
```
