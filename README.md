# Commit 1: state object + DOM references + sidebar toggle

## What does this commit do

- Sidebar toggle works on all screen sizes
- Loads tickets from localStorage first, falls back to tickets.json
- Renders the ticket list with status badges and dates
- Shows the placeholder in the detail panel
- Shows error banner if loading fails
- Shows empty state if search returns nothing


## DevTools checks 

- Console: app.js loaded appears, zero errors
- Network tab: tickets.json returns 200 OK 
- Ticket list:  4 tickets appear with status badges and dates
- Application tab → localStorage — portal-tickets-v1 key exists after first load
- Sidebar toggle — works on desktop (collapses) and mobile (overlay)

---

# Commit 2: Enable ticket selection to display ticket details

## What does this commit do
This commit adds ticket selection interaction.

- Add selectedTicketId state (initially null)
- Add click handler to each ticket row
- Update detail panel to render the selected ticket's details when selectedTicketId is set
- Highlight the selected ticket row in the list
- Add a "Back" / deselect action that resets selectedTicketId to null and returns panel to placeholder


## DevTools check

- Click any ticket → detail panel fills with that ticket's info
- Click same ticket again → detail panel returns to placeholder
- Click a different ticket → detail panel switches
- Selected row has blue border + light blue background
- On mobile → Back button appears, clicking it clears selection
- Console → zero errors

---
# Commit 3: Add ticket creation form with localStorage persistence and search filter

## What does this commit do
This commit enables filtering and new ticket submission. 

- Add showNewTicketForm, status, successMessage, errorMessage states
- Add "Create New Ticket" button and ticket creation form with required fields
- On "Cancel": hide form
- On "Submit" with empty fields: show inline validation error, form stays open
- On "Submit" with valid data: write to localStorage; if success, prepend ticket, show success message, hide form; if write fails, show error inline, ticket not added
- Add ticketQuery state (initially "")
- Add a search input field above the ticket list
- Filter the displayed ticket list in real time based on ticketQuery
- Display "No results found" message when no tickets match the input
- Clearing the search input restores the full list

## DevTools check

- Type in search box → list filters in real time
- Clear search → all tickets return
- Type something with no match → empty state message appears
- Click + Create New Ticket → form slides into view, cursor lands in Title field
- Click Cancel → form hides, inputs cleared
- Submit empty form → both error messages appear in red
- Fill in title only → only description error appears
- Fill both and submit → ticket appears at top of list with Open badge
- Refresh page → new ticket still there (saved in localStorage)
- Console → zero errors throughout

---

# Commit 4: Integrate Firebase Firestore as primary data source with localStorage cache fallback

## What does this commit do

- Replaces localStorage as the primary data source with Firestore
- On first load, if Firestore is empty, it loads data from tickets.json
- New tickets are written to Firestore and get a real document ID back
- localStorage kept as an offline cache fallback

## DevTools check
- Console → zero errors
- Firebase Console → Firestore → tickets collection has 4 seed documents
- Create a ticket → new document appears in Firestore instantly
- Refresh → all tickets still there, loaded from Firestore
- Application tab → localStorage → portal-tickets-v1 key exists as cache

---
