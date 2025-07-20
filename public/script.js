// --- Enhanced Chatbot Analyst Widget ---
function appendChatMessage(text, sender = 'user') {
  const messages = document.getElementById('chatbotMessages');
  
  // Create message element
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${sender === 'user' ? 'user' : 'assistant'}`;
  
  // Create avatar
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
  
  // Create message content
  const content = document.createElement('div');
  content.className = 'message-content';
  content.innerHTML = `<p>${text}</p>`;
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);
  messages.appendChild(messageDiv);
  
  // Scroll to bottom with smooth animation
  messages.scrollTo({
    top: messages.scrollHeight,
    behavior: 'smooth'
  });
}

// Chat toggle functionality
function initializeChatWidget() {
  const chatToggle = document.getElementById('chatToggle');
  const chatBody = document.getElementById('chatBody');
  const chatHeader = document.getElementById('chatHeader');
  let isExpanded = true;
  
  chatHeader.addEventListener('click', () => {
    isExpanded = !isExpanded;
    
    if (isExpanded) {
      chatBody.style.maxHeight = '400px';
      chatToggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
    } else {
      chatBody.style.maxHeight = '0';
      chatToggle.innerHTML = '<i class="fas fa-chevron-up"></i>';
    }
  });
}

// Enhanced loading states
function showLoading(elementId, message = 'Loading...') {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `
      <div class="loading-placeholder">
        <i class="fas fa-spinner fa-spin"></i>
        <p>${message}</p>
      </div>
    `;
  }
}

function hideLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    const loading = element.querySelector('.loading-placeholder');
    if (loading) {
      loading.style.opacity = '0';
      setTimeout(() => loading.remove(), 300);
    }
  }
}

// Update quick stats
function updateQuickStats(data) {
  const totalTeams = document.getElementById('totalTeams');
  const dataPoints = document.getElementById('dataPoints');
  const lastUpdated = document.getElementById('lastUpdated');
  
  if (totalTeams && data) {
    totalTeams.textContent = Array.isArray(data) ? data.length : '--';
  }
  
  if (dataPoints && data) {
    const points = Array.isArray(data) ? data.reduce((sum, item) => {
      return sum + Object.keys(item).length;
    }, 0) : 0;
    dataPoints.textContent = points;
  }
  
  if (lastUpdated) {
    lastUpdated.textContent = new Date().toLocaleTimeString();
  }
}

// Enhanced chart creation with loading states
async function createChart(sport, seasons) {
  console.log(`Creating chart for sport: ${sport}, seasons: ${seasons}`);
  
  // Show loading state
  const chartLoading = document.getElementById('chartLoading');
  if (chartLoading) {
    chartLoading.style.display = 'block';
  }
  
  // Show sidebar loading
  showLoading('recommendSidebar', 'Analyzing data...');
  
  try {
    // Fetch data for the first season (or current year if no seasons selected)
    const season = seasons && seasons.length > 0 ? seasons[0] : new Date().getFullYear().toString();
    
    console.log(`Fetching data for ${sport} season ${season}`);
    const response = await fetch(`/api/data/${sport}?season=${season}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('API Response:', result);
    
    const data = result.data || [];
    console.log('Chart data:', data);
    
    // Update quick stats
    updateQuickStats(data);
    
    // Hide loading state
    if (chartLoading) {
      chartLoading.style.display = 'none';
    }
    
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('No data available for chart');
      showEmptyState();
      return;
    }
    
    // Populate metric selectors based on available data
    populateMetricSelectors(data, sport);
    
    // Create the chart
    const chartType = document.getElementById('chartTypeSelect')?.value || 'scatter';
    const xMetric = document.getElementById('xMetricSelect')?.value || getDefaultXMetric(sport);
    const yMetric = document.getElementById('yMetricSelect')?.value || getDefaultYMetric(sport);
    
    renderChart(data, sport, chartType, xMetric, yMetric);
    
    // Show sidebar content
    document.getElementById('recommendSidebar').style.display = 'block';
    hideLoading('recommendSidebar');
    
    // Add fade-in animation to chart
    const chartCard = document.querySelector('.chart-card');
    if (chartCard) {
      chartCard.classList.add('fade-in');
    }
    
  } catch (error) {
    console.error('Error creating chart:', error);
    
    // Hide loading state
    if (chartLoading) {
      chartLoading.style.display = 'none';
    }
    
    showErrorState(error.message);
  }
}

