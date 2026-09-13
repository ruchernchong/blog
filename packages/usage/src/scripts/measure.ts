import { formatParserStatsTable, parseAllAgents } from "../parsers/index.ts";

/**
 * Time every detected agent parser against this machine's logs.
 * Prints a table, then a JSON blob (stats only — not the events).
 */
async function main() {
  const { agents, events, stats } = await parseAllAgents();
  console.log(formatParserStatsTable(stats));
  console.log();
  console.log(
    JSON.stringify(
      {
        agents,
        eventCount: events.length,
        stats,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
