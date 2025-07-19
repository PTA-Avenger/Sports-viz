// --- Chatbot Analyst Widget ---
function appendChatMessage(text, sender = 'user') {
  const messages = document.getElementById('chatbotMessages');
  const div = document.createElement('div');
  div.style.margin = '6px 0';
  div.style.textAlign = sender === 'user' ? 'right' : 'left';
  div.innerHTML = `<span style="display:inline-block;max-width:80%;padding:7px 12px;border-radius:16px;${sender === 'user' ? 'background:#3498db;color:#fff;' : 'background:#f3f3f3;color:#222;'}">${text}</span>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

window.addEventListener('DOMContentLoaded', () => {
  // ...existing code...
  populateSeasonDropdown();
  // Initial chart render
  const sport = document.getElementById('sportSelect')?.value;
  const seasonSelect = document.getElementById('seasonSelect');
  const seasons = Array.from(seasonSelect?.selectedOptions || []).map(o => o.value);
  createChart(sport, seasons);

  // Chart type and metric selectors
  const chartControls = document.createElement('div');
  chartControls.id = 'chartControls';
  chartControls.style.display = 'flex';
  chartControls.style.flexWrap = 'wrap';
  chartControls.style.gap = '12px';
  chartControls.style.alignItems = 'center';
  chartControls.style.margin = '18px 0 8px 0';
  chartControls.style.background = '#f8fafd';
  chartControls.style.borderRadius = '10px';
  chartControls.style.boxShadow = '0 1px 8px #0001';
  chartControls.style.padding = '10px 14px 8px 14px';
  chartControls.style.border = '1px solid #e3e8f0';
  chartControls.style.maxWidth = '700px';
  chartControls.style.fontSize = '1em';
  const chartContainer = document.getElementById('myChart')?.parentNode;
  if (chartContainer && !document.getElementById('chartControls')) {
    chartContainer.insertBefore(chartControls, document.getElementById('myChart'));
  }

  // Chart type selector
  const chartTypeSelect = document.createElement('select');
  chartTypeSelect.id = 'chartTypeSelect';
  chartTypeSelect.style.padding = '7px 10px';
  chartTypeSelect.style.borderRadius = '7px';
  chartTypeSelect.style.border = '1px solid #d0d7e2';
  chartTypeSelect.style.background = '#fff';
  chartTypeSelect.style.fontWeight = '500';
  chartTypeSelect.style.cursor = 'pointer';
  ['scatter','bar','line','heatmap'].forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    chartTypeSelect.appendChild(opt);
  });
  chartControls.appendChild(chartTypeSelect);

  // X and Y metric selectors
  const xMetricSelect = document.createElement('select');
  xMetricSelect.id = 'xMetricSelect';
  xMetricSelect.style.padding = '7px 10px';
  xMetricSelect.style.borderRadius = '7px';
  xMetricSelect.style.border = '1px solid #d0d7e2';
  xMetricSelect.style.background = '#fff';
  xMetricSelect.style.fontWeight = '500';
  xMetricSelect.style.cursor = 'pointer';
  const yMetricSelect = document.createElement('select');
  yMetricSelect.id = 'yMetricSelect';
  yMetricSelect.style.padding = '7px 10px';
  yMetricSelect.style.borderRadius = '7px';
  yMetricSelect.style.border = '1px solid #d0d7e2';
  yMetricSelect.style.background = '#fff';
  yMetricSelect.style.fontWeight = '500';
  yMetricSelect.style.cursor = 'pointer';
  chartControls.appendChild(xMetricSelect);
  chartControls.appendChild(yMetricSelect);

  // Responsive: stack controls on small screens
  const style = document.createElement('style');
  style.innerHTML = `
    @media (max-width: 600px) {
      #chartControls { flex-direction: column; align-items: stretch; max-width: 98vw; }
      #chartControls select { width: 100%; margin-bottom: 6px; }
    }
    #chartControls select:focus { outline: 2px solid #3498db33; border-color: #3498db; }
    #chartControls select:hover { border-color: #3498db; }
    #vizExplorerPanel button, #vizTypeModal button, #vizExplorerBtn {
      transition: background 0.15s, color 0.15s, box-shadow 0.15s;
    }
    #vizExplorerPanel button:hover, #vizTypeModal button:hover, #vizExplorerBtn:hover {
      background: #eaf3fb !important; color: #1a5ca6 !important;
      box-shadow: 0 2px 8px #3498db22;
    }
    #vizExplorerPanel { border: 1px solid #e3e8f0; }
    #vizTypeModal { border: 1px solid #e3e8f0; }
  `;
  document.head.appendChild(style);

  // Helper to update metric options based on sport
  function updateMetricSelectors(sport) {
    const metricsBySport = {
      baseball: [
        { key: 'batting.ops', label: 'OPS' },
        { key: 'batting.avg', label: 'AVG' },
        { key: 'batting.hr', label: 'HR' },
        { key: 'batting.runs', label: 'Runs' },
        { key: 'pitching.era', label: 'ERA' },
        { key: 'pitching.wins', label: 'Wins' },
        { key: 'batting.rbi', label: 'RBI' },
      ],
      f1: [
        { key: 'points', label: 'Points' },
        { key: 'wins', label: 'Wins' },
        { key: 'lap_times_avg', label: 'Lap Time (avg)' },
        { key: 'top_speed', label: 'Top Speed' },
      ],
      basketball: [
        { key: 'ppg', label: 'Points Per Game (PPG)' },
        { key: 'rpg', label: 'Rebounds Per Game (RPG)' },
        { key: 'apg', label: 'Assists Per Game (APG)' },
        { key: 'pie', label: 'PIE' },
      ],
      football: [
        { key: 'goals.for', label: 'Goals For' },
        { key: 'goals.against', label: 'Goals Against' },
        { key: 'assists', label: 'Assists' },
        { key: 'xg', label: 'Expected Goals (xG)' },
      ],
      'american football': [
        { key: 'passing_yards', label: 'Passing Yards' },
        { key: 'rushing_yards', label: 'Rushing Yards' },
        { key: 'receptions', label: 'Receptions' },
        { key: 'sacks', label: 'Sacks' },
      ]
    };
    const metrics = metricsBySport[sport] || [{ key: 'x', label: 'X' }, { key: 'y', label: 'Y' }];
    xMetricSelect.innerHTML = '';
    yMetricSelect.innerHTML = '';
    metrics.forEach((m, i) => {
      const xOpt = document.createElement('option');
      xOpt.value = m.key;
      xOpt.textContent = m.label;
      xMetricSelect.appendChild(xOpt);
      const yOpt = document.createElement('option');
      yOpt.value = m.key;
      yOpt.textContent = m.label;
      yMetricSelect.appendChild(yOpt);
    });
    if (metrics.length > 1) {
      xMetricSelect.selectedIndex = 0;
      yMetricSelect.selectedIndex = 1;
    }
  }

  // Listen for sport change to update metrics
  const sportSelect = document.getElementById('sportSelect');
  if (sportSelect) {
    sportSelect.addEventListener('change', e => {
      updateMetricSelectors(e.target.value);
    });
    updateMetricSelectors(sportSelect.value);
  }

  // Redraw chart on selector change
  [chartTypeSelect, xMetricSelect, yMetricSelect].forEach(sel => {
    sel.addEventListener('change', () => {
      const sport = sportSelect?.value;
      const seasons = Array.from(document.getElementById('seasonSelect')?.selectedOptions || []).map(o => o.value);
      createChart(sport, seasons);
    });
  });

  // Chatbot event handlers
  const chatForm = document.getElementById('chatbotForm');
  const chatInput = document.getElementById('chatbotInput');
  const chatMessages = document.getElementById('chatbotMessages');
  if (chatForm && chatInput && chatMessages) {
    chatForm.addEventListener('submit', async e => {
      e.preventDefault();
      const question = chatInput.value.trim();
      if (!question) return;
      appendChatMessage(question, 'user');
      chatInput.value = '';
      appendChatMessage('<em>Thinking...</em>', 'bot');
      try {
        const res = await fetch('/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question })
        });
        const json = await res.json();
        // Remove the last 'Thinking...' message
        chatMessages.removeChild(chatMessages.lastChild);
        appendChatMessage(json.answer || 'No answer.', 'bot');
      } catch {
        chatMessages.removeChild(chatMessages.lastChild);
        appendChatMessage('<span style="color:#e74c3c">Failed to get answer.</span>', 'bot');
      }
    });
  }
});
// public/script.js

const BACKEND_URL = 'https://sports-viz.onrender.com'; // Replace with actual Render URL

// Show/hide loading spinner
function showLoading(show) {
  let spinner = document.getElementById('loadingSpinner');
  if (!spinner) {
    spinner = document.createElement('div');
    spinner.id = 'loadingSpinner';
    spinner.style.position = 'fixed';
    spinner.style.top = '50%';
    spinner.style.left = '50%';
    spinner.style.transform = 'translate(-50%, -50%)';
    spinner.style.zIndex = '1000';
    spinner.innerHTML = '<div style="border:8px solid #f3f3f3;border-top:8px solid #3498db;border-radius:50%;width:60px;height:60px;animation:spin 1s linear infinite;"></div>';
    document.body.appendChild(spinner);
    const style = document.createElement('style');
    style.innerHTML = '@keyframes spin {0% { transform: rotate(0deg);}100% { transform: rotate(360deg);}}';
    document.head.appendChild(style);
  }
  spinner.style.display = show ? 'block' : 'none';
}

// Show error banner
function showError(msg) {
  let banner = document.getElementById('errorBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'errorBanner';
    banner.style.position = 'fixed';
    banner.style.top = '0';
    banner.style.left = '0';
    banner.style.width = '100%';
    banner.style.background = '#e74c3c';
    banner.style.color = 'white';
    banner.style.padding = '12px';
    banner.style.textAlign = 'center';
    banner.style.zIndex = '1001';
    banner.style.fontWeight = 'bold';
    document.body.appendChild(banner);
  }
  banner.textContent = msg;
  banner.style.display = 'block';
  setTimeout(() => { banner.style.display = 'none'; }, 5000);
}

async function fetchData(sport) {
  try {
    showLoading(true);
    const res = await fetch(`${BACKEND_URL}/api/data/${sport}`);
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    showLoading(false);
    return data;
  } catch (error) {
    showLoading(false);
    showError('Failed to fetch data. Please try again.');
    console.error('Error fetching data:', error);
    return [];
  }
}

function mapDataToXY(data, sport) {
  switch (sport) {
    case 'baseball':
      return data.map(team => ({
        x: team.statistics?.batting?.ops || 0,
        y: team.statistics?.pitching?.era || 0,
        label: team.team?.name || team.name
      }));
    case 'f1':
      return data.map(item => ({
        x: Number(item.points),
        y: Number(item.wins),
        label: item.Constructor?.name || item.name
      }));
    case 'basketball':
      return data.map(team => ({
        x: team.statistics?.ppg || 0, // Points per game
        y: team.statistics?.rpg || 0, // Rebounds per game
        label: team.team?.name || team.name
      }));
    case 'football':
      return data.map(team => ({
        x: team.statistics?.goals?.for || 0,
        y: team.statistics?.goals?.against || 0,
        label: team.team?.name || team.name
      }));
    default:
      return data.map(item => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        label: item.team?.name || item.name
      }));
  }
}

async function createChart(sport) {
  showLoading(true);
  let raw = [];
  try {
    raw = await fetchData(sport);
  } catch (e) {
    showLoading(false);
    showError('Failed to load chart data.');
    return;
  }
  showLoading(false);
  const ctx = document.getElementById('myChart').getContext('2d');

  if (window.chartInstance) window.chartInstance.destroy();

  const dataset = mapDataToXY(raw, sport);

  // Set axis labels based on sport
  let xLabel = 'X Metric';
  let yLabel = 'Y Metric';
  switch (sport) {
    case 'baseball':
      xLabel = 'OPS';
      yLabel = 'ERA';
      break;
    case 'f1':
      xLabel = 'Points';
      yLabel = 'Wins';
      break;
    case 'basketball':
      xLabel = 'Points Per Game (PPG)';
      yLabel = 'Rebounds Per Game (RPG)';
      break;
    case 'football':
      xLabel = 'Goals For';
      yLabel = 'Goals Against';
      break;
  }

  // Sport-specific colors
  let backgroundColor = 'rgba(54, 162, 235, 0.7)';
  let borderColor = 'rgba(54, 162, 235, 1)';
  switch (sport) {
    case 'baseball':
      backgroundColor = 'rgba(255, 99, 132, 0.7)'; // red
      borderColor = 'rgba(255, 99, 132, 1)';
      break;
    case 'f1':
      backgroundColor = 'rgba(255, 206, 86, 0.7)'; // yellow
      borderColor = 'rgba(255, 206, 86, 1)';
      break;
    case 'basketball':
      backgroundColor = 'rgba(255, 159, 64, 0.7)'; // orange
      borderColor = 'rgba(255, 159, 64, 1)';
      break;
    case 'football':
      backgroundColor = 'rgba(75, 192, 192, 0.7)'; // teal
      borderColor = 'rgba(75, 192, 192, 1)';
      break;
  }

  window.chartInstance = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: `${sport} Stats`,
        data: dataset,
        backgroundColor,
        borderColor,
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => {
              const d = ctx.raw;
              let rank = d.rank !== undefined ? `Rank: ${d.rank}` : '';
              let winPct = d.winPct !== undefined ? `Win%: ${d.winPct}` : '';
              let league = d.league !== undefined ? `League: ${d.league}` : '';
              // Try to extract from data if not present
              if (!rank && d.statistics?.rank) rank = `Rank: ${d.statistics.rank}`;
              if (!winPct && d.statistics?.winPct) winPct = `Win%: ${d.statistics.winPct}`;
              if (!league && d.league?.name) league = `League: ${d.league.name}`;
              let base = `${d.label}: (${d.x}, ${d.y})`;
              let details = [rank, winPct, league].filter(Boolean).join(' | ');
              return details ? `${base} | ${details}` : base;
            }
          }
        }
      },
      scales: {
        x: { title: { display: true, text: xLabel } },
        y: { title: { display: true, text: yLabel } }
      }
    }
  });
}


// Add season dropdown for historical trend comparison
function getCurrentYear() {
  return new Date().getFullYear();
}

function populateSeasonDropdown() {
  let seasonSelect = document.getElementById('seasonSelect');
  if (!seasonSelect) {
    seasonSelect = document.createElement('select');
    seasonSelect.id = 'seasonSelect';
    seasonSelect.multiple = true;
    seasonSelect.size = 4;
    seasonSelect.style.marginLeft = '12px';
    seasonSelect.style.verticalAlign = 'middle';
    seasonSelect.style.width = '100px';
    document.getElementById('sportSelect').after(seasonSelect);
    // Add helper text
    let helper = document.getElementById('seasonHelper');
    if (!helper) {
      helper = document.createElement('span');
      helper.id = 'seasonHelper';
      helper.textContent = ' (Ctrl+Click to multi-select)';
      helper.style.fontSize = '0.9em';
      helper.style.color = '#888';
      seasonSelect.after(helper);
    }
  }
  seasonSelect.innerHTML = '';
  const current = getCurrentYear();
  for (let y = current; y >= current - 5; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    if (y === current) opt.selected = true;
    seasonSelect.appendChild(opt);
  }
}

// Color map for seasons
const seasonColors = {
  2022: { bg: 'rgba(54, 162, 235, 0.7)', border: 'rgba(54, 162, 235, 1)' },
  2023: { bg: 'rgba(255, 99, 132, 0.7)', border: 'rgba(255, 99, 132, 1)' },
  2024: { bg: 'rgba(75, 192, 192, 0.7)', border: 'rgba(75, 192, 192, 1)' },
  2025: { bg: 'rgba(255, 206, 86, 0.7)', border: 'rgba(255, 206, 86, 1)' },
};

// --- User Recommendations State ---
let userSelections = [];

async function createChart(sport, seasons) {
  if (!Array.isArray(seasons)) seasons = [seasons];
  showLoading(true);
  const ctx = document.getElementById('myChart').getContext('2d');
  if (window.chartInstance) window.chartInstance.destroy();

  // Get selected chart type and metrics
  const chartType = document.getElementById('chartTypeSelect')?.value || 'scatter';
  const xMetric = document.getElementById('xMetricSelect')?.value;
  const yMetric = document.getElementById('yMetricSelect')?.value;

  // Helper to get nested value by key path
  function getNested(obj, path) {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
  }

  // Fetch all selected seasons in parallel
  const datasets = await Promise.all(seasons.map(async (season) => {
    try {
      let url = `${BACKEND_URL}/api/data/${sport}?season=${season}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response was not ok');
      const raw = await res.json();
      // Map data to selected metrics
      let data = [];
      if (chartType === 'heatmap') {
        // For now, fake heatmap data (random grid)
        data = Array.from({length: 10}, (_, i) => Array.from({length: 10}, (_, j) => Math.floor(Math.random()*100)));
      } else {
        data = (raw || []).map(item => {
          let x = getNested(item.statistics, xMetric) ?? getNested(item, xMetric) ?? 0;
          let y = getNested(item.statistics, yMetric) ?? getNested(item, yMetric) ?? 0;
          // Fallback for F1
          if (sport === 'f1') {
            x = getNested(item, xMetric) ?? 0;
            y = getNested(item, yMetric) ?? 0;
          }
          return {
            x: Number(x),
            y: Number(y),
            label: item.team?.name || item.player?.name || item.Constructor?.name || item.name
          };
        });
      }
      const color = seasonColors[season] || { bg: 'rgba(54, 162, 235, 0.7)', border: 'rgba(54, 162, 235, 1)' };
      const isCurrent = season == getCurrentYear();
      return {
        label: `${sport} ${season} Stats`,
        data,
        backgroundColor: color.bg,
        borderColor: color.border,
        borderWidth: 2,
        pointStyle: isCurrent ? 'circle' : 'rectRot',
        borderDash: isCurrent ? [] : [6, 6],
      };
    } catch (e) {
      showError(`Failed to load data for season ${season}`);
      return null;
    }
  }));
  showLoading(false);
  let chartDatasets = datasets.filter(Boolean);

  // Predictive Analytics: request predictions and plot as dotted data (only for scatter/line)
  if ((chartType === 'scatter' || chartType === 'line') && chartDatasets.length === 1 && chartDatasets[0].data.length > 0) {
    try {
      const predRes = await fetch(`/ai/predict/${sport}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: chartDatasets[0].data })
      });
      const predJson = await predRes.json();
      if (Array.isArray(predJson.predictions) && predJson.predictions.length > 0) {
        chartDatasets.push({
          label: `${sport} Next Match Forecast`,
          data: predJson.predictions,
          backgroundColor: 'rgba(80,80,80,0.2)',
          borderColor: 'rgba(80,80,80,0.7)',
          borderWidth: 2,
          pointStyle: 'star',
          borderDash: [2, 6],
          showLine: false,
        });
      }
    } catch (e) {
      // Ignore prediction errors for now
    }
  }

  // Chart.js config for different chart types
  let chartConfig = {
    type: chartType === 'heatmap' ? 'bar' : chartType, // fallback for heatmap
    data: {},
    options: {
      plugins: {
        title: {
          display: true,
          text: `${sport.charAt(0).toUpperCase() + sport.slice(1)} - ${seasons.join(', ')}`
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              if (chartType === 'heatmap') return '';
              const d = ctx.raw;
              let rank = d.rank !== undefined ? `Rank: ${d.rank}` : '';
              let winPct = d.winPct !== undefined ? `Win%: ${d.winPct}` : '';
              let league = d.league !== undefined ? `League: ${d.league}` : '';
              if (!rank && d.statistics?.rank) rank = `Rank: ${d.statistics.rank}`;
              if (!winPct && d.statistics?.winPct) winPct = `Win%: ${d.statistics.winPct}`;
              if (!league && d.league?.name) league = `League: ${d.league.name}`;
              let base = `${d.label}: (${d.x}, ${d.y})`;
              let details = [rank, winPct, league].filter(Boolean).join(' | ');
              return details ? `${base} | ${details}` : base;
            }
          }
        }
      },
      scales: {
        x: { title: { display: true, text: xMetric || 'X Metric' } },
        y: { title: { display: true, text: yMetric || 'Y Metric' } }
      }
    }
  };

  if (chartType === 'bar') {
    // Bar chart: show ranking by selected metric (Y metric)
    chartConfig.type = 'bar';
    chartConfig.data = {
      labels: chartDatasets[0]?.data.map(d => d.label),
      datasets: [{
        label: yMetric || 'Value',
        data: chartDatasets[0]?.data.map(d => d.y),
        backgroundColor: chartDatasets[0]?.backgroundColor,
        borderColor: chartDatasets[0]?.borderColor,
        borderWidth: 2
      }]
    };
    chartConfig.options.indexAxis = 'y';
    chartConfig.options.scales = {
      x: { title: { display: true, text: yMetric || 'Value' } },
      y: { title: { display: true, text: 'Team/Player' } }
    };
  } else if (chartType === 'line') {
    // Line chart: show trend (X metric as label, Y as value)
    chartConfig.type = 'line';
    chartConfig.data = {
      labels: chartDatasets[0]?.data.map(d => d.x),
      datasets: [{
        label: yMetric || 'Value',
        data: chartDatasets[0]?.data.map(d => d.y),
        backgroundColor: chartDatasets[0]?.backgroundColor,
        borderColor: chartDatasets[0]?.borderColor,
        borderWidth: 2,
        fill: false
      }]
    };
    chartConfig.options.scales = {
      x: { title: { display: true, text: xMetric || 'X Metric' } },
      y: { title: { display: true, text: yMetric || 'Y Metric' } }
    };
  } else if (chartType === 'heatmap') {
    // Heatmap: show a placeholder grid
    chartConfig.type = 'bar';
    const grid = chartDatasets[0]?.data || Array.from({length:10},()=>Array(10).fill(0));
    chartConfig.data = {
      labels: Array.from({length: grid.length}, (_, i) => `Zone ${i+1}`),
      datasets: grid.map((row, i) => ({
        label: `Row ${i+1}`,
        data: row,
        backgroundColor: `rgba(54,162,235,${0.2+0.7*i/grid.length})`,
        borderWidth: 1
      }))
    };
    chartConfig.options.plugins.title.text = 'Heatmap (placeholder)';
    chartConfig.options.scales = {
      x: { stacked: true },
      y: { stacked: true }
    };
  } else {
    // Scatter (default)
    chartConfig.type = 'scatter';
    chartConfig.data = {
      datasets: chartDatasets
    };
    chartConfig.options.scales = {
      x: { title: { display: true, text: xMetric || 'X Metric' } },
      y: { title: { display: true, text: yMetric || 'Y Metric' } }
    };
  }

  window.chartInstance = new Chart(ctx, chartConfig);

  // --- Store user selections for recommendations ---
  if (chartDatasets.length === 1 && chartDatasets[0].data.length > 0) {
    userSelections.push({ sport, seasons: [...seasons], teams: chartDatasets[0].data.map(d => d.label) });
    if (userSelections.length > 10) userSelections = userSelections.slice(-10);
  }

  // --- Recommendations Sidebar ---
  const recommendSidebar = document.getElementById('recommendSidebar');
  if (userSelections.length > 0) {
    recommendSidebar.style.display = 'block';
    recommendSidebar.innerHTML = '<div style="font-weight:bold;margin-bottom:8px;">Recommended Teams</div><div style="text-align:center;"><em>Loading...</em></div>';
    fetch('/ai/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selections: userSelections })
    })
      .then(res => res.json())
      .then(json => {
        let recs = json.recommendations;
        if (typeof recs === 'string') {
          try { recs = JSON.parse(recs); } catch {}
        }
        if (Array.isArray(recs)) {
          recommendSidebar.innerHTML = '<div style="font-weight:bold;margin-bottom:8px;">Recommended Teams</div>' +
            recs.map(team => `<div style="background:#fff;border-radius:6px;box-shadow:0 1px 4px #0001;padding:10px 8px;margin-bottom:10px;">${team.name || team}</div>`).join('');
        } else {
          recommendSidebar.innerHTML = '<div style="font-weight:bold;margin-bottom:8px;">Recommended Teams</div><div>No recommendations.</div>';
        }
      })
      .catch(() => {
        recommendSidebar.innerHTML = '<div style="font-weight:bold;margin-bottom:8px;">Recommended Teams</div><div style="color:#e74c3c">Failed to load recommendations.</div>';
      });
  } else {
    recommendSidebar.style.display = 'none';
    recommendSidebar.innerHTML = '';
  }

  // --- AI Insights Panel ---
  const insightsPanel = document.getElementById('insightsPanel');
  if (datasets.length === 1 && datasets[0]?.data?.length > 0) {
    insightsPanel.style.display = 'block';
    insightsPanel.innerHTML = '<em>Loading AI insights...</em>';
    fetch(`/ai/insights/${sport}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: datasets[0].data })
    })
      .then(res => res.json())
      .then(json => {
        insightsPanel.innerHTML = `<b>AI Insights:</b><br><div style="white-space:pre-line;margin-top:8px;">${json.summary || 'No summary.'}</div>`;
      })
      .catch(() => {
        insightsPanel.innerHTML = '<span style="color:#e74c3c">Failed to load AI insights.</span>';
      });
  } else {
    insightsPanel.style.display = 'none';
    insightsPanel.innerHTML = '';
  }
}

