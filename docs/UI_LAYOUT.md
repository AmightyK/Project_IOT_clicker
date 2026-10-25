# Interface layout revision

## Changes

- Keep each portal's existing palette: blue/orange for teachers, purple/pink for students, green for parents.
- Replace the oversized teacher launch tile with a compact session banner.
- Group four primary metrics, quick actions, recent sessions, tasks, and sharing links into separate sections. Lecture and AI usage totals remain available below the quick actions.
- Give the recent-session table a separate, keyboard-accessible horizontal scroll area on small screens.
- Wrap the teacher header into two rows at narrower widths; keep dropdown menus inside the viewport.
- Simplify student cards and sidebar spacing. Stop looping decorative motion in the overview mascot and authentication illustrations.
- Keep parent progress and account navigation visible on mobile, and prevent the account grid from expanding beyond a 320px screen.
- Use a dedicated `web/assets/layout.css`, loaded after the existing portal styles and versioned through the existing `av()` helper.
- Refresh the repository README with an architecture diagram, screenshots, a compact directory map, setup links, and the team list.

## Verification

Verified on 25 October 2026 using a disposable MariaDB database and PHP development server. Test accounts, classes, answers, and screenshots contain synthetic data.

| Suite | Result |
| --- | --- |
| Existing web/database integration suites (`tests/run_local.sh`) | 830 checks passed; 0 PHP warnings |
| Responsive layout checks (`tests/layout_smoke.cjs`) | 60 checks passed |
| Existing browser interaction smoke test (`tests/ui_smoke.cjs`) | 5 checks passed |
| PHP syntax in changed PHP files | Passed |
| JavaScript syntax in both browser test scripts | Passed |

Layout checks cover login, teacher dashboard/classes/homework, student overview/homework, and parent progress/account at widths of **320, 390, 768, 1024, and 1440px**. They check document overflow, dropdown boundaries, Escape handling, the active student navigation marker, and visible parent navigation. External network requests are blocked in this suite.

The interaction smoke test checks KaTeX rendering, drawing on a canvas, attaching and saving the drawing, the student layout at 390px, and JavaScript page errors. Its selectors were updated for the current collapsible homework form, radio inputs, and parent login form.

The test machine required the locally installed PHP `pdo_mysql` and `iconv` extensions to be enabled. Dependencies and database files were kept outside the repository.

## Limits

Browser verification used Chromium. This revision did not repeat physical BLE/radio measurements, microphone permission tests, or deployment to a live classroom/cloud server.

## Preview images

- [Teacher desktop](screenshots/dashboard-desktop.png)
- [Teacher mobile](screenshots/dashboard-mobile.png)
- [Student desktop](screenshots/student-desktop.png)
- [Parent desktop](screenshots/parent-desktop.png)
