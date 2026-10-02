#!/usr/bin/env node
/**
 * cms.mjs - the content editor for this site: on, off, regenerated, checked.
 *
 *   npm run cms -- status
 *   npm run cms -- enable sveltia --repo owner/name [--auth-url URL] [--branch main]
 *   npm run cms -- disable sveltia
 *   npm run cms -- generate
 *   npm run cms -- check
 *
 * The tool itself lives in the shared core (core/cms/). What is specific to this
 * site - collections, field labels, option lists - is in cms/fields.json.
 */
import "@studio/core/cms/cli.mjs";