// --- Baseball Stats Modal ---
function showBaseballStatsModal(stats) {
  let modal = document.getElementById('baseballStatsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'baseballStatsModal';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.background = '#fff';
    modal.style.borderRadius = '12px';
    modal.style.boxShadow = '0 4px 24px #0003';
    modal.style.zIndex = '2000';
    modal.style.padding = '32px 28px 20px 28px';
    modal.style.minWidth = '340px';
    modal.style.maxWidth = '90vw';
    modal.style.maxHeight = '80vh';
    modal.style.overflowY = 'auto';
    modal.innerHTML = '';
    document.body.appendChild(modal);
  }
  // Close button
  modal.innerHTML = '<button id="closeBaseballStatsModal" style="position:absolute;top:10px;right:16px;font-size:1.3em;background:none;border:none;cursor:pointer;color:#888">&times;</button>';
  // Stats content
  let html = '<h2 style="margin-top:0">Baseball Team Stats</h2>';
  if (!stats || !stats.team || !stats.team.statistics) {
    html += '<div>No stats available.</div>';
  } else {
    const s = stats.team.statistics;
    html += '<table style="width:100%;margin-top:10px;font-size:1em">';
    html += '<tr><th style="text-align:left">Stat</th><th style="text-align:right">Value</th></tr>';
    // Core
    html += `<tr><td>Batting Avg</td><td style="text-align:right">${s.batting?.avg ?? '-'}</td></tr>`;
    html += `<tr><td>Home Runs</td><td style="text-align:right">${s.batting?.hr ?? '-'}</td></tr>`;
    html += `<tr><td>OPS</td><td style="text-align:right">${s.batting?.ops ?? '-'}</td></tr>`;
    html += `<tr><td>ERA</td><td style="text-align:right">${s.pitching?.era ?? '-'}</td></tr>`;
    html += `<tr><td>Wins</td><td style="text-align:right">${s.pitching?.wins ?? '-'}</td></tr>`;
    html += `<tr><td>Saves</td><td style="text-align:right">${s.pitching?.saves ?? '-'}</td></tr>`;
    // Advanced
    html += `<tr><td>wRC+</td><td style="text-align:right">${s.batting?.wrc_plus ?? '-'}</td></tr>`;
    html += `<tr><td>wOBA</td><td style="text-align:right">${s.batting?.woba ?? '-'}</td></tr>`;
    html += `<tr><td>FIP</td><td style="text-align:right">${s.pitching?.fip ?? '-'}</td></tr>`;
    html += `<tr><td>xFIP</td><td style="text-align:right">${s.pitching?.xfip ?? '-'}</td></tr>`;
    html += `<tr><td>BABIP</td><td style="text-align:right">${s.batting?.babip ?? '-'}</td></tr>`;
    html += `<tr><td>K/9</td><td style="text-align:right">${s.pitching?.k9 ?? '-'}</td></tr>`;
    html += `<tr><td>BB/9</td><td style="text-align:right">${s.pitching?.bb9 ?? '-'}</td></tr>`;
    // Fantasy/box
    html += `<tr><td>Singles</td><td style="text-align:right">${s.batting?.singles ?? '-'}</td></tr>`;
    html += `<tr><td>Doubles</td><td style="text-align:right">${s.batting?.doubles ?? '-'}</td></tr>`;
    html += `<tr><td>Triples</td><td style="text-align:right">${s.batting?.triples ?? '-'}</td></tr>`;
    html += `<tr><td>Runs</td><td style="text-align:right">${s.batting?.runs ?? '-'}</td></tr>`;
    html += `<tr><td>RBI</td><td style="text-align:right">${s.batting?.rbi ?? '-'}</td></tr>`;
    html += `<tr><td>Walks</td><td style="text-align:right">${s.batting?.bb ?? '-'}</td></tr>`;
    html += `<tr><td>HBP</td><td style="text-align:right">${s.batting?.hbp ?? '-'}</td></tr>`;
    html += `<tr><td>SB</td><td style="text-align:right">${s.batting?.sb ?? '-'}</td></tr>`;
    html += `<tr><td>CS</td><td style="text-align:right">${s.batting?.cs ?? '-'}</td></tr>`;
    html += `<tr><td>IP</td><td style="text-align:right">${s.pitching?.ip ?? '-'}</td></tr>`;
    html += '</table>';
  }
  modal.innerHTML += html;
  document.getElementById('closeBaseballStatsModal').onclick = () => { modal.remove(); };
}

