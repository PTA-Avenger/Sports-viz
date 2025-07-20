# 🏆 Sports Analytics Dashboard

A modern, AI-powered sports data visualization platform that provides comprehensive analytics across multiple sports including Baseball, Basketball, Football, NFL, NBA, and Formula 1.

![Sports Analytics Dashboard](https://img.shields.io/badge/Sports-Analytics-blue?style=for-the-badge&logo=chart-line)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
![AI](https://img.shields.io/badge/AI_Powered-FF4081?style=for-the-badge&logo=robot&logoColor=white)

## 🌟 Features

### 📊 **Multi-Sport Analytics**
- **⚾ Baseball**: OPS, ERA, batting averages, pitching stats
- **🏀 Basketball/NBA**: PPG, RPG, APG, PIE metrics
- **⚽ Football**: Goals, assists, xG (Expected Goals)
- **🏈 NFL**: Passing/rushing yards, touchdowns, team stats
- **🏎️ Formula 1**: Points, wins, constructor standings

### 🎨 **Modern UI/UX**
- **Glassmorphism Design**: Beautiful translucent cards with backdrop blur
- **Gradient Backgrounds**: Professional purple-to-blue gradients
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Font Awesome Icons**: Professional iconography throughout
- **Smooth Animations**: Hover effects and transitions

### 📈 **Interactive Visualizations**
- **Multiple Chart Types**: Scatter plots, bar charts, line graphs, heatmaps
- **Customizable Axes**: Choose X and Y metrics from sport-specific options
- **Season Selection**: Multi-year data comparison (2019-2024)
- **Real-time Updates**: Charts update instantly with new selections
- **Interactive Tooltips**: Detailed information on hover

### 🤖 **AI-Powered Insights**
- **Google Gemini Integration**: Advanced AI analysis of sports data
- **Smart Recommendations**: AI-suggested teams and insights
- **Interactive Chat**: Ask questions about team performance and trends
- **Predictive Analytics**: Forecast future performance trends

### 🔄 **Data Management**
- **Multi-API Integration**: Real-time data from multiple sports APIs
- **Smart Caching**: 6-hour cache duration for optimal performance
- **Fallback System**: Mock data when APIs are unavailable
- **Rate Limiting**: Prevents API quota exhaustion

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Sports API keys (API-Sports, RapidAPI)
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/PTA-Avenger/Sports-viz.git
   cd Sports-viz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your API keys:
   ```env
   SPORTS_API_KEY=your_rapidapi_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🛠️ Technology Stack

### **Backend**
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **Axios**: HTTP client for API requests
- **File-based Caching**: Local JSON cache storage
- **Rate Limiting**: Express rate limiter middleware

### **Frontend**
- **Vanilla JavaScript**: Modern ES6+ features
- **Chart.js**: Interactive data visualizations
- **CSS Grid & Flexbox**: Modern responsive layouts
- **CSS Custom Properties**: Consistent design system
- **Font Awesome**: Professional icons

### **AI Integration**
- **Google Gemini**: Advanced language model
- **Custom Prompts**: Sports-specific analysis
- **Contextual Responses**: Data-aware AI insights

### **APIs**
- **API-Sports**: Baseball, Basketball, Football, NFL, NBA
- **Ergast F1**: Formula 1 data
- **OpenF1**: Alternative F1 data source

## 📁 Project Structure

```
sports-viz/
├── src/
│   ├── routes/
│   │   ├── api.js          # Sports data API routes
│   │   └── ai.js           # AI chat and insights routes
│   ├── models/
│   │   └── dataFetcher.js  # Data fetching utilities
│   └── server.js           # Express server setup
├── public/
│   ├── index.html          # Main HTML file
│   ├── style.css           # Modern CSS styling
│   └── script.js           # Frontend JavaScript
├── cache/                  # Cached API responses
├── .env.example           # Environment variables template
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🎯 Usage Guide

### **1. Select Your Sport**
Choose from Baseball, Basketball, Football, NFL, NBA, or Formula 1 using the sport dropdown.

### **2. Pick Seasons**
- Single season: Click on a year
- Multiple seasons: Hold Ctrl/Cmd and click multiple years
- Compare trends across different seasons

### **3. Customize Your Chart**
- **Chart Type**: Scatter plot, bar chart, line graph, or heatmap
- **X-Axis**: Choose from sport-specific metrics
- **Y-Axis**: Select complementary metrics for analysis

### **4. Analyze Data**
- Hover over data points for detailed information
- Use the AI chat to ask questions about the data
- Generate AI insights for deeper analysis

### **5. AI Features**
- **Chat Assistant**: Ask questions like "Which team has the best offense?"
- **Generate Insights**: Click the button for AI-powered analysis
- **Recommendations**: Get suggested teams and trends

## 🔧 Configuration

### **API Keys Setup**

1. **RapidAPI Sports APIs**:
   - Sign up at [RapidAPI](https://rapidapi.com)
   - Subscribe to API-Sports endpoints
   - Copy your RapidAPI key to `SPORTS_API_KEY`

2. **Google Gemini API**:
   - Go to [Google AI Studio](https://makersuite.google.com)
   - Create an API key
   - Add to `GEMINI_API_KEY`

### **Environment Variables**
```env
# API Configuration
SPORTS_API_KEY=your_rapidapi_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Cache Configuration (optional)
CACHE_DURATION=21600000  # 6 hours in milliseconds
```

## 📊 Supported Metrics

### **⚾ Baseball**
- **Batting**: OPS, Average, Home Runs, Runs, RBI
- **Pitching**: ERA, Wins, Strikeouts, WHIP
- **Team**: Wins, Losses, Rank

### **🏀 Basketball/NBA**
- **Performance**: Points Per Game, Rebounds Per Game, Assists Per Game
- **Advanced**: PIE (Player Impact Estimate)
- **Team**: Wins, Losses, Win Percentage

### **⚽ Football**
- **Offense**: Goals For, Assists, Expected Goals (xG)
- **Defense**: Goals Against
- **Team**: Points, Wins, Draws, Losses

### **🏈 NFL**
- **Passing**: Yards, Touchdowns, Interceptions
- **Rushing**: Yards, Touchdowns
- **Team**: Points For/Against, Wins, Losses

### **🏎️ Formula 1**
- **Performance**: Points, Wins, Podiums
- **Standings**: Constructor/Driver positions

## 🚀 Deployment

### **Render Deployment**
The application is configured for deployment on Render:

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy with these settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: 18+

### **Other Platforms**
The app can be deployed on:
- **Heroku**: Add Procfile with `web: npm start`
- **Vercel**: Configure as Node.js application
- **Railway**: Direct GitHub integration
- **DigitalOcean App Platform**: Node.js service

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit with descriptive messages**
   ```bash
   git commit -m "✨ Add amazing feature"
   ```
5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### **Development Guidelines**
- Follow existing code style and conventions
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation if needed

## 📝 API Documentation

### **Sports Data Endpoints**
```javascript
GET /api/data/:sport?season=2024
// Returns sports data for specified sport and season

GET /api/health
// Health check endpoint
```

### **AI Endpoints**
```javascript
POST /ai/chat
// Chat with AI assistant
// Body: { question: "string" }

POST /ai/insights/:sport
// Generate AI insights for sport
// Body: { sport: "string" }

POST /ai/recommendations
// Get AI recommendations
// Body: { selections: Array }
```

## 🐛 Troubleshooting

### **Common Issues**

1. **No data displayed**
   - Check API keys are correctly set
   - Verify API quotas haven't been exceeded
   - Check browser console for errors

2. **Charts not rendering**
   - Ensure Chart.js is loaded
   - Check for JavaScript errors
   - Verify data format is correct

3. **AI features not working**
   - Confirm Gemini API key is valid
   - Check rate limits
   - Verify network connectivity

### **Debug Mode**
Enable detailed logging by setting:
```env
NODE_ENV=development
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **API-Sports** for comprehensive sports data
- **Google Gemini** for AI capabilities
- **Chart.js** for beautiful visualizations
- **Font Awesome** for professional icons
- **Inter Font** for modern typography

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/PTA-Avenger/Sports-viz/issues)
- **Discussions**: [GitHub Discussions](https://github.com/PTA-Avenger/Sports-viz/discussions)
- **Email**: Support via GitHub

---

<div align="center">

**Built with ❤️ for sports analytics enthusiasts**

[⭐ Star this repository](https://github.com/PTA-Avenger/Sports-viz) if you found it helpful!

</div>