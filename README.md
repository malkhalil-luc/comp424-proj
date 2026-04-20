# G4 Assignment. Internal Employee Portal 

## How to run

- Run locally:    
    Run in terminal:
        ```
        python3 -m http.server 4040
        ```
    Type in a browser: `http://localhost:4040/`

- Run deployed version:
    Type URL in browser: `https://malkhalil-luc.github.io/comp424-proj/`

## Feature list

- Demo **login** (admin vs staff) with session persistence.
- **Dashboard:** stats, pinned announcements, upcoming events, Chicago weather, quick actions.
- **Support:** ticket list, filters, sort, detail, new ticket, admin/staff flows, loading/error/retry/stale for the ticket load path.
- **News, Announcements, Directory, Calendar:** browse, search, filters where applicable; admin create/edit for content sections; **StatusBanner** on each section for load / error / stale.

## Module map
| Module | Role |
| :--- | :--- |
| `js/main.js` | Startup: session, hash ↔ section sync, binds all feature events, loads data, drives the render loop |
| `js/state.js` | Shared state fields and **selector** functions (`getVisibleTickets`, filters, sorts, counts). No DOM |
| `js/api.js` | Firestore + `fetch` for JSON assets, timeouts, validation helpers, ticket cache / fallback patterns |
| `js/render.js` | Orchestrates which section is visible; mounts **StatusBanner**, **SearchBar**, **FilterChips**, **LoginPanel**; delegates list/detail renderers |
| `js/dom.js` | `querySelector` lookups used across the app |
| `js/lib/dom-builder.js` | Small `el()` helper from the course (Week 11) for building DOM trees |
| `js/firebase.js` | Firebase app + Firestore exports (CDN ES modules) |
| `js/data/storage.js` | `localStorage` for session user id and ticket cache |
| `js/events/*.js` | Click/submit handlers per feature; call `api` then `render` |
| `js/render/*-render.js` | List + detail (and dashboard cards) for each section |
| `js/components/search-bar.js` | Search input + clear + optional **visible count** summary (`el()` from `lib/`) |
| `js/components/filter-chips.js` | Facet chip group (`el()` from `lib/`) |
| `js/components/login-panel.js` | Demo login UI (`el()` from `lib/`) |
| `js/components/status-banner.js` | Loading / error + retry / stale messages (contract in file header; uses `el()`) |

## Component contracts

#### SearchBar
Renders the search UI used in all sections.
```
// Component: SearchBar
// Input: { query, onInput, onClear, inputId?, labelText?, placeholder?, summaryText? }
// Output: DOM nodes mounted inside `container`
// Events: onInput(value), onClear()
// Dependencies: lib/dom-builder.js
```

#### FilterChips
Renders reusable chip-based filters.
```
// Component: FilterChips
// Input: { chips, activeValue, onChange, ariaLabel }
// Output: DOM nodes mounted inside `container`
// Events: onChange(value)
// Dependencies: lib/dom-builder.js
```

#### LoginPanel
Renders the demo login screen
```
// Component: LoginPanel
// Input: { users, selectedUserId, onChange, onLogin }
// Output: DOM nodes mounted inside `container`
// Events: onChange(userId), onLogin()
// Dependencies: lib/dom-builder.js
```

#### StatusBanner
Renders the shared loading, error, retry, and stale-data UI pattern.
```
// Component: StatusBanner
// Input: { isLoading, error, staleMessage, loadingMessage? }
// Output: DOM nodes mounted inside `container` (may be empty)
// Events: onRetry()
// Dependencies: lib/dom-builder.js
```
## Testing summary

14  manual test cases created and executed covering the project’s core features. The plan included all three required categories success, edge-case, and failure-mode tests. The tested feature areas included Login/Navigation, Support, Dashboard, Announcements/News, and Directory/Calendar.

The final test plan recorded actual results for every test case and was used to identify different issues. After fixes were applied, the original failing tests were re-run to confirm the fixes.

### Summary numbers
- Total test cases: 14
- Features covered: 5
- Success-path cases: 5
- Edge-case cases: 5
- Failure-mode cases: 4
- Bugs documented and fixed: 8 documented
- Final pass rate: 14/14 PASS after fixes

## Known issues / limitations

- Firebase authentication not implemented.
- The login system is a demo , not secure production authentication. It uses seeded users and local session storage instead of real Firebase Authentication.
- A cold offline reload may show the browser’s own offline page before the app runs, because the project is based on client side setup. 
- The weather widget depends on the external Open-Meteo API, so weather can fail independently even when the rest of the dashboard is working.
- Directory is currently a read-only feature backed by local JSON and does not provide admin editor.
- Local JSON fallbacks still depend on the local app server being available. They are fallback data sources, not full offline app-shell support.
- Support remains the richest live feature; some other sections are intentionally simpler to keep the project readable and aligned with course scope.
- The project is designed for the assignment/demo scope and does not include advanced enterprise features such as real role-based security, attachments, or logs.

## Deployed URL
 `https://malkhalil-luc.github.io/comp424-proj/`