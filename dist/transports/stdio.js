import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
export async function runStdioTransport(server) {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Blog Generator MCP Server running via stdio");
}
//# sourceMappingURL=stdio.js.map