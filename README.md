# Assignment G3

## How to Run
Run in terminal: 
```
python3 -m http.server 4040
```
Type in browser: `http://localhost:4040/`

## Module Map

| Module  | Responsibilities |
|  :---  | :---- |
| **js/main.js** | Application bootstrap. Binds app events and support events, starts the initial data load, and passes callbacks into the render layer |
| **js/api.js** | Loads ticket data from Firestore, seeds Firestore from data/tickets.json when needed, falls back to cached localStorage data and local JSON when live loading fails, applies resilience patterns such as timeout, structured errors, retry support, data validation, and Promise.allSettled(), and creates new tickets with local-only fallback when Firebase is unavailable |
| **js/state.js** | Contains the single shared state object with named fields such as query, activeFilter, selectedId, sortBy, isLoading, error, staleNotice, and lastLoadedAt. Contains selector functions such as getFilteredTickets(), getSortedTickets(), getVisibleTickets(), and getSelectedTicket(). Contains no DOM references or rendering logic |
| **js/render.js** |Orchestrates visible UI states, renders loading, error, stale-data, empty, and success states, mounts the extracted SearchBar component, and delegates ticket list/detail rendering to the support render module |
| **js/dom.js** | Centralizes DOM element references used across the app |
| **js/render/support-render.js** | Renders the support ticket list and selected ticket detail panel using derived data from selectors. |
| **js/events/app-events.js** | Handles shell-level UI events such as sidebar toggle and backdrop behavior |
| **js/events/support-events.js** | Handles support feature events such as ticket selection, form submission, and ticket creation flow |
| **js/components/search-bar.js** |  Extracted component for search input and clear action. Receives data and callbacks through arguments instead of importing state or render logic. |
| **js/data/storage.js** | Reads and writes cached ticket data and cache timestamps in localStorage|
| **js/firebase.js** | Initializes Firebase and exports Firestore helpers used by api.js |

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
    - createAbortControllerWithTimeout() and fetchTicketsJson() use AbortController to stop slow JSON requests after a reasonable timeout
    - Firestore loading is also wrapped with withTimeout(...) so a slow request does not hang forever

- Structured error messages
    - ApiError, toStructuredError(...), and toUserMessage(...) classify errors into categories such as:
        - timeout, network, HTTP, parse, validation, unknown

- Retry action in the UI
    - The visible Try Again button in the error banner calls the same load path again from main.js.

- Data validation
    - isValidTicket(...) and assertValidTickets(...) validate the ticket shape before rendering fetched data.

- Graceful degradation with Promise.allSettled()
    - loadFallbackTickets() uses Promise.allSettled() to try cached local data and local JSON fallback when live Firestore loading fails.

- Stale-data notice
    - When live loading fails but cached data is available, the app shows a stale-data message indicating cached data is being served and when it was last refreshed. 

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
    - Full offline startup after a hard refresh is not implemented.
    - The branch is intentionally scoped to the Support feature for the G3 assignment.
    - Role-based access for admin and regular users is planned.
    - Other portal sections were removed from scope for this assignment to match the assignment handout requirements .
    - Firebase Authentication is not implemented in this demo branch, so Firestore access is currently based on open project rules.