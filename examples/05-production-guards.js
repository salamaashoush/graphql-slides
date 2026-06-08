import { GraphQLError, parse, visit } from 'graphql'
import { heading, printResult, runGraphQL, schema, tryThis } from './lib/workshop-schema.js'

const FIELD_COST = {
  expensiveReport: 100,
  search: 10,
  posts: 5,
  users: 5,
}

function analyzeOperation(source) {
  const ast = parse(source)
  let depth = 0
  let maxDepth = 0
  let aliases = 0
  let cost = 0

  visit(ast, {
    Field: {
      enter(node) {
        depth += 1
        maxDepth = Math.max(maxDepth, depth)
        if (node.alias) aliases += 1
        cost += FIELD_COST[node.name.value] ?? 1
      },
      leave() {
        depth -= 1
      },
    },
  })

  return { maxDepth, aliases, cost }
}

async function guardedGraphQL(source, variables) {
  const analysis = analyzeOperation(source)

  if (analysis.maxDepth > 5) {
    return {
      httpStatus: 400,
      analysis,
      body: { errors: [new GraphQLError('query is too deep').message] },
    }
  }

  if (analysis.aliases > 3 || analysis.cost > 30) {
    return {
      httpStatus: 429,
      analysis,
      body: {
        errors: ['operation exceeded query budget'],
        retryAfter: 30,
      },
    }
  }

  const { result } = await runGraphQL(source, variables)
  return { httpStatus: 200, analysis, body: result }
}

heading('BROKEN: request-count rate limiting treats cheap and expensive operations equally')

printResult({
  cheapOperation: 'query { user(id: "1") { name } }',
  expensiveOperation: 'query { expensiveReport }',
  naivePolicy: 'Both cost 1 request.',
  problem: 'A user can spend the same request budget on a much more expensive operation.',
})

heading('FIXED: a normal operation passes pre-execution guards')

const normal = await guardedGraphQL(`
  query Normal {
    posts {
      title
      author { name }
    }
  }
`)

printResult(normal)

heading('FIXED: a shallow but wide operation is rejected by alias/cost limits')

const wide = await guardedGraphQL(`
  query Wide {
    a: expensiveReport
    b: expensiveReport
    c: expensiveReport
    d: expensiveReport
  }
`)

printResult(wide)

heading('FIXED: introspection still sees the real schema when allowed')

printResult({
  queryType: schema.getQueryType().name,
  mutationType: schema.getMutationType().name,
})

heading('FIXED: subscriptions need the same auth and cost checks')

printResult({
  sse: 'Good default for server -> client events over normal HTTP.',
  websocket: 'Useful for bidirectional protocols, but stateful behind load balancers.',
  guardrail: 'Authorize and price the subscription before opening the long-lived stream.',
})

tryThis([
  'Lower the cost limit in guardedGraphQL() from 30 to 5 and rerun.',
  'Remove aliases b/c/d from the Wide query and compare aliases + cost.',
  'Add a new expensive field name to FIELD_COST and decide what budget it should consume.',
])
