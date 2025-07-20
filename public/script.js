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
});

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
  // Check if chart controls already exist
  if (document.getElementById('chartTypeSelect')) {
    return;
  }
  
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
