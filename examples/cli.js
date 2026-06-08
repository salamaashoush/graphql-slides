const demos = {
  shape: {
    file: './01-query-shape.js',
    title: 'Query shape, validation, fragments, interfaces, unions',
    try: [
      'Add email to the GetUser selection set.',
      'Change search(term: "Ada") to search(term: "Flow").',
      'Add an unknown field and confirm validation fails before execution.',
    ],
  },
  errors: {
    file: './02-errors-and-nullability.js',
    title: 'Partial data, nullability bubbling, errors-as-data',
    try: [
      'Compare nullable bio failure with non-null reputation failure.',
      'Change createFolder(name: "inbox") to a new name.',
      'Decide which fields should be nullable in a real schema.',
    ],
  },
  dataloader: {
    file: './03-resolvers-dataloader.js',
    title: 'Resolvers, N+1, per-request DataLoader',
    try: [
      'Compare backendCalls in naive mode vs loader mode.',
      'Trace parent post.authorId into the Post.author resolver.',
      'Duplicate an authorId in the fixture data and observe batching/dedupe.',
    ],
  },
  schema: {
    file: './04-schema-design.js',
    title: 'Cursor pagination, deprecation, introspection',
    try: [
      'Change first: 2 to first: 3.',
      'Remove includeDeprecated: true from introspection.',
      'Map FileConnection to the Relay connection shape.',
    ],
  },
  production: {
    file: './05-production-guards.js',
    title: 'Depth, aliases, cost analysis, 429-style guards',
    try: [
      'Lower the operation budget and rerun.',
      'Remove aliases from the wide query.',
      'Add a FIELD_COST for another field.',
    ],
  },
  client: {
    file: './06-client-cache.js',
    title: 'Normalized cache, fetch policy, optimistic UI, unreleased fields',
    try: [
      'Remove __typename and see why identity matters.',
      'Change the optimistic likes value.',
      'Keep @include(if: false) on an unknown field and confirm validation still fails.',
    ],
  },
}

function printUsage() {
  console.log(`
GraphQL presentation examples

Usage:
  npm run examples -- list
  npm run examples -- all
  npm run examples -- <demo>
  npm run examples -- inspect <demo>

Demos:
${Object.entries(demos).map(([name, demo]) => `  ${name.padEnd(11)} ${demo.title}`).join('\n')}
`)
}

async function runDemo(name) {
  const demo = demos[name]
  if (!demo) {
    console.error(`Unknown demo: ${name}`)
    printUsage()
    process.exitCode = 1
    return
  }

  console.log(`\n\n######## ${name}: ${demo.title} ########`)
  await import(demo.file)
}

const command = process.argv[2] ?? 'all'
const target = process.argv[3]

if (command === 'help' || command === '--help' || command === '-h') {
  printUsage()
} else if (command === 'list') {
  printUsage()
} else if (command === 'inspect') {
  const demo = demos[target]
  if (!demo) {
    console.error(`Unknown demo: ${target ?? '(missing)'}`)
    printUsage()
    process.exitCode = 1
  } else {
    console.log(`\n${target}: ${demo.title}`)
    console.log(`File: examples/${demo.file.replace('./', '')}`)
    console.log('Try:')
    for (const item of demo.try) {
      console.log(`  - ${item}`)
    }
    console.log(`\nRun: npm run examples -- ${target}`)
  }
} else if (command === 'all') {
  for (const name of Object.keys(demos)) {
    await runDemo(name)
  }
} else {
  await runDemo(command)
}
