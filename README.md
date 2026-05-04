# AI Assistant UI

A modern, glassmorphism-styled React application for an AI assistant interface, built with Vite, TypeScript, and Tailwind CSS.

## Features

- **Modern UI/UX**: Clean, responsive design featuring glassmorphism elements, custom scrollbars, and smooth animations.
- **Dark Mode Support**: Fully configured custom Tailwind color palette supporting both light and dark themes.
- **Routing**: Client-side routing with `react-router-dom`.
- **Pages Included**:
  - Chat Interface
  - Knowledge Base
  - Integrations
  - Analytics
  - Authentication (Login & Register pages with a separate AuthLayout)
- **State Management**: Ready for Redux integration.
- **Icons**: Integrates Material Symbols Outlined.

## Tech Stack

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router DOM](https://reactrouter.com/)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/tinld/ai-assistant-ui.git
   cd ai-assistant-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── assets/          # Static assets
├── components/      # Reusable UI components
│   └── layout/      # Layout components (MainLayout, AuthLayout, Sidebar, Header)
├── pages/           # Application routes (Chat, Login, Analytics, etc.)
├── store/           # Redux store configuration
├── types/           # TypeScript interfaces and types
├── App.tsx          # Main application routing
├── main.tsx         # Entry point
└── index.css        # Global CSS & Tailwind configuration
```
