import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://football:football@127.0.0.1:5432/football_test?schema=public";
const workspaceRoot = fileURLToPath(new URL("../../..", import.meta.url));
const result = spawnSync(
  "pnpm",
  ["--filter", "@fb/core", "exec", "prisma", "migrate", "deploy"],
  {
    cwd: workspaceRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
    stdio: "inherit",
  },
);

if (result.error) {
  throw result.error;
}
if (result.status !== 0) {
  throw new Error(
    "Could not prepare football_test. Start infra/docker-compose.dev.yml and retry.",
  );
}
