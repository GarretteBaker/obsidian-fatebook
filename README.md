# Fatebook Predictions for Obsidian

Create [Fatebook](https://fatebook.io) predictions directly within Obsidian and preview them via hover tooltips.

## Features

- Create new Fatebook predictions without leaving Obsidian
- Hover over Fatebook links to preview predictions
- Automatic markdown link generation for easy sharing

## Installation

This plugin is not available in the Obsidian Community Plugins store. To install:

1. Open Terminal/Command Prompt
2. Navigate to your vault's plugin directory:
   ```bash
   cd /path/to/vault/.obsidian/plugins
   ```
3. Clone this repository (requires [Git](#installing-git)):
   ```bash
   git clone https://github.com/GarretteBaker/obsidian-fatebook.git fatebook-predictions
   ```
4. Enter the plugin directory:
   ```bash
   cd fatebook-predictions
   ```
5. Install dependencies and build (requires [Node.js and npm](#installing-nodejs-and-npm)):
   ```bash
   npm install
   npm run build
   ```
6. Restart Obsidian
7. Enable the plugin in Settings → Community plugins

## Setup

1. Get your Fatebook API key from [fatebook.io](https://fatebook.io)
2. Open Obsidian Settings
3. Go to "Fatebook Predictions" settings tab
4. Enter your API key

## Usage

### Creating Predictions

1. Use the command palette (Ctrl/Cmd + P) and search for "Create New Prediction"
2. Fill in:
   - Question: What you're predicting
   - Forecast: Your probability estimate (0-1)
   - Resolve By: Resolution date (YYYY-MM-DD)
3. Click "Create Prediction"
4. A markdown link will be copied to your clipboard

### Viewing Predictions

Hover over any Fatebook link to see a preview of the prediction.

## Development

To work on the plugin:

1. Clone as described in Installation
2. `npm run dev` to start compilation in watch mode

## Appendix: Development Prerequisites

### Installing Git

1. **Windows**: Download and install from [git-scm.com](https://git-scm.com/)
2. **macOS**: Install via [Homebrew](https://brew.sh) with `brew install git`
3. **Linux**: Use your package manager (e.g., `apt install git` on Ubuntu)

### Installing Node.js and npm

1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Choose the LTS (Long Term Support) version
3. npm is included with Node.js
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

## Support

If you encounter issues or have feature requests, please [open an issue](https://github.com/GarretteBaker/obsidian-fatebook/issues) on GitHub.
