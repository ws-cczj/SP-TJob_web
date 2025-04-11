// 安装 chalk 库：pnpm add chalk
import chalk, {type ChalkInstance} from "chalk";

// 定义日志级别类型和配置
type LogLevel = "info" | "debug" | "warn" | "error";

interface LogConfig {
  source: string;
  level: LogLevel;
  color: ChalkInstance;
}

class Logger {
  // 私有属性，控制是否开发模式
  private isDev: boolean;
  
  constructor() {
    this.isDev = import.meta.env.MODE === "development";
    this.printWelcome();
  }

  // 设置开发模式
  public setIsDev(isDev: boolean): void {
    this.isDev = isDev;
  }

  // 通用日志方法
  private log(config: LogConfig, ...messages: any[]): void {
    if (!this.isDev) return;

    const { source, level, color } = config;
    const prefix = color(`[${level.toUpperCase()}] log-source: ${source} |`);
    console[level](prefix, ...messages);
  }

  /**
   * 
   * @level : info
   * @param source 日志信息来源 例如: xxx.vue getfuncName:88 
   * @param log 需要打印的日志信息
   */
  public info(source: string = "", ...messages: any[]): void {
    this.log(
      { source, level: "info", color: chalk.green },
      ...messages
    );
  }

  /**
   * 
   * @level : debug
   * @param source 日志信息来源 例如: xxx.vue getfuncName:88 
   * @param log 需要打印的日志信息
   */
  public debug(source: string = "", ...messages: any[]): void {
    this.log(
      { source, level: "debug", color: chalk.blue },
      ...messages
    );
  }

  /**
   * 
   * @level : warning
   * @param source 日志信息来源 例如: xxx.vue getfuncName:88 
   * @param log 需要打印的日志信息
   */
  public warning(source: string = "", ...messages: any[]): void {
    this.log(
      { source, level: "warn", color: chalk.yellow },
      ...messages
    );
  }

 /**
  * 
  * @level : error
  * @param source 日志信息来源 例如: xxx.vue getfuncName:88 
  * @param log 需要打印的日志信息
  */
  public error(source: string = "", ...messages: any[]): void {
    this.log(
      { source, level: "error", color: chalk.red },
      ...messages
    );
  }

  // 打印欢迎信息
  private printWelcome(): void {
    const welcomeMessage = chalk.magenta(`
      欢迎使用  _____    _____   ______       _ 
              / ____|  / ____|  |___  /      | |
              | |      | |         / /       | |
              | |      | |        / /    _   | |
              | |____  | |____   / /__  | |__| |
              \\_____|  \\_____|  /_____|  \\____/     日志工具, 紫色更有韵味哦~
    `);
    console.log(welcomeMessage);
  }
}

// 导出单例实例
export const Log = new Logger();