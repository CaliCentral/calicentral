import {defineCliConfig} from "sanity/cli"

import {dataset, projectId} from "./sanity/env"

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  schemaExtraction: {
    enabled: true,
    path: "./schema.json",
    enforceRequiredFields: true,
  },
  typegen: {
    enabled: true,
    path: [
      "./app/**/*.{ts,tsx}",
      "./components/**/*.{ts,tsx}",
      "./lib/**/*.{ts,tsx}",
      "./sanity/**/*.{ts,tsx}",
    ],
    schema: "./schema.json",
    generates: "./sanity.types.ts",
    overloadClientMethods: true,
  },
})
