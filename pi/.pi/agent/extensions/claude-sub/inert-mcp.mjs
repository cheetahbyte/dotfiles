// Tool inventory only: Claude Code sees pi's tools here, pi executes them.
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";

const tools = JSON.parse(readFileSync(process.argv[2], "utf8"));
for await (const line of createInterface({ input: process.stdin })) {
	const row = JSON.parse(line);
	let result = {};
	if (row.method === "initialize") {
		result = { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "pi-inert", version: "1" } };
	} else if (row.method === "tools/list") {
		result = { tools };
	} else if (row.method === "tools/call") {
		result = { isError: true, content: [{ type: "text", text: "Denied: only pi executes tools." }] };
	}
	if ("id" in row) process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: row.id, result }) + "\n");
}
