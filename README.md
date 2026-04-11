# Assignment G3

## How to Run
Run in terminal: 
```
python3 -m http.server 4040
```
Type in browser: `http://localhost:4040/`

## Module Map

| Module | Responsibilities |
| :--- | :---- |
| **js/main.js** | <li>Application bootstrap</li><li>Binds app events and support events</li><li>Starts the initial data load</li><li>Passes callbacks into the render layer</li> |
| **js/api.js** | <li>Loads ticket data from Firestore </li><li>Seeds Firestore from data/tickets.json when needed</li><li>Falls back to cached localStorage data and local JSON when live loading fails</li><li>Applies resilience patterns such as timeout, structured errors, retry support, and data validation</li><li>Creates new tickets and persists local-only fallback tickets when Firebase is unavailable</li> |
| **js/state.js** | <li>Contains the single application state object</li><li>Contains selector functions that derive visible and selected ticket data</li> |
| **js/render.js** |<li>Orchestrates visible UI states.</li><li>Renders loading, error, stale-data, empty, and success states</li><li>Mounts the extracted SearchBar component</li><li>Delegates ticket list and detail rendering to the support render module</li> |
| **js/dom.js** | <li>Centralizes DOM element references used across the app</li> |
| **js/render/support-render.js** | <li>Renders the support ticket list and the selected ticket detail panel.</li> |
| **js/events/app-events.js** | <li>Handles shell-level UI events such as sidebar toggle and backdrop behavior</li> |
| **js/events/support-events.js** | <li>Handles support feature events such as ticket selection, form submission, and ticket creation flow.</li> |
| **js/components/search-bar.js** | <li>Extracted component for search input and clear action</li><li>Receives data and callbacks through arguments instead of importing state or render logic</li> |
| **js/data/storage.js** | <li>Reads and writes cached ticket data and cache timestamps in localStorage</li> |
| **js/firebase.js** | <li>Initializes Firebase and exports Firestore helpers used by api.js</li> |

## Component Contract
- **SearchBar**
```
// Component: SearchBar
// Input: { query, onInput, onClear }
// Output: DOM nodes mounted inside `container`
// Events: onInput(value), onClear()
// Dependencies: none

```
## Resilience Patterns Applied
The following resilience patterns applied in js/api.js:

- Timeout with AbortController
    - fetchTicketsJson() uses an AbortController with a timeout to stop slow JSON requests.
    - Firestore loading is also wrapped with withTimeout(...) so a slow request does not hang forever

- Structured error messages
    - ApiError, toStructuredError(...), and toUserMessage(...) classify errors into categories such as:
        - timeout, network, HTTP, parse, validation, unknown

- Retry action in the UI
    - The visible Try Again button in the error banner calls the same load path again from main.js.

- Data validation
    - isValidTicket(...) and assertValidTickets(...) validate the ticket shape before rendering fetched data.

- Stale-data notice
    - When live loading fails but cached data is available, the app shows a stale-data message indicating cached data is being served.

## Current Feature Status
- **Working now:**
    - Support ticket list rendering
    - Ticket detail panel
    - Search filtering
    - Empty state when no tickets match the current query
    - Loading state during ticket fetch
    - Error state with visible retry button
    - Stale-data notice when cached data is shown
    - Firestore as the live data source
    - Local JSON seed/fallback
    - localStorage cache fallback
    - New ticket form with validation
    - Local-only ticket save fallback when Firebase is unavailable
    - Responsive sidebar and mobile detail behavior

- **Still limited / in progress:**
    - Full offline startup after a hard refresh is not guaranteed because Firebase still depends on external module loading.
    - The branch is intentionally scoped to the Support feature for the G3 assignment.
    - Other portal sections were removed from scope for this assignment to match the assignment handout requirements .