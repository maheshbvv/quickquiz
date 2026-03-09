# QuickQuiz

A lightweight web platform that allows administrators to create quizzes and share them with the public via a link. Participants join using Google Authentication and complete the quiz within a defined time window.

## Features

- **Admin Dashboard**: Create quizzes, manage questions, and view results
- **Google Authentication**: Both Admins and Participants sign in securely with Google
- **Quiz Randomization**: Options to randomize question order and choice order
- **Split Questions**: Admins can add N questions and specify how many each participant sees (randomly selected)
- **Real-time Quiz**: Single-page quiz layout with auto-submission and timer
- **Instant Results**: Participants see scores and detailed feedback immediately
- **Results Export**: Admins can export results to Excel or PDF
- **Google AdSense Integration**: Monetization across all pages

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: Convex (TypeScript backend)
- **Authentication**: Firebase Authentication (Google Auth)
- **Database**: Convex database
- **Monetization**: Google AdSense

## Getting Started

### Prerequisites

1. Create a [Convex](https://convex.dev) account and project
2. Create a [Firebase](https://firebase.google.com) project
3. Get Google AdSense code (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd quickquiz
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Fill in your environment variables in `.env.local`:
```env
NEXT_PUBLIC_CONVEX_URL=your_convex_url_here
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

5. Start the development servers:
```bash
# Start Convex backend
npx convex dev

# Start Next.js frontend (in another terminal)
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
quickquiz/
├── src/
│   ├── app/
│   │   ├── admin/          # Admin dashboard and management
│   │   ├── quiz/           # Participant quiz attempt and results
│   │   └── page.tsx        # Landing page
│   └── lib/
│       ├── convex.ts       # Convex client setup
│       └── firebase.ts     # Firebase configuration
│       └── gmail-auth.ts   # Google Authentication helpers
├── convex/
│   ├── schema.ts           # Database schema
│   ├── admin.ts            # Admin backend functions
│   ├── participant.ts      # Participant backend functions
│   └── http.ts             # HTTP routes
└── README.md
```

## Usage

### For Admins

1. Navigate to `/admin` and sign in with Google
2. Create a new quiz with title, description, and timing
3. Configure randomization settings (optional)
4. Set up split questions: Add N questions and specify how many each participant should see
5. Add multiple choice questions with correct answers
6. Share the generated quiz link with participants
7. View real-time results and export to Excel/PDF

### For Participants

1. Open the quiz link shared by admin
2. Sign in with Google to start
3. Complete the quiz within the time limit (all questions on one page)
4. View your score and detailed results immediately after submission

## Split Questions Feature

The Split Questions feature allows admins to create quizzes with a large pool of questions and control how many questions each participant sees.

### How It Works

1. **Admin Setup**: Add N questions to a quiz (e.g., 15 questions)
2. **Configure Limit**: Specify how many questions each participant should see (e.g., 5 questions)
3. **Random Selection**: Each participant randomly receives the specified number of questions from the total pool
4. **Fair Assessment**: Every participant gets a different subset of questions, reducing cheating
5. **Accurate Scoring**: Scores are calculated based only on the questions each participant actually answered

### Use Cases

- **Large Question Banks**: Create comprehensive quizzes with 20+ questions but keep completion time reasonable
- **Different Difficulty Levels**: Mix easy and hard questions, random selection ensures variety
- **Anti-Cheating**: Participants can't share specific questions since everyone gets different sets
- **Flexible Testing**: Adjust question count based on time limits or assessment goals

### Example

If you add 15 questions and set "Questions per Participant" to 5:
- Each participant sees exactly 5 randomly selected questions
- Scores are calculated as X/5 (not X/15)
- Every participant likely gets a different combination of questions

## Database Schema

The application uses Convex with the following main tables:

- **admins**: Admin user accounts (linked to Firebase UID)
- **quizzes**: Quiz information, timing, randomization settings, and split questions configuration
- **questions**: Individual quiz questions and options
- **participants**: Participant user profiles (linked to Firebase UID)
- **submissions**: Quiz answers, scores, and timestamps

## Security Features

- One attempt per Google account per quiz
- Server-side quiz timing validation
- Rate limiting on submissions
- Secure Google Authentication for all users

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
