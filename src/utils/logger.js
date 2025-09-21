import winston from 'winston';

const { combine, timestamp, label, printf, colorize, errors } = winston.format;

const customFormat = printf(({ level, message, label, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const stackStr = stack ? `\n${stack}` : '';
  
  return `${timestamp} [${label}] ${level}: ${message}${metaStr}${stackStr}`;
});

export const createLogger = (service = 'api-gateway') => {
  return winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: combine(
      errors({ stack: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      label({ label: service }),
      customFormat
    ),
    transports: [
      new winston.transports.Console({
        format: combine(
          colorize(),
          errors({ stack: true }),
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          label({ label: service }),
          customFormat
        )
      })
    ]
  });
};