function showEmptyState() {
  const chartContainer = document.querySelector('.chart-container');
  if (chartContainer) {
    chartContainer.innerHTML = `
      <div class="insights-placeholder">
        <i class="fas fa-chart-line"></i>
        <p>No data available for the selected sport and season.</p>
        <button class="btn btn-primary" onclick="location.reload()">
          <i class="fas fa-sync-alt"></i>
          Refresh Page
        </button>
      </div>
    `;
  }
}

function showErrorState(message) {
  const chartContainer = document.querySelector('.chart-container');
  if (chartContainer) {
    chartContainer.innerHTML = `
      <div class="insights-placeholder">
        <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
        <p>Error loading data: ${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">
          <i class="fas fa-sync-alt"></i>
          Try Again
        </button>
      </div>
    `;
  }
}

// Enhanced initialization
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing Sports Analytics Dashboard...');
  
  // Initialize chat widget
  initializeChatWidget();
  
  // Add season dropdown to controls
  addSeasonDropdownToControls();
  
  // Initialize chart controls if they don't exist
  initializeChartControls();
  
  // Populate season dropdown
  populateSeasonDropdown();
  
  // Set up event listeners
  setupEventListeners();
  
  // Create initial chart after a short delay
  setTimeout(() => {
    const sport = document.getElementById('sportSelect')?.value || 'baseball';
    const seasonSelect = document.getElementById('seasonSelect');
    const seasons = seasonSelect ? Array.from(seasonSelect.selectedOptions).map(o => o.value) : [];
    
    // If no seasons selected, default to current year
    if (seasons.length === 0) {
      const currentYear = new Date().getFullYear().toString();
      seasons.push(currentYear);
      if (seasonSelect) {
        const currentYearOption = seasonSelect.querySelector(`option[value="${currentYear}"]`);
        if (currentYearOption) {
          currentYearOption.selected = true;
        }
      }
    }
    
    createChart(sport, seasons);
  }, 500);
  
  // Add welcome message to chat
  setTimeout(() => {
    appendChatMessage('🏆 Welcome to Sports Analytics! I can help you understand team performance, predict trends, and discover insights. What would you like to explore?', 'assistant');
  }, 1000);
  
  // Set up chatbot form
  setupChatbotForm();
});

// Add season dropdown population function
function populateSeasonDropdown() {
  const seasonSelect = document.getElementById('seasonSelect');
  if (!seasonSelect) return;
  
  seasonSelect.innerHTML = '';
  const currentYear = new Date().getFullYear();
  
  // Add seasons from current year back to 2019
  for (let year = currentYear; year >= 2019; year--) {
    const option = document.createElement('option');
    option.value = year.toString();
    option.textContent = year.toString();
    if (year === currentYear) {
      option.selected = true;
    }
    seasonSelect.appendChild(option);
  }
}

// Add metric selector population function
function populateMetricSelectors(data, sport) {
  const xMetricSelect = document.getElementById('xMetricSelect');
  const yMetricSelect = document.getElementById('yMetricSelect');
  
  if (!xMetricSelect || !yMetricSelect || !data || data.length === 0) return;
  
  // Get metrics based on sport and actual data structure
  const metrics = getAvailableMetrics(data, sport);
  
  // Clear existing options
  xMetricSelect.innerHTML = '';
  yMetricSelect.innerHTML = '';
  
  // Populate both selectors
  metrics.forEach((metric, index) => {
    const xOption = document.createElement('option');
    xOption.value = metric.key;
    xOption.textContent = metric.label;
    xMetricSelect.appendChild(xOption);
    
    const yOption = document.createElement('option');
    yOption.value = metric.key;
    yOption.textContent = metric.label;
    yMetricSelect.appendChild(yOption);
  });
  
  // Set default selections
  if (metrics.length > 1) {
    xMetricSelect.selectedIndex = 0;
    yMetricSelect.selectedIndex = 1;
  }
}

