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