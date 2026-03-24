import pkg from "../../../package.json";

export const DEFAULT_PORT = pkg.serverConfig.port;

type ResolveServerPortOptions = {
  defaultPort?: number;
  envPort?: string;
  warn?: (message: string) => void;
};

export const parsePort = (value: string): number | null => {
  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > 65535) {
    return null;
  }

  return parsed;
};

export const resolveServerPort = (
  options: ResolveServerPortOptions = {},
): number => {
  const {
    defaultPort = DEFAULT_PORT,
    envPort = process.env.PORT,
    warn = console.warn,
  } = options;

  if (envPort === undefined) {
    return defaultPort;
  }

  const parsedPort = parsePort(envPort);

  if (parsedPort !== null) {
    return parsedPort;
  }

  warn(
    `Ignoring invalid PORT value ${JSON.stringify(envPort)}. Falling back to ${defaultPort}.`,
  );

  return defaultPort;
};
