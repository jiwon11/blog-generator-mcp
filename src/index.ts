#!/usr/bin/env node
/**
 * Blog Generator MCP Server v2
 *
 * Gemini AI를 사용하여 블로그 초안을 생성하고,
 * Claude가 검수하여 품질 높은 기술 블로그 글을 자동 생성하는 MCP 서버입니다.
 *
 * Features:
 * - 다중 플랫폼 지원 (stdio, HTTP)
 * - 다중 사용자 지원 (API 키 파라미터 전달)
 * - 인터랙티브 워크플로우 (단계별 도구)
 * - 백그라운드 실행 + 알림
 */

import { Command } from "commander";
import { createServer } from "./server.js";
import { initDatabase, closeDatabase } from "./services/database.js";
import { runStdioTransport } from "./transports/stdio.js";
import { runHttpTransport } from "./transports/http.js";

const program = new Command();

program
  .name("blog-generator-mcp")
  .description("MCP server for automatic blog post generation using Gemini and Claude")
  .version("2.0.0")
  .option("--stdio", "Run in stdio mode (default)")
  .option("--http", "Run in HTTP server mode")
  .option("--port <number>", "HTTP server port", "3000")
  .option("--db <path>", "SQLite database path", "./data/tasks.db")
  .parse(process.argv);

const options = program.opts();

async function main(): Promise<void> {
  try {
    // Initialize database
    await initDatabase(options.db);
    console.error(`Database initialized: ${options.db}`);

    // Create MCP server
    const server = createServer();

    // Handle shutdown
    const shutdown = () => {
      console.error("\nShutting down...");
      closeDatabase();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    // Run appropriate transport
    if (options.http) {
      const port = parseInt(options.port, 10);
      await runHttpTransport(server, port);
    } else {
      // Default to stdio
      await runStdioTransport(server);
    }
  } catch (error) {
    console.error("Server error:", error);
    closeDatabase();
    process.exit(1);
  }
}

main();
