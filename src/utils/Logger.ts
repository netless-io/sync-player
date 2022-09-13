/* eslint-disable @typescript-eslint/ban-types */

export class Logger {
  public logStatus = true;
  public history: (string | Object)[][] = [];
  public historyLimit = 500;
  public namespace: string;

  public constructor({ namespace }: { namespace: string }) {
    this.namespace = namespace;
  }

  public info: LogFn = (...args: Parameters<LogFnImpl>): void =>
    this.printLog("info", ...args);
  public warn: LogFn = (...args: Parameters<LogFnImpl>): void =>
    this.printLog("warn", ...args);
  public error: LogFn = (...args: Parameters<LogFnImpl>): void =>
    this.printLog("error", ...args);

  public pushLog(
    level: LoggerLevel,
    prefix: string,
    time: string,
    message: string,
    data: Object
  ): void {
    this.history.push([this.namespace, level, prefix, time, message, data]);

    if (Number.isNaN(this.historyLimit)) {
      return;
    }

    if (this.history.length > this.historyLimit) {
      this.history.shift();
    }
  }

  private printLog(
    level: LoggerLevel,
    message: string,
    prefixOrData?: Object | string,
    data?: Object
  ): void {
    let prefix = "";

    if (typeof prefixOrData === "string") {
      prefix = prefixOrData;
    } else {
      data = prefixOrData;
    }

    const time = new Date().toISOString();

    const strData = JSON.stringify(data || {}, null, 2);

    this.pushLog(level, prefix, time, message, JSON.parse(strData));

    if (this.logStatus) {
      const prefixStr = prefix ? `[${prefix}] ` : "";
      const log = `[sync-player] [${this.namespace}] ${prefixStr}[${level}] [${time}]: ${message}`;

      if (data) {
        console[level](log, "-", strData);
      } else {
        console[level](log);
      }
    }
  }
}

type LoggerLevel = "info" | "warn" | "error";

interface LogFn {
  (message: string, data?: Object): void;
  (message: string, prefix?: string, data?: Object): void;
}

type LogFnImpl = (
  message: string,
  prefixOrData?: Object | string,
  data?: Object
) => void;