// Get available metrics based on data structure and sport
function getAvailableMetrics(data, sport) {
  if (!data || data.length === 0) return [];
  
  const firstItem = data[0];
  const metrics = [];
  
  // Define sport-specific metrics
  const sportMetrics = {
    baseball: [
      { key: 'batting.ops', label: 'OPS', path: ['batting', 'ops'] },
      { key: 'batting.avg', label: 'Batting Average', path: ['batting', 'avg'] },
      { key: 'batting.hr', label: 'Home Runs', path: ['batting', 'hr'] },
      { key: 'batting.runs', label: 'Runs', path: ['batting', 'runs'] },
      { key: 'batting.rbi', label: 'RBI', path: ['batting', 'rbi'] },
      { key: 'pitching.era', label: 'ERA', path: ['pitching', 'era'] },
      { key: 'pitching.wins', label: 'Wins', path: ['pitching', 'wins'] },
      { key: 'pitching.strikeouts', label: 'Strikeouts', path: ['pitching', 'strikeouts'] },
      { key: 'wins', label: 'Team Wins', path: ['wins'] },
      { key: 'losses', label: 'Team Losses', path: ['losses'] },
      { key: 'rank', label: 'Rank', path: ['rank'] }
    ],
    basketball: [
      { key: 'ppg', label: 'Points Per Game', path: ['ppg'] },
      { key: 'rpg', label: 'Rebounds Per Game', path: ['rpg'] },
      { key: 'apg', label: 'Assists Per Game', path: ['apg'] },
      { key: 'pie', label: 'PIE', path: ['pie'] },
      { key: 'wins', label: 'Wins', path: ['wins'] },
      { key: 'losses', label: 'Losses', path: ['losses'] },
      { key: 'rank', label: 'Rank', path: ['rank'] }
    ],
    football: [
      { key: 'goals.for', label: 'Goals For', path: ['goals', 'for'] },
      { key: 'goals.against', label: 'Goals Against', path: ['goals', 'against'] },
      { key: 'assists', label: 'Assists', path: ['assists'] },
      { key: 'xg', label: 'Expected Goals', path: ['xg'] },
      { key: 'wins', label: 'Wins', path: ['wins'] },
      { key: 'draws', label: 'Draws', path: ['draws'] },
      { key: 'losses', label: 'Losses', path: ['losses'] },
      { key: 'points', label: 'Points', path: ['points'] },
      { key: 'rank', label: 'Rank', path: ['rank'] }
    ],
    f1: [
      { key: 'points', label: 'Points', path: ['points'] },
      { key: 'wins', label: 'Wins', path: ['wins'] },
      { key: 'position', label: 'Position', path: ['position'] }
    ],
    nba: [
      { key: 'ppg', label: 'Points Per Game', path: ['ppg'] },
      { key: 'rpg', label: 'Rebounds Per Game', path: ['rpg'] },
      { key: 'apg', label: 'Assists Per Game', path: ['apg'] },
      { key: 'pie', label: 'PIE', path: ['pie'] },
      { key: 'wins', label: 'Wins', path: ['wins'] },
      { key: 'losses', label: 'Losses', path: ['losses'] },
      { key: 'rank', label: 'Rank', path: ['rank'] }
    ],
    nfl: [
      { key: 'passing.yards', label: 'Passing Yards', path: ['passing', 'yards'] },
      { key: 'passing.touchdowns', label: 'Passing TDs', path: ['passing', 'touchdowns'] },
      { key: 'rushing.yards', label: 'Rushing Yards', path: ['rushing', 'yards'] },
      { key: 'rushing.touchdowns', label: 'Rushing TDs', path: ['rushing', 'touchdowns'] },
      { key: 'wins', label: 'Wins', path: ['wins'] },
      { key: 'losses', label: 'Losses', path: ['losses'] },
      { key: 'points_for', label: 'Points For', path: ['points_for'] },
      { key: 'points_against', label: 'Points Against', path: ['points_against'] },
      { key: 'rank', label: 'Rank', path: ['rank'] }
    ]
  };
  
  const availableMetrics = sportMetrics[sport] || sportMetrics.baseball;
  
  // Filter metrics that actually exist in the data
  return availableMetrics.filter(metric => {
    return hasNestedProperty(firstItem, metric.path);
  });
}

// Helper function to check if nested property exists
function hasNestedProperty(obj, path) {
  if (!obj || !path || path.length === 0) return false;
  
  let current = obj;
  for (const key of path) {
    if (current === null || current === undefined || !(key in current)) {
      return false;
    }
    current = current[key];
  }
  return current !== null && current !== undefined;
}

