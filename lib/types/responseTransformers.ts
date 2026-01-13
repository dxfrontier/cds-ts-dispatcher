import type { Request } from './types';

// **************************************************************************************************************************
// @Exclude, @Include, @Mask decorator types
// **************************************************************************************************************************

/**
 * Options for the @Mask decorator.
 */
export type MaskOptions = {
  /**
   * The character used to mask the field value.
   * @default '*'
   */
  char?: string;

  /**
   * Number of characters to keep visible at the end of the value.
   * @default 4
   */
  visibleEnd?: number;

  /**
   * Number of characters to keep visible at the start of the value.
   * @default 0
   */
  visibleStart?: number;
};

// **************************************************************************************************************************
// @LogExecution decorator types
// **************************************************************************************************************************

/**
 * Options for the @LogExecution decorator.
 */
export type LogExecutionOptions = {
  /**
   * Whether to log the method arguments.
   * Be careful with sensitive data!
   * @default false
   */
  logArgs?: boolean;

  /**
   * Whether to log the method return value.
   * @default false
   */
  logResult?: boolean;

  /**
   * Whether to log the execution duration in milliseconds.
   * @default true
   */
  logDuration?: boolean;

  /**
   * The log level to use for logging.
   * @default 'info'
   */
  logLevel?: 'debug' | 'info' | 'warn';

  /**
   * Custom prefix for log messages.
   * @default '[LOG]'
   */
  prefix?: string;

  /**
   * Optional condition function to determine whether to log.
   * If provided and returns false, logging will be skipped.
   */
  condition?: (req: Request) => boolean;
};

// **************************************************************************************************************************
// **************************************************************************************************************************
