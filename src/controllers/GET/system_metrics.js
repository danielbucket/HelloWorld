import fs from 'fs';
import path from 'path';

const PROC_ROOT = '/proc';
const SYS_ROOT = '/sys';

class MetricsError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MetricsError';
  }
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8').trim();
  } catch (err) {
    throw new MetricsError(`Failed to read ${filePath}: ${err.message}`);
  }
}

function memoryInfo() {
  const meminfo = readText(`${PROC_ROOT}/meminfo`);
  const values = {};
  
  for (const line of meminfo.split('\n')) {
    const [key, rest] = line.split(':');
    if (key && rest) {
      const value = parseInt(rest.trim().split(/\s+/)[0], 10);
      values[key] = value;
    }
  }

  const totalKib = values.MemTotal;
  const availableKib = values.MemAvailable;
  
  if (totalKib === undefined || availableKib === undefined) {
    throw new MetricsError('MemTotal or MemAvailable missing from meminfo');
  }

  const usedKib = Math.max(totalKib - availableKib, 0);
  
  return {
    total_kib: totalKib,
    available_kib: availableKib,
    used_kib: usedKib,
  };
}

function loadAverage() {
  const loadavg = readText(`${PROC_ROOT}/loadavg`).split(/\s+/);
  
  if (loadavg.length < 3) {
    throw new MetricsError('Unexpected loadavg format');
  }

  return {
    '1m': parseFloat(loadavg[0]),
    '5m': parseFloat(loadavg[1]),
    '15m': parseFloat(loadavg[2]),
  };
}

function uptimeSeconds() {
  const uptime = readText(`${PROC_ROOT}/uptime`).split(/\s+/);
  
  if (uptime.length < 1) {
    throw new MetricsError('Unexpected uptime format');
  }

  return parseFloat(uptime[0]);
}

function cpuTemperatureCelsius() {
  const thermalPath = path.join(SYS_ROOT, 'class', 'thermal', 'thermal_zone0', 'temp');
  
  if (!fs.existsSync(thermalPath)) {
    return null;
  }

  const raw = readText(thermalPath);
  return Math.round((parseInt(raw, 10) / 1000.0) * 100) / 100;
}

const system_metrics = (req, res) => {
  try {
    return res.json({
      timestamp_epoch: Math.floor(Date.now() / 1000),
      cpu_temperature_celsius: cpuTemperatureCelsius(),
      memory: memoryInfo(),
      load_average: loadAverage(),
      uptime_seconds: uptimeSeconds(),
    });
  } catch (err) {
    return res.status(500).json({
      error: 'failed_to_collect_metrics',
      details: err.message,
    });
  }
};

export { system_metrics };