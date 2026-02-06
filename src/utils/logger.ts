import chalk from "chalk";

export interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
}

export function createLogger(opts?: { verbose?: boolean }): Logger {
  const verbose = Boolean(opts?.verbose);

  return {
    info: (message) => console.log(message),
    warn: (message) => console.warn(chalk.yellow(message)),
    error: (message) => console.error(chalk.red(message)),
    debug: (message) => {
      if (verbose) console.log(chalk.gray(message));
    },
  };
}
