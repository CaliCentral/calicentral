import {loadSourceRegistry, sourceApprovalBlockers} from "./lib/source-registry"

async function main() {
  const registry = await loadSourceRegistry(process.cwd())
  console.log(`Source registry valid: ${registry.sources.length} source(s).`)
  for (const source of registry.sources) {
    const blockers = sourceApprovalBlockers(source, source.dataTypes)
    console.log(
      `${source.sourceId}: ${source.approvalStatus} · ${source.dataTypes.join(", ")} · write approval ${blockers.length === 0 ? "READY" : "BLOCKED"}`,
    )
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