// --- F1 Stats Modal ---
function showF1StatsModal(stats) {
  let modal = document.getElementById('f1StatsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'f1StatsModal';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.background = '#fff';
    modal.style.borderRadius = '12px';
    modal.style.boxShadow = '0 4px 24px #0003';
    modal.style.zIndex = '2000';
    modal.style.padding = '32px 28px 20px 28px';
    modal.style.minWidth = '340px';
    modal.style.maxWidth = '90vw';
    modal.style.maxHeight = '80vh';
    modal.style.overflowY = 'auto';
    modal.innerHTML = '';
    document.body.appendChild(modal);
  }
  // Close button
  modal.innerHTML = '<button id="closeF1StatsModal" style="position:absolute;top:10px;right:16px;font-size:1.3em;background:none;border:none;cursor:pointer;color:#888">&times;</button>';
  // Stats content
  let html = '<h2 style="margin-top:0">F1 Driver/Team Stats</h2>';
  if (!stats || (!stats.driver && !stats.team)) {
    html += '<div>No stats available.</div>';
  } else {
    const s = stats.driver || stats.team;
    html += '<table style="width:100%;margin-top:10px;font-size:1em">';
    html += '<tr><th style="text-align:left">Stat</th><th style="text-align:right">Value</th></tr>';
    html += `<tr><td>Lap Times (avg)</td><td style="text-align:right">${s.lap_times_avg ?? '-'}</td></tr>`;
    html += `<tr><td>Top Speed (km/h)</td><td style="text-align:right">${s.top_speed ?? '-'}</td></tr>`;
    html += `<tr><td>Positions Gained</td><td style="text-align:right">${s.positions_gained ?? '-'}</td></tr>`;
    html += `<tr><td>Wins</td><td style="text-align:right">${s.wins ?? '-'}</td></tr>`;
    html += `<tr><td>DNFs</td><td style="text-align:right">${s.dnfs ?? '-'}</td></tr>`;
    html += `<tr><td>G-Forces (max)</td><td style="text-align:right">${s.g_force_max ?? '-'}</td></tr>`;
    html += `<tr><td>Steering Input</td><td style="text-align:right">${s.steering_input ?? '-'}</td></tr>`;
    html += `<tr><td>Braking Input</td><td style="text-align:right">${s.braking_input ?? '-'}</td></tr>`;
    html += `<tr><td>Throttle Input</td><td style="text-align:right">${s.throttle_input ?? '-'}</td></tr>`;
    html += `<tr><td>Tyre Degradation (%)</td><td style="text-align:right">${s.tyre_deg ?? '-'}</td></tr>`;
    html += `<tr><td>Fuel Consumption (L/100km)</td><td style="text-align:right">${s.fuel_cons ?? '-'}</td></tr>`;
    html += `<tr><td>Fastest Lap</td><td style="text-align:right">${s.fastest_lap ?? '-'}</td></tr>`;
    html += `<tr><td>Overtakes</td><td style="text-align:right">${s.overtakes ?? '-'}</td></tr>`;
    html += `<tr><td>Average Fantasy Points</td><td style="text-align:right">${s.fantasy_points_avg ?? '-'}</td></tr>`;
    html += '</table>';
    // Real-time/strategic/skill/fantasy analysis
    if (stats.analysis) {
      html += `<div style="margin-top:18px;"><b>AI Analysis:</b><br><div style="white-space:pre-line;margin-top:6px;">${stats.analysis}</div></div>`;
    }
  }
  modal.innerHTML += html;
  document.getElementById('closeF1StatsModal').onclick = () => { modal.remove(); };
}

