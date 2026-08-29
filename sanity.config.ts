"use client"

import {presentationTool} from "sanity/presentation"
import {defineConfig} from "sanity"
import {structureTool} from "sanity/structure"
import {visionTool} from "@sanity/vision"

import {
  dataset,
  projectId,
  siteOrigin,
  siteUrl,
  studioBasePath,
} from "./sanity/env"
import {presentationResolve} from "./sanity/presentation"
import {schemaTypes} from "./sanity/schemaTypes"
import {structure} from "./sanity/structure"

const singletonType = "siteSettings"
const serverManagedTypes = new Set([
  "contributorProfile",
  "contributorIdentityClaim",
  "operationalLock",
  "submission",
  "auditEvent",
])
const nonCreatableTypes = new Set([singletonType, ...serverManagedTypes])

export default defineConfig({
  name: "default",
  title: "Cali Central Studio",
  basePath: studioBasePath,
  projectId,
  dataset,
  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter(
        (template) => !nonCreatableTypes.has(template.schemaType),
      ),
  },
  document: {
    newDocumentOptions: (previous) =>
      previous.filter(
        (item) => !nonCreatableTypes.has(item.templateId),
      ),
    actions: (previous, context) => {
      if (serverManagedTypes.has(context.schemaType)) {
        return []
      }

      return context.schemaType === singletonType
        ? previous.filter(({action}) =>
            ["publish", "discardChanges", "restore"].includes(action || ""),
          )
        : previous
    },
  },
  plugins: [
    structureTool({structure}),
    presentationTool({
      previewUrl: {
        initial: siteUrl,
        previewMode: {
          enable: "/api/draft-mode/enable",
          disable: "/api/draft-mode/disable",
        },
      },
      resolve: presentationResolve,
      allowOrigins: [siteOrigin],
    }),
    visionTool(),
  ],
})
