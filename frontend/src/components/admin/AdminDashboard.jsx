import { useState, useEffect } from 'react';
import { Container, Typography, Grid, Paper, Box, useTheme } from '@mui/material';
import { PhotoLibrary, Image as ImageIcon, Storage } from '@mui/icons-material';
import Plot from 'react-plotly.js';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#64748b',
];

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const ChartPaper = ({ children, title }) => (
  <Paper sx={{ p: 2 }}>
    <Typography variant="subtitle1" gutterBottom fontWeight={600}>{title}</Typography>
    {children}
  </Paper>
);

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) =>
  i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i - 12}pm`
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [metrics, setMetrics] = useState(null);
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    adminAPI.getMetrics().then(r => setMetrics(r.data));
    adminAPI.getActivity().then(r => setActivity(r.data));
  }, []);

  const plotLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: theme.palette.text.primary, size: 11 },
    margin: { t: 20, b: 40, l: 40, r: 20 },
    xaxis: { gridcolor: theme.palette.divider },
    yaxis: { gridcolor: theme.palette.divider },
    autosize: true,
    height: 220,
  };

  const plotConfig = { displayModeBar: false, responsive: true };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" mb={1}>Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Welcome, {user?.username}
      </Typography>

      {metrics && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper sx={{ p: 2.5, display: 'flex', alignItems: 'center' }}>
              <PhotoLibrary sx={{ fontSize: 36, mr: 2, color: COLORS[0] }} />
              <Box>
                <Typography variant="h5">{metrics.total_galleries}</Typography>
                <Typography variant="body2" color="text.secondary">Galleries</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper sx={{ p: 2.5, display: 'flex', alignItems: 'center' }}>
              <ImageIcon sx={{ fontSize: 36, mr: 2, color: COLORS[1] }} />
              <Box>
                <Typography variant="h5">{metrics.total_images}</Typography>
                <Typography variant="body2" color="text.secondary">Images</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper sx={{ p: 2.5, display: 'flex', alignItems: 'center' }}>
              <Storage sx={{ fontSize: 36, mr: 2, color: COLORS[2] }} />
              <Box>
                <Typography variant="h5">{formatBytes(metrics.total_storage)}</Typography>
                <Typography variant="body2" color="text.secondary">Storage</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activity && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <ChartPaper title="Activity Heatmap (30 days)">
              <Plot
                data={[{
                  z: activity.activity_heatmap,
                  x: HOURS,
                  y: DAYS,
                  type: 'heatmap',
                  colorscale: [
                    [0, theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9'],
                    [0.25, '#6366f1'],
                    [0.5, '#a855f7'],
                    [0.75, '#ec4899'],
                    [1, '#f43f5e'],
                  ],
                  hovertemplate: '%{y} %{x}: %{z} events<extra></extra>',
                  showscale: false,
                }]}
                layout={{
                  ...plotLayout,
                  height: 200,
                  margin: { t: 10, b: 30, l: 50, r: 20 },
                  yaxis: { ...plotLayout.yaxis, autorange: 'reversed' },
                }}
                config={plotConfig}
                style={{ width: '100%' }}
              />
            </ChartPaper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <ChartPaper title="Uploads (30 days)">
              <Plot
                data={[{
                  x: activity.uploads_by_day.map(d => d.date),
                  y: activity.uploads_by_day.map(d => d.count),
                  type: 'bar',
                  marker: { color: '#6366f1' },
                }]}
                layout={{ ...plotLayout }}
                config={plotConfig}
                style={{ width: '100%' }}
              />
            </ChartPaper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <ChartPaper title="Gallery Views (30 days)">
              <Plot
                data={[{
                  x: activity.views_by_day.map(d => d.date),
                  y: activity.views_by_day.map(d => d.count),
                  type: 'scatter',
                  mode: 'lines+markers',
                  line: { color: '#14b8a6', width: 2 },
                  marker: { size: 4 },
                  fill: 'tozeroy',
                  fillcolor: 'rgba(20, 184, 166, 0.1)',
                }]}
                layout={{ ...plotLayout }}
                config={plotConfig}
                style={{ width: '100%' }}
              />
            </ChartPaper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <ChartPaper title="Downloads (30 days)">
              <Plot
                data={[{
                  x: activity.downloads_by_day.map(d => d.date),
                  y: activity.downloads_by_day.map(d => d.count),
                  type: 'bar',
                  marker: { color: '#f59e0b' },
                }]}
                layout={{ ...plotLayout }}
                config={plotConfig}
                style={{ width: '100%' }}
              />
            </ChartPaper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <ChartPaper title="Storage by Gallery">
              <Plot
                data={[{
                  labels: activity.storage_by_gallery.map(d => d.name),
                  values: activity.storage_by_gallery.map(d => d.size),
                  type: 'pie',
                  textinfo: 'label+percent',
                  hovertemplate: '%{label}<br>%{value:.2s}B<br>%{percent}<extra></extra>',
                  marker: { colors: COLORS },
                }]}
                layout={{ ...plotLayout, showlegend: false, margin: { t: 10, b: 10, l: 10, r: 10 } }}
                config={plotConfig}
                style={{ width: '100%' }}
              />
            </ChartPaper>
          </Grid>

          {activity.uploads_by_gallery.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <ChartPaper title="Recent Uploads by Gallery (30 days)">
                <Plot
                  data={[{
                    x: activity.uploads_by_gallery.map(d => d.name),
                    y: activity.uploads_by_gallery.map(d => d.count),
                    type: 'bar',
                    marker: {
                      color: activity.uploads_by_gallery.map((_, i) => COLORS[i % COLORS.length]),
                    },
                  }]}
                  layout={{ ...plotLayout, height: 200, xaxis: { ...plotLayout.xaxis, tickangle: -30 } }}
                  config={plotConfig}
                  style={{ width: '100%' }}
                />
              </ChartPaper>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
};

export default AdminDashboard;