// Helper function to get nested property value
function getNestedProperty(obj, path) {
  if (!obj || !path || path.length === 0) return undefined;
  
  let current = obj;
  for (const key of path) {
    if (current === null || current === undefined || !(key in current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

// Get default metrics for each sport
function getDefaultXMetric(sport) {
  const defaults = {
    baseball: 'batting.ops',
    basketball: 'ppg',
    football: 'goals.for',
    f1: 'points',
    nba: 'ppg',
    nfl: 'passing.yards'
  };
  return defaults[sport] || 'wins';
}

function getDefaultYMetric(sport) {
  const defaults = {
    baseball: 'pitching.era',
    basketball: 'rpg',
    football: 'goals.against',
    f1: 'wins',
    nba: 'rpg',
    nfl: 'rushing.yards'
  };
  return defaults[sport] || 'losses';
}

// Add chart rendering function
function renderChart(data, sport, chartType, xMetric, yMetric) {
  const canvas = document.getElementById('myChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart
  if (window.chartInstance) {
    window.chartInstance.destroy();
  }
  
  // Prepare data for Chart.js
  const chartData = data.map(item => {
    const xPath = xMetric.split('.');
    const yPath = yMetric.split('.');
    
    const x = getNestedProperty(item, xPath) || 0;
    const y = getNestedProperty(item, yPath) || 0;
    const label = item.team?.name || item.name || 'Unknown';
    
    return {
      x: Number(x) || 0,
      y: Number(y) || 0,
      label: label
    };
  }).filter(item => !isNaN(item.x) && !isNaN(item.y));
  
  // Chart configuration
  const config = {
    type: chartType === 'heatmap' ? 'scatter' : chartType,
    data: {
      datasets: [{
        label: `${sport.charAt(0).toUpperCase() + sport.slice(1)} Data`,
        data: chartData,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `${sport.charAt(0).toUpperCase() + sport.slice(1)} Analysis`,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const point = context.raw;
              return `${point.label}: (${point.x}, ${point.y})`;
            }
          }
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: xMetric.replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          title: {
            display: true,
            text: yMetric.replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    }
  };
  
  // Adjust for different chart types
  if (chartType === 'bar') {
    config.data.labels = chartData.map(item => item.label);
    config.data.datasets[0].data = chartData.map(item => item.y);
    delete config.data.datasets[0].pointRadius;
    delete config.data.datasets[0].pointHoverRadius;
  } else if (chartType === 'line') {
    config.data.labels = chartData.map(item => item.x);
    config.data.datasets[0].data = chartData.map(item => item.y);
    config.data.datasets[0].fill = false;
    delete config.data.datasets[0].pointRadius;
    delete config.data.datasets[0].pointHoverRadius;
  }
  
  // Create the chart
  window.chartInstance = new Chart(ctx, config);
}

// Setup chatbot form
function setupChatbotForm() {
  const chatForm = document.getElementById('chatbotForm');
  const chatInput = document.getElementById('chatbotInput');
  
  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const question = chatInput.value.trim();
      if (!question) return;
      
      // Add user message
      appendChatMessage(question, 'user');
      chatInput.value = '';
      
      // Add thinking message
      appendChatMessage('🤔 Let me analyze that...', 'assistant');
      
      try {
        const response = await fetch('/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ question })
        });
        
        const result = await response.json();
        
        // Remove thinking message
        const messages = document.getElementById('chatbotMessages');
        if (messages.lastChild) {
          messages.removeChild(messages.lastChild);
        }
        
        // Add AI response
        appendChatMessage(result.answer || 'Sorry, I couldn\'t process that question.', 'assistant');
        
      } catch (error) {
        console.error('Chat error:', error);
        
        // Remove thinking message
        const messages = document.getElementById('chatbotMessages');
        if (messages.lastChild) {
          messages.removeChild(messages.lastChild);
        }
        
        // Add error message
        appendChatMessage('Sorry, I\'m having trouble connecting right now. Please try again later.', 'assistant');
      }
    });
  }
}

function addSeasonDropdownToControls() {
  const controlsGrid = document.querySelector('.controls-grid');
  if (controlsGrid && !document.getElementById('seasonSelect')) {
    const seasonGroup = document.createElement('div');
    seasonGroup.className = 'control-group';
    seasonGroup.innerHTML = `
      <label for="seasonSelect" class="control-label">
        <i class="fas fa-calendar-alt"></i>
        Season
      </label>
      <select id="seasonSelect" class="control-select" multiple>
        <!-- Options populated by script -->
      </select>
    `;
    controlsGrid.appendChild(seasonGroup);
  }
}

function initializeChartControls() {
  // Chart type selector is already in HTML, just add event listener
  const chartTypeSelect = document.getElementById('chartTypeSelect');
  if (chartTypeSelect) {
    chartTypeSelect.addEventListener('change', () => {
      const sport = document.getElementById('sportSelect')?.value;
      const seasonSelect = document.getElementById('seasonSelect');
      const seasons = seasonSelect ? Array.from(seasonSelect.selectedOptions).map(o => o.value) : [];
      if (sport && seasons.length > 0) {
        createChart(sport, seasons);
      }
    });
  }
}

function setupEventListeners() {
  // Sport selector
  const sportSelect = document.getElementById('sportSelect');
  if (sportSelect) {
    sportSelect.addEventListener('change', () => {
      const sport = sportSelect.value;
      const seasonSelect = document.getElementById('seasonSelect');
      const seasons = seasonSelect ? Array.from(seasonSelect.selectedOptions).map(o => o.value) : [];
      
      if (seasons.length === 0) {
        const currentYear = new Date().getFullYear().toString();
        seasons.push(currentYear);
      }
      
      createChart(sport, seasons);
    });
  }
  
  // Season selector
  const seasonSelect = document.getElementById('seasonSelect');
  if (seasonSelect) {
    seasonSelect.addEventListener('change', () => {
      const sport = document.getElementById('sportSelect')?.value;
      const seasons = Array.from(seasonSelect.selectedOptions).map(o => o.value);
      if (sport && seasons.length > 0) {
        createChart(sport, seasons);
      }
    });
  }
  
  // Metric selectors
  const xMetricSelect = document.getElementById('xMetricSelect');
  const yMetricSelect = document.getElementById('yMetricSelect');
  
  if (xMetricSelect) {
    xMetricSelect.addEventListener('change', updateChartMetrics);
  }
  
  if (yMetricSelect) {
    yMetricSelect.addEventListener('change', updateChartMetrics);
  }
  
  // Refresh button
  const refreshChart = document.getElementById('refreshChart');
  if (refreshChart) {
    refreshChart.addEventListener('click', () => {
      const sport = document.getElementById('sportSelect')?.value;
      const seasonSelect = document.getElementById('seasonSelect');
      const seasons = seasonSelect ? Array.from(seasonSelect.selectedOptions).map(o => o.value) : [];
      if (sport && seasons.length > 0) {
        createChart(sport, seasons);
      }
    });
  }
  
  // Generate insights button
  const generateInsights = document.getElementById('generateInsights');
  if (generateInsights) {
    generateInsights.addEventListener('click', async () => {
      const sport = document.getElementById('sportSelect')?.value;
      if (sport) {
        await generateAIInsights(sport);
      }
    });
  }
  
  // Navigation links
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove('active'));
      
      // Add active class to clicked link
      link.classList.add('active');
      
      // Handle navigation (you can expand this)
      const href = link.getAttribute('href');
      console.log(`Navigating to: ${href}`);
    });
  });
}

