import util from '../util';

import type { LogExecutionOptions } from '../../types/responseTransformers';
import type { Request } from '../../types/types';

/**
 * Resolved options with all defaults applied.
 */
type ResolvedLogExecutionOptions = Required<Omit<LogExecutionOptions, 'condition'>> &
  Pick<LogExecutionOptions, 'condition'>;

/**
 * Utility functions for the @LogExecution decorator.
 */
const loggingUtil = {
  /**
   * Resolves LogExecution options with defaults.
   * @param options - The optional user-provided options.
   * @returns Resolved options with all defaults applied.
   */
  resolveOptions(options?: LogExecutionOptions): ResolvedLogExecutionOptions {
    return {
      logArgs: options?.logArgs ?? false,
      logResult: options?.logResult ?? false,
      logDuration: options?.logDuration ?? true,
      logLevel: options?.logLevel ?? 'info',
      prefix: options?.prefix ?? '[LOG]',
      condition: options?.condition,
    };
  },

  /**
   * Checks if logging should be skipped based on the condition function.
   * @param options - The resolved options.
   * @param req - The request object.
   * @returns True if logging should be skipped.
   */
  shouldSkip(options: ResolvedLogExecutionOptions, req: Request): boolean {
    return !!(options.condition && !options.condition(req));
  },

  /**
   * Filters arguments to exclude Request objects for cleaner logging.
   * @param args - The original arguments array.
   * @returns Filtered arguments without Request objects.
   */
  filterArgsForLogging(args: any[]): any[] {
    return args.filter((arg) => !util.isRequestType(arg));
  },

  /**
   * Logs method arguments if enabled.
   * @param options - The resolved options.
   * @param className - The class name.
   * @param methodName - The method name.
   * @param args - The method arguments.
   */
  logArgs(options: ResolvedLogExecutionOptions, className: string, methodName: string, args: any[]): void {
    if (options.logArgs) {
      const argsToLog = this.filterArgsForLogging(args);
      console[options.logLevel](`${options.prefix} ${className}.${methodName} - Args:`, argsToLog);
    }
  },

  /**
   * Logs method result if enabled.
   * @param options - The resolved options.
   * @param className - The class name.
   * @param methodName - The method name.
   * @param result - The method result.
   */
  logResult(options: ResolvedLogExecutionOptions, className: string, methodName: string, result: any): void {
    if (options.logResult) {
      console[options.logLevel](`${options.prefix} ${className}.${methodName} - Result:`, result);
    }
  },

  /**
   * Logs method duration if enabled.
   * @param options - The resolved options.
   * @param className - The class name.
   * @param methodName - The method name.
   * @param duration - The execution duration in milliseconds.
   */
  logDuration(options: ResolvedLogExecutionOptions, className: string, methodName: string, duration: number): void {
    if (options.logDuration) {
      console[options.logLevel](`${options.prefix} ${className}.${methodName} - Duration: ${duration}ms`);
    }
  },

  /**
   * Logs error with duration.
   * @param options - The resolved options.
   * @param className - The class name.
   * @param methodName - The method name.
   * @param duration - The execution duration in milliseconds.
   * @param error - The error that occurred.
   */
  logError(
    options: ResolvedLogExecutionOptions,
    className: string,
    methodName: string,
    duration: number,
    error: any,
  ): void {
    console[options.logLevel](`${options.prefix} ${className}.${methodName} - Error after ${duration}ms:`, error);
  },
};

export default loggingUtil;
