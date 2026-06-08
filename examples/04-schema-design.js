import { heading, printResult, runGraphQL, tryThis } from './lib/workshop-schema.js'

heading('BROKEN: offset pagination can drift while data changes')

printResult({
  firstRequest: 'files(limit: 2, offset: 0) -> [schema.graphql, queries.ts]',
  concurrentInsert: 'new file inserted at the top',
  secondRequest: 'files(limit: 2, offset: 2) -> [queries.ts, resolvers.ts]',
  problem: 'queries.ts appears twice, and one item may be skipped.',
})

heading('FIXED: cursor pagination asks for items after the last seen cursor')

const page1 = await runGraphQL(`
  query Files {
    files(first: 2) {
      edges {
        cursor
        node { id name }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`)

printResult(page1.result)

const after = page1.result.data.files.pageInfo.endCursor

heading('FIXED: next page using endCursor')

const page2 = await runGraphQL(`
  query Files($after: String) {
    files(first: 2, after: $after) {
      edges {
        node { id name }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`, { after })

printResult(page2.result)

heading('FIXED: deprecation is visible through introspection')

const deprecated = await runGraphQL(`
  query DeprecatedFields {
    __type(name: "Post") {
      fields(includeDeprecated: true) {
        name
        isDeprecated
        deprecationReason
      }
    }
  }
`)

printResult(deprecated.result)

tryThis([
  'Change files(first: 2) to files(first: 3) and inspect pageInfo.hasNextPage.',
  'Remove includeDeprecated: true and notice modifiedAt disappears from introspection.',
  'Find type FileConnection in examples/lib/workshop-schema.js and map it to the slide pattern.',
])
