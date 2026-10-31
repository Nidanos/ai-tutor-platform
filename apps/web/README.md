# Web app: where code goes

```
src/
  app/                   routes only: page.tsx and layout.tsx, a few lines that render a feature
    (auth)/              login, register, forgot and reset password
    (dashboard)/         learner screens; its layout.tsx sends anyone signed out to /login
    (legal)/             privacy and terms
  features/<name>/       everything for one feature: components/, api.ts, small helpers
    auth/  diagnostic/  legal/
  components/ui/         shared building blocks: Button, Input, Markdown
  components/editor/     the one C++ code editor, for the placement test and exercises
  lib/api/client.ts      fetch wrapper: the API's envelope, errors and token refresh
packages/types           request and response types shared with the API
```

- **A new screen** (home, practice, lessons, progress, account): add `app/(dashboard)/<route>/page.tsx` and `features/<name>/`.
- **A new endpoint**: put its types in `packages/types`, its calls in `features/<name>/api.ts`, and use `api()` from `lib/api/client.ts`.
- **Colours**: use the tokens in `app/globals.css` (`bg-page`, `bg-panel`, `bg-code`…), not hex values. Add a token there when a new shade is needed.
- **Text from the API in markdown** (exercise prompts, lessons): render it with `components/ui/Markdown`, never with `dangerouslySetInnerHTML` directly.
- Run against the deployed API without a local backend: see "Web app only" in the root `README.md`.
