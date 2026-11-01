# Web app: where code goes

```
src/
  app/                   routes only: page.tsx and layout.tsx, a few lines that render a feature
    (auth)/              login, register, forgot and reset password
    page.tsx             the landing page at /
    (dashboard)/         learner screens; its layout.tsx sends anyone signed out to /login
      (shell)/           the screens inside the sidebar and top bar: /dashboard, /learn, /practice, /progress, /account
      diagnostic/ session/  full-screen: the placement test and the study session
    (legal)/             privacy and terms
  features/<name>/       everything for one feature: components/, api.ts, small helpers
    account/  auth/  dashboard/  diagnostic/  landing/  learning/  legal/  progress/  shell/
  components/ui/         shared building blocks: Button, Icon, Input, Markdown, MermaidDiagram
  components/editor/     the one C++ code editor, for the placement test and exercises
  lib/api/client.ts      fetch wrapper: the API's envelope, errors and token refresh
  lib/api/learning.ts    the learning calls the screens share: progress, exercises, hints, lessons, sessions
  lib/courses.ts         the two courses with their topics, shared by the learner screens and the placement test
packages/types           request and response types shared with the API
```

- **A new screen**: add `app/(dashboard)/(shell)/<route>/page.tsx` (or outside `(shell)` for a full-screen one) and `features/<name>/`.
- **The learner's course** is `useActiveCourse()` (features/shell): the course of their latest finished placement test. Login sends a learner who has none to `/diagnostic`.
- **A new endpoint**: put its types in `packages/types`, its calls in `features/<name>/api.ts` (or `lib/api/learning.ts` when several screens share it), and use `api()` from `lib/api/client.ts`.
- **Colours**: use the tokens in `app/globals.css` (`bg-page`, `bg-panel`, `bg-code`…), not hex values. Add a token there when a new shade is needed.
- **Text from the API in markdown** (exercise prompts, lessons): render it with `components/ui/Markdown`, never with `dangerouslySetInnerHTML` directly.
- Run against the deployed API without a local backend: see "Web app only" in the root `README.md`.
