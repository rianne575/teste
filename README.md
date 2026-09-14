# Digital Clock - Multiple Time Zones 🌍⏰

A beautiful, responsive digital clock application that displays the current time across 12 different time zones around the world.

## Features

✨ **Key Features:**
- 🌐 Displays time in 12 different time zones
- 📱 Fully responsive design (mobile, tablet, desktop)
- 🎨 Modern gradient UI with smooth animations
- ⏱️ Real-time updates every second
- 🌙 Dark mode friendly gradient background
- 📍 Shows local timezone information
- ✅ Handles daylight saving time automatically

## Time Zones Included

1. **New York** - America/New_York (EST/EDT)
2. **London** - Europe/London (GMT/BST)
3. **Paris** - Europe/Paris (CET/CEST)
4. **Tokyo** - Asia/Tokyo (JST)
5. **Sydney** - Australia/Sydney (AEDT/AEST)
6. **Dubai** - Asia/Dubai (GST)
7. **São Paulo** - America/Sao_Paulo (BRT/BRST)
8. **Los Angeles** - America/Los_Angeles (PST/PDT)
9. **Hong Kong** - Asia/Hong_Kong (HKT)
10. **Singapore** - Asia/Singapore (SGT)
11. **Moscow** - Europe/Moscow (MSK)
12. **India** - Asia/Kolkata (IST)

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional dependencies required!

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rianne575/obrasegura-api.git
cd obrasegura-api
```

2. Open the application:
   - Simply open `index.html` in your web browser
   - Or use a local server:
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Python 2
     python -m SimpleHTTPServer 8000
     
     # Using Node.js (with http-server installed)
     http-server
     ```

3. Navigate to `http://localhost:8000` in your browser

## File Structure

```
obrasegura-api/
├── index.html      # HTML structure and clock elements
├── styles.css      # Styling and responsive design
├── script.js       # JavaScript logic for time updates
└── README.md       # This file
```

## How It Works

### HTML (`index.html`)
- Defines the structure with clock containers for each timezone
- Each clock has an ID for JavaScript targeting
- Includes a prominent local time display section

### CSS (`styles.css`)
- Responsive grid layout that adapts to different screen sizes
- Gradient background and modern card design
- Smooth hover effects and animations
- Mobile-first approach with media queries

### JavaScript (`script.js`)
- `getTimeInTimezone()` - Converts current time to specified timezone
- `updateClocks()` - Updates all clock displays
- `initClock()` - Initializes the clock on page load
- Handles visibility changes to ensure continuous updates

## Technical Details

### Time Zone Handling
The application uses the browser's built-in `Intl` API to convert time to different timezones:

```javascript
const timeString = now.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
});
```

### Update Mechanism
- Clocks update every 1 second using `setInterval()`
- Automatically handles daylight saving time transitions
- Continues updating even when tab is hidden (resumed on visibility)

### Responsive Design
- Grid layout with `auto-fit` and `minmax()` for flexibility
- Media queries for tablet (768px) and mobile (480px) breakpoints
- Touch-friendly interface on mobile devices

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome  | ✅ Full support |
| Firefox | ✅ Full support |
| Safari  | ✅ Full support |
| Edge    | ✅ Full support |
| IE 11   | ⚠️ Partial support (limited timezone data) |

## Customization

### Adding More Time Zones
Edit the `timeZones` array in `script.js`:

```javascript
const timeZones = [
    // ... existing timezones
    { id: 'bangkok', name: 'Asia/Bangkok', element: 'clock-bangkok' },
];
```

Then add the HTML element in `index.html`:
```html
<div class="clock">
    <div class="timezone-name">Bangkok</div>
    <div class="timezone-code">ICT</div>
    <div class="time" id="clock-bangkok">00:00:00</div>
</div>
```

### Changing Colors
Modify the gradient in `styles.css`:
```css
body {
    background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

## Performance

- **No external dependencies** - Pure HTML/CSS/JavaScript
- **Lightweight** - Total size < 50KB
- **Efficient updates** - Single interval for all timezones
- **Optimized rendering** - Only updates DOM when necessary

## Known Limitations

1. Timezone data depends on browser's system timezone database
2. May require internet for first-time timezone database load on some browsers
3. Historical timezone data not included (only current time)

## Future Enhancements

- [ ] Add analog clock display option
- [ ] Add timezone search/filter functionality
- [ ] Support for 24/12 hour format toggle
- [ ] Add timezone offset calculator
- [ ] Dark/Light theme toggle
- [ ] Settings persistence (local storage)
- [ ] Add more timezone options

## License

This project is open source and available under the MIT License.

## Author

Created by **rianne575**

## Support

For issues, bugs, or feature requests, please open an issue on GitHub.

---

**Enjoy your global digital clock! 🌍⏰**