function updateChartMetrics() {
  const sport = document.getElementById('sportSelect')?.value;
  const seasonSelect = document.getElementById('seasonSelect');
  const seasons = seasonSelect ? Array.from(seasonSelect.selectedOptions).map(o => o.value) : [];
  
  if (sport && seasons.length > 0) {
    createChart(sport, seasons);
  }
}

async function generateAIInsights(sport) {
  const insightsCard = document.getElementById('insightsPanel');
  const cardContent = insightsCard?.querySelector('.card-content');
  
  if (!cardContent) return;
  
  // Show loading state
  cardContent.innerHTML = `
    <div class="loading-placeholder">
      <i class="fas fa-brain fa-spin"></i>
      <p>Generating AI insights...</p>
    </div>
  `;
  
  try {
    const response = await fetch(`/ai/insights/${sport}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sport })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate insights');
    }
    
    const result = await response.json();
    
    cardContent.innerHTML = `
      <div class="insights-content">
        <div class="insight-item">
          <h4><i class="fas fa-lightbulb"></i> Key Insights</h4>
          <p>${result.insights || 'AI insights will appear here when generated.'}</p>
        </div>
      </div>
    `;
    
  } catch (error) {
    console.error('Error generating insights:', error);
    cardContent.innerHTML = `
      <div class="insights-placeholder">
        <i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i>
        <p>Unable to generate insights at this time. Please try again later.</p>
      </div>
    `;
  }
}
