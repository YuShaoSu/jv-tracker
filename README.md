# Japanese Vocabulary Tracker

A modern web application for tracking Japanese vocabulary learning progress with Google Sheets integration.

## 🌟 Features

- **📚 Vocabulary Management**: Add, edit, and organize Japanese words with kanji, readings, and meanings
- **📊 Progress Tracking**: Track learning status (Learning, Know Well, Often Forget)
- **💬 AI-Generated Examples**: Generate contextual example sentences with caching
- **☁️ Google Sheets Sync**: Secure synchronization with Google Sheets via Apps Script
- **📱 Mobile Responsive**: Optimized for mobile, tablet, and desktop
- **🔄 Cross-Device Sync**: Access your vocabulary from any device
- **⚡ Fast Performance**: Local storage with cloud backup

## 🚀 Demo

Visit the live demo: [https://yushaosu.github.io/jv-tracker](https://yushaosu.github.io/jv-tracker)

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
git clone https://github.com/YuShaoSu/jv-tracker.git
cd jv-tracker
npm install
```

### 2. Development

```bash
npm start
```

Opens the app at [http://localhost:3000](http://localhost:3000)

### 3. Build for Production

```bash
npm run build
```

### 4. Deploy to GitHub Pages

```bash
npm run deploy
```

## 📊 Google Sheets Integration

### Setup Google Apps Script Backend

1. **Create Google Sheet**:
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new spreadsheet
   - Copy the Sheet ID from the URL

2. **Deploy Apps Script**:
   - Go to [Google Apps Script](https://script.google.com)
   - Create new project
   - Copy the code from `google-apps-script.js`
   - Update `CONFIG.SHEET_ID` with your Sheet ID
   - Deploy as Web App (Execute as: Me, Access: Anyone)
   - Copy the deployment URL

3. **Connect to App**:
   - Open your vocabulary tracker
   - Go to Settings ⚙️
   - Paste your Apps Script URL
   - Click "Connect to Apps Script"

### Google Sheet Structure

The app automatically creates these columns:

| Kanji | Reading | Meaning | Status | Date Added | Examples | ID |
|-------|---------|---------|--------|------------|----------|-------|
| 勉強  | べんきょう| study   | learning| 2024-01-01 | ["例文..."] | 1 |

## 🎯 Usage

### Adding Vocabulary
1. Click "Add Word" button
2. Enter Kanji/Word, Reading, and Meaning
3. Word is automatically set to "Learning" status

### Tracking Progress
- **Often Forget** (Red): Words you struggle with
- **Learning** (Yellow): Words you're currently studying  
- **Know Well** (Green): Words you've mastered

### Example Sentences
- Click "Show Example" to generate contextual sentences
- Examples are cached to reduce API calls
- Multiple examples can be generated per word

### Syncing Data
- **Manual Sync**: Click sync button to save to Google Sheets
- **Cross-Device**: Use same Apps Script URL on all devices
- **Offline Mode**: App works offline, syncs when connected

## 🏗️ Architecture

```
Frontend (React) ↔ Google Apps Script ↔ Google Sheets
```

- **Frontend**: React app with Tailwind CSS
- **Backend**: Google Apps Script (serverless)
- **Database**: Google Sheets
- **Authentication**: Google OAuth (handled by Apps Script)

## 🔒 Security

- **No API Keys Exposed**: All authentication handled server-side
- **Private Data**: Your vocabulary stays in your Google account
- **Secure Communication**: HTTPS-only connections
- **CORS Compliant**: Proper cross-origin resource sharing

## 📱 Mobile Features

- **Touch Optimized**: Large touch targets for mobile use
- **Responsive Design**: Adapts to all screen sizes
- **Fast Loading**: Optimized for mobile networks
- **Offline Support**: Works without internet connection

## 🛠️ Tech Stack

- **Frontend**: React 18, Tailwind CSS, Lucide React
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **Deployment**: GitHub Pages / Vercel / Netlify
- **Build Tool**: Create React App

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/YuShaoSu/jv-tracker/issues) page
2. Create a new issue with details
3. Include browser/device information

## 🎉 Acknowledgments

- Built with Create React App
- Icons by Lucide React
- Fonts by Google Fonts (Noto Sans JP)
- Styling by Tailwind CSS