// --- Football Stats Modal ---
function showFootballStatsModal(stats) {
  let modal = document.getElementById('footballStatsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'footballStatsModal';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.background = '#fff';
    modal.style.borderRadius = '12px';
    modal.style.boxShadow = '0 4px 24px #0003';
    modal.style.zIndex = '2000';
    modal.style.padding = '32px 28px 20px 28px';
    modal.style.minWidth = '340px';
    modal.style.maxWidth = '90vw';
    modal.style.maxHeight = '80vh';
    modal.style.overflowY = 'auto';
    modal.innerHTML = '';
    document.body.appendChild(modal);
  }
  // Close button
  modal.innerHTML = '<button id="closeFootballStatsModal" style="position:absolute;top:10px;right:16px;font-size:1.3em;background:none;border:none;cursor:pointer;color:#888">&times;</button>';
  // Stats content
  let html = '<h2 style="margin-top:0">Football Team/Player Stats</h2>';
  if (!stats || (!stats.team && !stats.player)) {
    html += '<div>No stats available.</div>';
  } else {
    const s = stats.player || stats.team;
    html += '<table style="width:100%;margin-top:10px;font-size:1em">';
    html += '<tr><th style="text-align:left">Stat</th><th style="text-align:right">Value</th></tr>';
    // Core
    html += `<tr><td>Goals</td><td style="text-align:right">${s.goals ?? '-'}</td></tr>`;
    html += `<tr><td>Assists</td><td style="text-align:right">${s.assists ?? '-'}</td></tr>`;
    html += `<tr><td>Shots</td><td style="text-align:right">${s.shots ?? '-'}</td></tr>`;
    html += `<tr><td>Shots On Goal</td><td style="text-align:right">${s.shots_on_goal ?? '-'}</td></tr>`;
    html += `<tr><td>Fouls</td><td style="text-align:right">${s.fouls ?? '-'}</td></tr>`;
    html += `<tr><td>Tackles Won</td><td style="text-align:right">${s.tackles_won ?? '-'}</td></tr>`;
    html += `<tr><td>Saves</td><td style="text-align:right">${s.saves ?? '-'}</td></tr>`;
    html += `<tr><td>Clean Sheets</td><td style="text-align:right">${s.clean_sheets ?? '-'}</td></tr>`;
    // Advanced
    html += `<tr><td>Expected Goals (xG)</td><td style="text-align:right">${s.xg ?? '-'}</td></tr>`;
    html += `<tr><td>On-Ball Value (OBV)</td><td style="text-align:right">${s.obv ?? '-'}</td></tr>`;
    html += `<tr><td>HOPS</td><td style="text-align:right">${s.hops ?? '-'}</td></tr>`;
    html += `<tr><td>Pressures</td><td style="text-align:right">${s.pressures ?? '-'}</td></tr>`;
    // Fantasy/box
    html += `<tr><td>Crosses</td><td style="text-align:right">${s.crosses ?? '-'}</td></tr>`;
    html += `<tr><td>Fouled</td><td style="text-align:right">${s.fouled ?? '-'}</td></tr>`;
    html += `<tr><td>Interceptions</td><td style="text-align:right">${s.interceptions ?? '-'}</td></tr>`;
    html += `<tr><td>Cards</td><td style="text-align:right">${s.cards ?? '-'}</td></tr>`;
    html += `<tr><td>PK Misses</td><td style="text-align:right">${s.pk_misses ?? '-'}</td></tr>`;
    html += `<tr><td>Goals Against</td><td style="text-align:right">${s.goals_against ?? '-'}</td></tr>`;
    html += `<tr><td>Wins</td><td style="text-align:right">${s.wins ?? '-'}</td></tr>`;
    html += `<tr><td>PK Saves</td><td style="text-align:right">${s.pk_saves ?? '-'}</td></tr>`;
    html += '</table>';
    // Tactical/contribution/quality/aerial/fantasy analysis
    if (stats.analysis) {
      html += `<div style="margin-top:18px;"><b>AI Analysis:</b><br><div style="white-space:pre-line;margin-top:6px;">${stats.analysis}</div></div>`;
    }
  }
  modal.innerHTML += html;
  document.getElementById('closeFootballStatsModal').onclick = () => { modal.remove(); };
}

