import { createContext, heading, printResult, runGraphQL, tryThis } from './lib/workshop-schema.js'

const query = `
  query Feed {
    posts {
      title
      author {
        id
        name
      }
    }
  }
`

heading('BROKEN: naive resolvers do 1 posts fetch + N author fetches')

const naiveContext = createContext({ mode: 'naive' })
const naive = await runGraphQL(query, undefined, naiveContext)
printResult(naive.result)
printResult({
  backendCalls: naive.context.stats,
  problem: 'Every Post.author resolver called userById separately.',
})

heading('FIXED: per-request DataLoader batches author fetches')

const loaderContext = createContext({ mode: 'loader' })
const loaded = await runGraphQL(query, undefined, loaderContext)
printResult(loaded.result)
printResult({
  backendCalls: loaded.context.stats,
  fix: 'Every Post.author resolver calls loader.load(authorId); DataLoader coalesces them.',
})

tryThis([
  'Duplicate one post authorId in examples/lib/workshop-schema.js and rerun to see DataLoader dedupe.',
  'Search for createContext({ mode: "naive" }) and compare backendCalls against mode: "loader".',
  'Find attachPostFields() and trace how parent post.authorId becomes the child User.',
])
