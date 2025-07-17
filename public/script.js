async function fetchData(sport) {
  const res = await fetch(`/api/data/${sport}`);
  return await res.json();
}

function mapDataToXY(data, sport) {
  switch (sport) {
    case 'baseball':
      return data.map(team => ({
        x: team.statistics?.batting?.ops || 0,
        y: team.statistics?.pitching?.era || 0,
        label: team.team.name
      }));
    case 'f1':
      return data.map(item => ({
        x: Number(item.points),
        y: Number(item.wins),
        label: item.Constructor.name
      }));
    default:
      return data.map(item => ({
        x: Math.random() * 100, // fallback
        y: Math.random() * 100,
        label: item.team?.name || item.name
      }));
  }
}

async function createChart(sport) {
  const raw = await fetchData(sport);
  const ctx = document.getElementById('myChart').getContext('2d');

  if (window.chartInstance) window.chartInstance.destroy();

  const dataset = mapDataToXY(raw, sport);

  window.chartInstance = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: `${sport} Stats`,
        data: dataset,
        backgroundColor: 'rgba(54, 162, 235, 0.7)'
      }]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.raw.label}: (${ctx.raw.x}, ${ctx.raw.y})`
          }
        }
      },
      scales: {
        x: { title: { display: true, text: 'X Axis Metric' } },
        y: { title: { display: true, text: 'Y Axis Metric' } }
      }
    }
  });
}

document.getElementById('sportSelect').addEventListener('change', e => createChart(e.target.value));
createChart('baseball');