// --- American Football Stats Modal ---
function showAmericanFootballStatsModal(stats) {
  let modal = document.getElementById('americanFootballStatsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'americanFootballStatsModal';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.background = '#fff';
    modal.style.borderRadius = '12px';
    modal.style.boxShadow = '0 4px 24px #0003';
    modal.style.zIndex = '2000';
    modal.style.padding = '32px 28px 20px 28px';
    modal.style.minWidth = '340px';
    modal.style.maxWidth = '90vw';
    modal.style.maxHeight = '80vh';
    modal.style.overflowY = 'auto';
    modal.innerHTML = '';
    document.body.appendChild(modal);
  }
  // Close button
  modal.innerHTML = '<button id="closeAmericanFootballStatsModal" style="position:absolute;top:10px;right:16px;font-size:1.3em;background:none;border:none;cursor:pointer;color:#888">&times;</button>';
  // Stats content
  let html = '<h2 style="margin-top:0">American Football Team/Player Stats</h2>';
  if (!stats || (!stats.team && !stats.player)) {
    html += '<div>No stats available.</div>';
  } else {
    const s = stats.player || stats.team;
    html += '<table style="width:100%;margin-top:10px;font-size:1em">';
    html += '<tr><th style="text-align:left">Stat</th><th style="text-align:right">Value</th></tr>';
    // Core
    html += `<tr><td>Passing Yards</td><td style="text-align:right">${s.passing_yards ?? '-'}</td></tr>`;
    html += `<tr><td>Passing TDs</td><td style="text-align:right">${s.passing_tds ?? '-'}</td></tr>`;
    html += `<tr><td>Interceptions</td><td style="text-align:right">${s.interceptions ?? '-'}</td></tr>`;
    html += `<tr><td>Rushing Yards</td><td style="text-align:right">${s.rushing_yards ?? '-'}</td></tr>`;
    html += `<tr><td>Receptions</td><td style="text-align:right">${s.receptions ?? '-'}</td></tr>`;
    html += `<tr><td>Sacks</td><td style="text-align:right">${s.sacks ?? '-'}</td></tr>`;
    html += `<tr><td>Turnovers</td><td style="text-align:right">${s.turnovers ?? '-'}</td></tr>`;
    // Advanced
    html += `<tr><td>ADP</td><td style="text-align:right">${s.adp ?? '-'}</td></tr>`;
    html += `<tr><td>Projected Points</td><td style="text-align:right">${s.projected_points ?? '-'}</td></tr>`;
    html += `<tr><td>DVOA</td><td style="text-align:right">${s.dvoa ?? '-'}</td></tr>`;
    html += `<tr><td>XFP</td><td style="text-align:right">${s.xfp ?? '-'}</td></tr>`;
    html += `<tr><td>Snap Counts</td><td style="text-align:right">${s.snap_counts ?? '-'}</td></tr>`;
    html += `<tr><td>Targets</td><td style="text-align:right">${s.targets ?? '-'}</td></tr>`;
    html += `<tr><td>Red Zone Touches</td><td style="text-align:right">${s.red_zone_touches ?? '-'}</td></tr>`;
    html += `<tr><td>Red Zone Summaries</td><td style="text-align:right">${s.red_zone_summaries ?? '-'}</td></tr>`;
    html += `<tr><td>Granular Data</td><td style="text-align:right">${s.granular_data ?? '-'}</td></tr>`;
    // Fantasy/box
    html += `<tr><td>Fantasy Points</td><td style="text-align:right">${s.fantasy_points ?? '-'}</td></tr>`;
    html += '</table>';
    // Valuation/draft/lineup/situational/betting/fantasy analysis
    if (stats.analysis) {
      html += `<div style="margin-top:18px;"><b>AI Analysis:</b><br><div style="white-space:pre-line;margin-top:6px;">${stats.analysis}</div></div>`;
    }
  }
  modal.innerHTML += html;
  document.getElementById('closeAmericanFootballStatsModal').onclick = () => { modal.remove(); };
}

