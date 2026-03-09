# Commit 1: state object + DOM references + sidebar toggle

## What does this commit do

- Sidebar toggle works on all screen sizes
- Loads tickets from localStorage first, falls back to tickets.json
- Renders the ticket list with status badges and dates
- Shows the placeholder in the detail panel
- Shows error banner if loading fails
- Shows empty state if search returns nothing

---

## DevTools checks 

- Console: app.js loaded appears, zero errors
- Network tab: tickets.json returns 200 OK 
- Ticket list:  4 tickets appear with status badges and dates
- Application tab → localStorage — portal-tickets-v1 key exists after first load
- Sidebar toggle — works on desktop (collapses) and mobile (overlay)

---

# Commit 2: enable ticket selection to display ticket details

## What does this commit do
This commit adds ticket selection interaction.
- Add selectedTicketId state (initially null)
- Add click handler to each ticket row
- Update detail panel to render the selected ticket's details when selectedTicketId is set
- Highlight the selected ticket row in the list
- Add a "Back" / deselect action that resets selectedTicketId to null and returns panel to
placeholder

---

## DevTools check

- Click any ticket → detail panel fills with that ticket's info
- Click same ticket again → detail panel returns to placeholder
- Click a different ticket → detail panel switches
- Selected row has blue border + light blue background
- On mobile → Back button appears, clicking it clears selection
- Console → zero errors