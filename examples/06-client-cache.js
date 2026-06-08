import { heading, printResult, runGraphQL, tryThis } from './lib/workshop-schema.js'

function entityKey(value) {
  return value?.__typename && value?.id ? `${value.__typename}:${value.id}` : null
}

function normalize(value, store = new Map()) {
  if (Array.isArray(value)) return value.map((item) => normalize(item, store))
  if (!value || typeof value !== 'object') return value

  const normalized = {}
  for (const [key, child] of Object.entries(value)) {
    normalized[key] = normalize(child, store)
  }

  const key = entityKey(normalized)
  if (!key) return normalized

  store.set(key, { ...(store.get(key) ?? {}), ...normalized })
  return { $ref: key }
}

function readEntity(store, ref) {
  return store.get(ref.$ref)
}

const store = new Map()

heading('BROKEN: hand-written result types drift from the schema')

printResult({
  handWrittenType: 'type UserResult = { user: { id: string; fullName: string } }',
  actualOperation: 'query { user(id: "1") { id name } }',
  problem: 'The app compiles against fullName, but GraphQL returns name. Codegen prevents this drift.',
})

heading('FIXED: generated operation types come from document + schema')

printResult({
  typedDocument: 'const GET_USER = graphql(`query { user(id: "1") { id name } }`)',
  inferredData: '{ user: { id: string; name: string } | null }',
  inferredVariables: '{}',
  rule: 'When the schema or operation changes, regenerate and let CI catch invalid operations.',
})

heading('BROKEN: no normalized cache means list and detail copies drift')

printResult({
  listCopy: { __typename: 'Post', id: '101', likes: 7 },
  detailCopy: { __typename: 'Post', id: '101', likes: 7 },
  mutationUpdates: 'detailCopy.likes = 8',
  problem: 'The list still shows 7 unless you refetch or manually synchronize every copy.',
})

heading('FIXED: normalize list and detail results into one entity store')

const feed = await runGraphQL(`
  query Feed {
    posts {
      __typename
      id
      title
      likes
      author { __typename id name }
    }
  }
`)

const detail = await runGraphQL(`
  query Detail {
    post(id: "101") {
      __typename
      id
      title
      likes
      body
    }
  }
`)

const feedRefs = normalize(feed.result.data.posts, store)
const detailRef = normalize(detail.result.data.post, store)

printResult({
  feedFirstPost: readEntity(store, feedRefs[0]),
  detailPost: readEntity(store, detailRef),
})

heading('FIXED: optimistic mutation updates the same normalized entity')

const optimisticRef = { $ref: 'Post:101' }
store.set('Post:101', {
  ...store.get('Post:101'),
  likes: store.get('Post:101').likes + 1,
})

printResult({
  afterOptimisticWrite: readEntity(store, optimisticRef),
})

const mutation = await runGraphQL(`
  mutation LikePost {
    likePost(id: "101") {
      __typename
      id
      likes
    }
  }
`)

normalize(mutation.result.data.likePost, store)

printResult({
  afterServerReconcile: readEntity(store, optimisticRef),
})

heading('FIXED: fetch-policy is an explicit product decision')

printResult({
  cacheFirst: 'stable reference data: render cache if present, skip network',
  cacheAndNetwork: 'render cache immediately, refresh in background',
  networkOnly: 'always hit server, but still write result to cache',
  noCache: 'never store highly mutable or sensitive result',
  reviewRule: 'Do not rely on the client default silently.',
})

heading('BROKEN: directives do not hide unreleased fields from validation')

const unreleased = await runGraphQL(`
  query FlaggedField($enabled: Boolean!) {
    user(id: "1") {
      name
      riskScore @include(if: $enabled)
    }
  }
`, { enabled: false })

printResult(unreleased.result)

heading('FIXED: test the operation contract, not implementation details')

printResult({
  mockRequest: {
    query: 'GET_USER',
    variables: { id: '1' },
  },
  mockResult: {
    data: { user: { __typename: 'User', id: '1', name: 'Ada Lovelace' } },
  },
  assertion: 'Render the hook/component and assert the UI state produced by this operation result.',
})

tryThis([
  'Remove __typename from the Feed query and watch normalization stop producing stable entity keys.',
  'Change optimistic likes + 1 to + 10 and think through rollback/reconcile behavior.',
  'In the unreleased-field query, keep enabled: false; validation still fails because directives run after validation.',
])