// --- Basketball Stats Modal ---
function showBasketballStatsModal(stats) {
  let modal = document.getElementById('basketballStatsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'basketballStatsModal';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.background = '#fff';
    modal.style.borderRadius = '12px';
    modal.style.boxShadow = '0 4px 24px #0003';
    modal.style.zIndex = '2000';
    modal.style.padding = '32px 28px 20px 28px';
    modal.style.minWidth = '340px';
    modal.style.maxWidth = '90vw';
    modal.style.maxHeight = '80vh';
    modal.style.overflowY = 'auto';
    modal.innerHTML = '';
    document.body.appendChild(modal);
  }
  // Close button
  modal.innerHTML = '<button id="closeBasketballStatsModal" style="position:absolute;top:10px;right:16px;font-size:1.3em;background:none;border:none;cursor:pointer;color:#888">&times;</button>';
  // Stats content
  let html = '<h2 style="margin-top:0">Basketball Team/Player Stats</h2>';
  if (!stats || (!stats.team && !stats.player)) {
    html += '<div>No stats available.</div>';
  } else {
    const s = stats.player || stats.team;
    html += '<table style="width:100%;margin-top:10px;font-size:1em">';
    html += '<tr><th style="text-align:left">Stat</th><th style="text-align:right">Value</th></tr>';
    // Core
    html += `<tr><td>Points</td><td style="text-align:right">${s.points ?? '-'}</td></tr>`;
    html += `<tr><td>Rebounds</td><td style="text-align:right">${s.rebounds ?? '-'}</td></tr>`;
    html += `<tr><td>Assists</td><td style="text-align:right">${s.assists ?? '-'}</td></tr>`;
    html += `<tr><td>Steals</td><td style="text-align:right">${s.steals ?? '-'}</td></tr>`;
    html += `<tr><td>Blocks</td><td style="text-align:right">${s.blocks ?? '-'}</td></tr>`;
    // Advanced
    html += `<tr><td>PIE</td><td style="text-align:right">${s.pie ?? '-'}</td></tr>`;
    html += `<tr><td>Net Rating</td><td style="text-align:right">${s.net_rating ?? '-'}</td></tr>`;
    html += `<tr><td>Usage</td><td style="text-align:right">${s.usage ?? '-'}</td></tr>`;
    html += `<tr><td>Pace</td><td style="text-align:right">${s.pace ?? '-'}</td></tr>`;
    html += `<tr><td>True Shooting %</td><td style="text-align:right">${s.ts_pct ?? '-'}</td></tr>`;
    html += `<tr><td>PER</td><td style="text-align:right">${s.per ?? '-'}</td></tr>`;
    html += `<tr><td>Plus/Minus</td><td style="text-align:right">${s.plus_minus ?? '-'}</td></tr>`;
    html += `<tr><td>Play-by-Play</td><td style="text-align:right">${s.play_by_play ?? '-'}</td></tr>`;
    // Fantasy/box
    html += `<tr><td>Turnovers</td><td style="text-align:right">${s.turnovers ?? '-'}</td></tr>`;
    html += `<tr><td>Fouls</td><td style="text-align:right">${s.fouls ?? '-'}</td></tr>`;
    html += '</table>';
    // Efficiency/effectiveness/flow/strategy/fantasy analysis
    if (stats.analysis) {
      html += `<div style="margin-top:18px;"><b>AI Analysis:</b><br><div style="white-space:pre-line;margin-top:6px;">${stats.analysis}</div></div>`;
    }
  }
  modal.innerHTML += html;
  document.getElementById('closeBasketballStatsModal').onclick = () => { modal.remove(); };
}

