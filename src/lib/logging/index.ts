/**
 * PharmaTrace — Logging utility
 *
 * Simple structured logger for server-side use.
 * Can be replaced with a production logging service later.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): LogEntry {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };
}

function output(entry: LogEntry) {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
  const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';

  switch (entry.level) {
    case 'debug':
      console.debug(`${prefix} ${entry.message}${contextStr}`);
      break;
    case 'info':
      console.info(`${prefix} ${entry.message}${contextStr}`);
      break;
    case 'warn':
      console.warn(`${prefix} ${entry.message}${contextStr}`);
      break;
    case 'error':
      console.error(`${prefix} ${entry.message}${contextStr}`);
      break;
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) =>
    output(createLogEntry('debug', message, context)),
  info: (message: string, context?: Record<string, unknown>) =>
    output(createLogEntry('info', message, context)),
  warn: (message: string, context?: Record<string, unknown>) =>
    output(createLogEntry('warn', message, context)),
  error: (message: string, context?: Record<string, unknown>) =>
    output(createLogEntry('error', message, context)),
};
