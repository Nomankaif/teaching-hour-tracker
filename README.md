# Tuition Hours Tracker

A simple Next.js, Node.js API route, MongoDB, and Tailwind CSS app for tracking daily tuition hours and automatically viewing weekly and monthly totals.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=tuition_tracker
```

3. Start MongoDB locally, then run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Features

- Add students with optional parent/contact details and hourly rate.
- Enter daily tuition hours by student and date.
- View today, current week, and current month totals.
- See student-wise weekly and monthly reports.
- Track estimated monthly earnings from saved hourly rates.