// --- Chart click handler for baseball teams ---
function addBaseballChartClickHandler() {
  const chart = window.chartInstance;
  if (!chart) return;
  const canvas = chart.canvas;
  canvas.onclick = async function(evt) {
    const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
    if (points.length && chart.data.datasets[0].label.includes('baseball')) {
      const idx = points[0].index;
      const team = chart.data.datasets[0].data[idx];
      if (!team || !team.label) return;
      showLoading(true);
      try {
        // Try to find team ID by name (fetch teams list)
        const season = (document.getElementById('seasonSelect')?.value) || new Date().getFullYear();
        const teamsRes = await fetch(`${BACKEND_URL}/api/baseball/teams?season=${season}`);
        const teams = await teamsRes.json();
        const found = teams.find(t => t.team?.name === team.label);
        if (!found || !found.team?.id) throw new Error('Team ID not found');
        const statsRes = await fetch(`${BACKEND_URL}/api/baseball/stats?team=${found.team.id}&season=${season}`);
        const stats = await statsRes.json();
        showBaseballStatsModal(stats);
      } catch (e) {
        showError('Could not load advanced stats for this team.');
      }
      showLoading(false);
    }
  };
}

// --- Chart click handler for F1 drivers/teams ---
function addF1ChartClickHandler() {
  const chart = window.chartInstance;
  if (!chart) return;
  const canvas = chart.canvas;
  canvas.onclick = async function(evt) {
    const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
    if (points.length && chart.data.datasets[0].label.toLowerCase().includes('f1')) {
      const idx = points[0].index;
      const item = chart.data.datasets[0].data[idx];
      if (!item || !item.label) return;
      showLoading(true);
      try {
        // Try to find driver/team ID by name (fetch teams/drivers list)
        const season = (document.getElementById('seasonSelect')?.value) || new Date().getFullYear();
        // Try driver first
        let found = null;
        let res = await fetch(`${BACKEND_URL}/api/f1/drivers?season=${season}`);
        let drivers = await res.json();
        found = drivers.find(d => d.driver?.name === item.label);
        let stats = null;
        if (found && found.driver?.id) {
          let statsRes = await fetch(`${BACKEND_URL}/api/f1/stats?driver=${found.driver.id}&season=${season}`);
          stats = await statsRes.json();
        } else {
          // Try constructor/team
          res = await fetch(`${BACKEND_URL}/api/f1/teams?season=${season}`);
          let teams = await res.json();
          found = teams.find(t => t.team?.name === item.label);
          if (found && found.team?.id) {
            let statsRes = await fetch(`${BACKEND_URL}/api/f1/stats?team=${found.team.id}&season=${season}`);
            stats = await statsRes.json();
          }
        }
        if (!stats) throw new Error('No stats found');
        showF1StatsModal(stats);
      } catch (e) {
        showError('Could not load advanced stats for this driver/team.');
      }
      showLoading(false);
    }
  };
}

// --- Chart click handler for football teams/players ---
function addFootballChartClickHandler() {
  const chart = window.chartInstance;
  if (!chart) return;
  const canvas = chart.canvas;
  canvas.onclick = async function(evt) {
    const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
    if (points.length && chart.data.datasets[0].label.toLowerCase().includes('football')) {
      const idx = points[0].index;
      const item = chart.data.datasets[0].data[idx];
      if (!item || !item.label) return;
      showLoading(true);
      try {
        // Try to find team/player ID by name (fetch teams/players list)
        const season = (document.getElementById('seasonSelect')?.value) || new Date().getFullYear();
        // Try player first
        let found = null;
        let res = await fetch(`${BACKEND_URL}/api/football/players?season=${season}`);
        let players = await res.json();
        found = players.find(p => p.player?.name === item.label);
        let stats = null;
        if (found && found.player?.id) {
          let statsRes = await fetch(`${BACKEND_URL}/api/football/stats?player=${found.player.id}&season=${season}`);
          stats = await statsRes.json();
        } else {
          // Try team
          res = await fetch(`${BACKEND_URL}/api/football/teams?season=${season}`);
          let teams = await res.json();
          found = teams.find(t => t.team?.name === item.label);
          if (found && found.team?.id) {
            let statsRes = await fetch(`${BACKEND_URL}/api/football/stats?team=${found.team.id}&season=${season}`);
            stats = await statsRes.json();
          }
        }
        if (!stats) throw new Error('No stats found');
        showFootballStatsModal(stats);
      } catch (e) {
        showError('Could not load advanced stats for this team/player.');
      }
      showLoading(false);
    }
  };
}

// --- Chart click handler for American football teams/players ---
function addAmericanFootballChartClickHandler() {
  const chart = window.chartInstance;
  if (!chart) return;
  const canvas = chart.canvas;
  canvas.onclick = async function(evt) {
    const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
    if (points.length && chart.data.datasets[0].label.toLowerCase().includes('american football')) {
      const idx = points[0].index;
      const item = chart.data.datasets[0].data[idx];
      if (!item || !item.label) return;
      showLoading(true);
      try {
        // Try to find team/player ID by name (fetch teams/players list)
        const season = (document.getElementById('seasonSelect')?.value) || new Date().getFullYear();
        // Try player first
        let found = null;
        let res = await fetch(`${BACKEND_URL}/api/american-football/players?season=${season}`);
        let players = await res.json();
        found = players.find(p => p.player?.name === item.label);
        let stats = null;
        if (found && found.player?.id) {
          let statsRes = await fetch(`${BACKEND_URL}/api/american-football/stats?player=${found.player.id}&season=${season}`);
          stats = await statsRes.json();
        } else {
          // Try team
          res = await fetch(`${BACKEND_URL}/api/american-football/teams?season=${season}`);
          let teams = await res.json();
          found = teams.find(t => t.team?.name === item.label);
          if (found && found.team?.id) {
            let statsRes = await fetch(`${BACKEND_URL}/api/american-football/stats?team=${found.team.id}&season=${season}`);
            stats = await statsRes.json();
          }
        }
        if (!stats) throw new Error('No stats found');
        showAmericanFootballStatsModal(stats);
      } catch (e) {
        showError('Could not load advanced stats for this team/player.');
      }
      showLoading(false);
    }
  };
}

// --- Chart click handler for basketball teams/players ---
function addBasketballChartClickHandler() {
  const chart = window.chartInstance;
  if (!chart) return;
  const canvas = chart.canvas;
  canvas.onclick = async function(evt) {
    const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
    if (points.length && chart.data.datasets[0].label.toLowerCase().includes('basketball')) {
      const idx = points[0].index;
      const item = chart.data.datasets[0].data[idx];
      if (!item || !item.label) return;
      showLoading(true);
      try {
        // Try to find team/player ID by name (fetch teams/players list)
        const season = (document.getElementById('seasonSelect')?.value) || new Date().getFullYear();
        // Try player first
        let found = null;
        let res = await fetch(`${BACKEND_URL}/api/basketball/players?season=${season}`);
        let players = await res.json();
        found = players.find(p => p.player?.name === item.label);
        let stats = null;
        if (found && found.player?.id) {
          let statsRes = await fetch(`${BACKEND_URL}/api/basketball/stats?player=${found.player.id}&season=${season}`);
          stats = await statsRes.json();
        } else {
          // Try team
          res = await fetch(`${BACKEND_URL}/api/basketball/teams?season=${season}`);
          let teams = await res.json();
          found = teams.find(t => t.team?.name === item.label);
          if (found && found.team?.id) {
            let statsRes = await fetch(`${BACKEND_URL}/api/basketball/stats?team=${found.team.id}&season=${season}`);
            stats = await statsRes.json();
          }
        }
        if (!stats) throw new Error('No stats found');
        showBasketballStatsModal(stats);
      } catch (e) {
        showError('Could not load advanced stats for this team/player.');
      }
      showLoading(false);
    }
  };
}

