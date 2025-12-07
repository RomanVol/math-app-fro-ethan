# Multiplication Tables Practice App: Implementation Documentation

## Purpose
A Next.js application for users to practice multiplication tables—specifically, products excluding multiples of 1, 2, or 10. The app provides rounds of exercises with performance tracking, persistence using browser localStorage, and a clear, data-driven user experience.

## Application Requirements

### Exercise Generation
- Generate all multiplication exercises where both operands are integers from 3 to 9 inclusive (i.e., 3x3 to 9x9), excluding any problem involving 1, 2, or 10 as a factor.
- Result: 49 unique exercises per round. Each exercise should have a unique identifier based on its operands (e.g., `"3x3"`).
- Present exercises in randomized order within each round.

### Exercise Rounds & Timer Behavior
- In each round, show all outstanding exercises sequentially.
- For each problem:
  - Start an internal timer (not visible to user) upon display.
  - User must submit their answer. If correct within 6 seconds, mark as correct and store elapsed time.
  - If the answer is wrong or not submitted within 6 seconds, mark as failed, show the correct solution, set elapsed time to 6.0 seconds.
- Only failed exercises return for the next round (incorrect or timed out).
- Continue until all problems are solved correctly within 6 seconds or the user hits the stop button.

### UI Requirements
- Timer must be hidden; do not indicate time constraints visually.
- After each round, display for each exercise:
  - Problem (operands)
  - User's answer
  - Correctness
  - Time taken
  - If user performance improved, deteriorated, or stayed the same for each exercise versus prior round
- Show total elapsed round time.
- Enable user to proceed using a "Continue to Next Round" button; persist results after each round.

### State Management & Persistence
- Store all result data in browser localStorage.
- Persist per-exercise data: round number, exercise ID, operands, answers, correctness, time, improvement status, and timestamps.
- Save global state: current round, pending exercises, session ID, for seamless session restoration.
- If saving fails, gracefully display an error, halt user activity, and provide a retry option.
- Ensure that if a user interrupts mid-exercise, their progress is saved so the session can resume later.

### Technical Constraints
- Use Next.js and adhere to SOLID design principles.
- Style exclusively with Tailwind CSS.
- Write components adhering to the Single Responsibility Principle.

---

## LocalStorage Schema

### Storage Keys
- `math-practice-session`: Current session data
- `math-practice-rounds`: Array of completed rounds

### Session Structure
```json
{
  "id": "uuid",
  "user_id": "string|null",
  "start_time": "timestamp",
  "end_time": "timestamp|null",
  "status": "in_progress|completed|stopped",
  "current_round": 1,
  "pending_exercises": ["3x4", "5x6"],
  "active_exercise": "3x4"
}
```

### Round Structure
```json
{
  "id": "uuid",
  "round_number": 1,
  "total_time_sec": 68.3,
  "exercises": [
    {
      "exercise_id": "3x4",
      "factors": [3, 4],
      "user_answer": 12,
      "correct": true,
      "time_taken_sec": 2.3,
      "result": "improved|deteriorated|same|first"
    }
  ],
  "created_at": "timestamp"
}
```

---

## Data Structures

### Exercise Fields
- `exercise_id`: String, unique for operand pair (e.g., '3x4')
- `factors`: Array of two integers (operands)
- `user_answer`: Integer value
- `correct`: Boolean
- `time_taken_sec`: Float, duration in seconds (max 6.0)
- `result`: Enum ('improved', 'deteriorated', 'same', 'first')

### Session & Round Fields
- `session_id`: Unique session identifier
- `user_id`: Optional user identifier (string/uuid)
- `start_time`, `end_time`: UTC timestamps
- `status`: 'in_progress', 'completed', 'stopped'
- `round_number`: Integer
- `total_time_sec`: Float, sum of exercise durations for the round
- `exercises`: Array of exercise records as described above

---

## Error Handling
- On localStorage failure: stop all activity, show an error message, and allow retrying data persistence.
- On user interruption during exercises: save all progress to enable later resumption.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main app entry point
│   ├── layout.tsx            # App layout
│   └── globals.css           # Global styles
├── components/
│   ├── ExerciseDisplay.tsx   # Single exercise UI
│   ├── RoundSummary.tsx      # Round results display
│   ├── SessionControls.tsx   # Start/Stop/Continue buttons
│   ├── SessionComplete.tsx   # Completion screen
│   ├── ErrorDisplay.tsx      # Error handling UI
│   ├── LoadingSpinner.tsx    # Loading state
│   ├── PracticeApp.tsx       # Main orchestration component
│   └── index.ts              # Component exports
├── hooks/
│   └── useExerciseTimer.ts   # Timer management
├── lib/
│   ├── storage.ts            # LocalStorage operations
│   ├── exercises.ts          # Exercise generation
│   └── types.ts              # TypeScript types
└── context/
    └── AppContext.tsx        # Global app state
```

## Getting Started

1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Open http://localhost:3000

No additional setup required - data is stored in browser localStorage.
