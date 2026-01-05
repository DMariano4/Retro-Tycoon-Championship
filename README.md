Retro Championship Tycoon

A retro-style football management simulation for mobile, inspired by early‑2000s text‑based classics like Championship Manager. The game focuses on long‑term club management with a minimalist, text‑heavy interface designed primarily for mobile devices.

🎮 Game Overview

In Retro Championship Tycoon, players take control of a football club and manage every aspect of its success:

Squad building and player development

Tactical decisions and match preparation

Transfers, contracts, and finances

League progression with promotion and relegation

Long‑term saves spanning many seasons

The experience is intentionally streamlined and nostalgic, prioritizing depth of systems over flashy visuals.

✨ Key Features
Core Gameplay

Full club management: tactics, transfers, finances, and youth development

Realistic league structures (starting with the English system)

Promotion and relegation

Multi‑season progression

Match Engine

Text‑based match commentary

Selectable match viewing speeds

Match screen with scoreboard and substitution placeholders

Player System

Detailed player profiles

Expanded, position‑specific attributes (e.g. Reflexes for GKs, Tackling for Defenders)

Individual player profile screens accessible throughout the UI

Transfers

Transfer market with player and club search

Contract management with dated expiries (in progress)

Time & Progression

Calendar‑based time progression system

Dated fixtures and seasons

Transfer windows tied to the calendar

Long‑term save files spanning multiple years

🖥 Interface & Design

Minimalist, retro, text‑focused UI

Mobile‑first design philosophy

Inspired by early‑2000s football management games

🧱 Technical Architecture
Frontend

React Native with Expo

Expo Router for navigation

Global state managed via React Context

Mobile‑first (Expo Go is the primary target platform)

Backend

Python with FastAPI

Handles all game logic, data generation, and persistence

Procedurally generates placeholder data for teams, leagues, and players

Database

MongoDB

Stores user sessions and game saves

Authentication

Google Social Login (via Emergent Auth)

Save System

Local game saves

Cloud sync support

📂 Project Structure (Simplified)
/app
├── backend/
│   └── server.py          # FastAPI backend (game logic, APIs)
├── frontend/
│   ├── app/               # Expo Router screens
│   │   ├── index.tsx      # Main menu
│   │   ├── login.tsx      # Google login
│   │   ├── team-select.tsx
│   │   ├── game.tsx       # Main game hub
│   │   ├── match.tsx
│   │   ├── settings.tsx
│   │   └── player/[id].tsx
│   └── src/context/
│       └── GameContext.tsx
🚧 Current Status

Core gameplay systems implemented

Player profiles, expanded stats, and transfer search completed

Time progression system in progress (frontend integration ongoing)

Editor / modding functionality removed by design decision

Known issue:

Web preview for team selection may hang due to React Native Web compatibility. The mobile app works correctly and is the primary target.

🗺 Roadmap

Complete frontend integration of the calendar & time progression system

Display current date, fixtures, and transfer window status in UI

Continue polishing match engine and UI flow

📜 License

This project is currently under active development and not yet licensed for distribution.

Retro Championship Tycoon is built as a passion project focused on depth, nostalgia, and long‑term football management gameplay.# Here are your Instructions