// Attach click handler after chart creation
const origCreateChartBasketball = createChart;
createChart = async function(sport, seasons) {
  await origCreateChartBasketball.apply(this, arguments);
  if (sport === 'baseball') addBaseballChartClickHandler();
  if (sport === 'f1') addF1ChartClickHandler();
  if (sport === 'football') addFootballChartClickHandler();
  if (sport === 'american football') addAmericanFootballChartClickHandler();
  if (sport === 'basketball') addBasketballChartClickHandler();
};

// --- Visualization Explorer Panel ---
function showVisualizationExplorer() {
  let panel = document.getElementById('vizExplorerPanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'vizExplorerPanel';
    panel.style.position = 'fixed';
    panel.style.right = '24px';
    panel.style.bottom = '24px';
    panel.style.width = '340px';
  panel.style.background = '#fff';
  panel.style.borderRadius = '16px';
  panel.style.boxShadow = '0 6px 32px #0002';
  panel.style.zIndex = '3000';
  panel.style.padding = '22px 18px 16px 18px';
  panel.style.maxHeight = '80vh';
  panel.style.overflowY = 'auto';
    panel.innerHTML = '';
    document.body.appendChild(panel);
  }
  panel.innerHTML = '<div style="font-weight:bold;font-size:1.2em;margin-bottom:10px;">Visualization Explorer</div>';
  const vizTypes = [
    {
      name: 'Heatmaps',
      desc: 'Player movement, efficiency zones, activity intensity, tactical setups.',
      use: 'Tactical understanding, Player strengths/weaknesses, Opponent analysis.',
      sports: 'Basketball, Football/Soccer, F1',
      example: 'heatmap',
    },
    {
      name: 'Line Graphs & Time Series',
      desc: 'Performance trends over time, historical progression.',
      use: 'Player/team development tracking, Identifying hot/cold streaks, Historical comparisons.',
      sports: 'Baseball, F1, Basketball',
      example: 'line',
    },
    {
      name: 'Bar Charts & Histograms',
      desc: 'Comparative analysis of categorical data, distribution of values.',
      use: 'Debating player value, Comparing teams/players, Understanding statistical distributions.',
      sports: 'All sports, NBA',
      example: 'bar',
    },
    {
      name: 'Scatter/Bubble Charts',
      desc: 'Relationships between multiple variables, correlations.',
      use: 'Identifying statistical correlations, Visualizing multi-dimensional player value.',
      sports: 'Baseball, American Football',
      example: 'scatter',
    },
    {
      name: 'Player Comparison Tools',
      desc: 'Side-by-side comparison of multiple players/teams across metrics.',
      use: 'Informed fantasy/betting decisions, Debating "GOAT" status, Scouting.',
      sports: 'All sports',
      example: 'compare',
    },
    {
      name: 'Win Probability Charts',
      desc: 'Real-time likelihood of winning, game flow/momentum.',
      use: 'Strategic decision-making for fantasy/betting, Understanding game turning points, Enhancing live viewing experience.',
      sports: 'American Football, Basketball, Baseball, Football/Soccer',
      example: 'winprob',
    },
    {
      name: 'Interactive Dashboards',
      desc: 'Consolidated insights with drill-down capabilities, customizable views.',
      use: 'Overall fan experience, Deep analytical dives, Personalized data access.',
      sports: 'All sports',
      example: 'dashboard',
    },
  ];
  vizTypes.forEach(viz => {
    const btn = document.createElement('button');
    btn.textContent = viz.name;
    btn.style.display = 'block';
    btn.style.width = '100%';
    btn.style.margin = '8px 0';
    btn.style.padding = '12px 10px';
    btn.style.borderRadius = '8px';
    btn.style.border = '1px solid #d0d7e2';
    btn.style.background = '#f7fafd';
    btn.style.cursor = 'pointer';
    btn.style.fontWeight = '500';
    btn.style.fontSize = '1em';
    btn.title = viz.desc + ' Example: ' + viz.sports;
    btn.onclick = () => showVizTypeModal(viz);
    panel.appendChild(btn);
  });
  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '8px';
  closeBtn.style.right = '14px';
  closeBtn.style.fontSize = '1.5em';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.color = '#888';
  closeBtn.style.padding = '0 6px';
  closeBtn.onmouseover = () => { closeBtn.style.color = '#e74c3c'; };
  closeBtn.onmouseout = () => { closeBtn.style.color = '#888'; };
  closeBtn.onclick = () => { panel.remove(); };
  panel.appendChild(closeBtn);
}

function showVizTypeModal(viz) {
  let modal = document.getElementById('vizTypeModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'vizTypeModal';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
  modal.style.background = '#fff';
  modal.style.borderRadius = '16px';
  modal.style.boxShadow = '0 8px 32px #0002';
  modal.style.zIndex = '4000';
  modal.style.padding = '32px 28px 20px 28px';
  modal.style.minWidth = '340px';
  modal.style.maxWidth = '96vw';
  modal.style.maxHeight = '80vh';
  modal.style.overflowY = 'auto';
  modal.style.border = '1px solid #e3e8f0';
    modal.innerHTML = '';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `<button id="closeVizTypeModal" style="position:absolute;top:10px;right:16px;font-size:1.5em;background:none;border:none;cursor:pointer;color:#888;padding:0 6px">&times;</button>`;
  let html = `<h2 style="margin-top:0;font-size:1.3em;font-weight:600;">${viz.name}</h2>`;
  html += `<div style="margin-bottom:8px;font-size:1.08em;"><b>Purpose:</b> ${viz.desc}</div>`;
  html += `<div style="margin-bottom:8px;"><b>Best Use Case:</b> ${viz.use}</div>`;
  html += `<div style="margin-bottom:8px;"><b>Example Sport(s):</b> ${viz.sports}</div>`;
  // Example image or chart placeholder
  html += `<div style="margin:18px 0 0 0;text-align:center;color:#888;"><em>Example visualization coming soon...</em></div>`;
  modal.innerHTML += html;
  document.getElementById('closeVizTypeModal').onclick = () => { modal.remove(); };
}

// Add Visualization Explorer button to UI on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  // ...existing code...
  let btn = document.getElementById('vizExplorerBtn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'vizExplorerBtn';
    btn.textContent = 'Visualization Explorer';
    btn.style.position = 'fixed';
    btn.style.right = '24px';
    btn.style.bottom = '24px';
    btn.style.zIndex = '2500';
    btn.style.background = '#3498db';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.borderRadius = '8px';
    btn.style.padding = '12px 18px';
    btn.style.fontSize = '1.1em';
    btn.style.boxShadow = '0 2px 8px #0002';
    btn.style.cursor = 'pointer';
    btn.onclick = showVisualizationExplorer;
    document.body.appendChild(btn);
  }
});
