import { heading, printResult, runGraphQL, tryThis } from './lib/workshop-schema.js'

heading('BROKEN: REST-style client assembles one screen with many calls')

printResult({
  requestWaterfall: [
    'GET /users/1',
    'GET /users/1/posts',
    'GET /posts/101/comments',
  ],
  overFetchedUserFields: ['id', 'name', 'email', 'role', 'createdAt', 'settings', 'permissions'],
  screenNeedsOnly: ['name', 'role', 'posts.title'],
})

heading('FIXED: one GraphQL operation asks for the screen shape')

const shape = await runGraphQL(`
  query GetUser($id: ID!) {
    user(id: $id) {
      name
      role
      posts(limit: 1) {
        title
      }
    }
  }
`, { id: '1' })

printResult(shape.result)

heading('FIXED: aliases, fragments, interface and union selection')

const polymorphic = await runGraphQL(`
  query Search {
    results: search(term: "Ada") {
      __typename
      ... on Node {
        id
      }
      ... on User {
        name
      }
      ... on Post {
        title
      }
    }
  }
`)

printResult(polymorphic.result)

heading('FIXED: mutation uses variables and still returns a selected shape')

const mutation = await runGraphQL(`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      title
      author {
        name
      }
    }
  }
`, {
  input: {
    title: 'Workshop notes',
    body: 'A mutation returns only the fields the client asks for.',
    authorId: '1',
  },
})

printResult(mutation.result)

heading('BROKEN: unknown fields fail before any resolver runs')

const invalid = await runGraphQL(`
  query InvalidField {
    user(id: "1") {
      name
      riskScore
    }
  }
`)

printResult(invalid.result)

tryThis([
  'In examples/01-query-shape.js, add email to the GetUser selection set and rerun.',
  'Remove role from the query and confirm it disappears from data.',
  'Change search(term: "Ada") to search(term: "Flow") and notice the union returns a Post.',
  'Add body to the createPost mutation response and rerun.',
])
