# Standup Timer Chrome Extension

A Chrome extension designed to help teams manage their standup meetings more effectively by tracking speaking time for each team member. The extension helps promote balanced participation and improves meeting efficiency.

## Features

- **Individual Member Timers**: Track speaking time for each team member during standup meetings
- **Historical Data**: View previous meeting speaking times for each team member
- **Smart Ordering**: Team members are automatically sorted based on their speaking time from the previous meeting, prioritizing those who spoke the least
- **Visual Indicators**: Easily see who's currently speaking and how long each person has talked
- **Meeting Statistics**: End meetings to save data and prepare for the next session
- **Easy Reset**: Clear all statistics when needed

## Installation

### From Chrome Web Store

*Coming soon*

### Manual Installation (Developer Mode)

1. Clone this repository or download it as a ZIP file and extract it
   ```
   git clone https://github.com/yourusername/standup-timer-extension.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top-right corner

4. Click "Load unpacked" and select the directory containing the extension files

5. The extension should now appear in your Chrome toolbar

## Usage

### First-time Setup

1. Click on the Standup Timer extension icon in your Chrome toolbar
2. Add your team members (names and optional avatar URLs)
3. Save your team configuration

### During a Meeting

1. Open the extension by clicking its icon
2. When a team member starts speaking, click the "Start" button next to their name
3. The timer will track their speaking time
4. When they finish, click "Pause"
5. Continue with the next team member

### After a Meeting

1. Click "End Meeting" to save the current meeting data
2. For your next meeting, team members will be sorted with those who spoke less in the previous meeting appearing first
3. Use "Clear Stats" if you want to reset all historical data

## How it Works

The extension uses Chrome's storage API to save meeting data. Team members with less speaking time in the previous meeting are prioritized in the next meeting's order, encouraging balanced participation. The extension automatically tracks active speakers and provides visual feedback about current and historical speaking times.

## Technical Details

- Built with vanilla JavaScript
- Uses Chrome Extension APIs for storage and UI integration
- Designed with a clean, responsive interface
- Optimized for performance and minimal resource usage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all the developers who have contributed to this project
- Inspired by the need for more efficient standup meetings in remote teams
