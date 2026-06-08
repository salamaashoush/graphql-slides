import DataLoader from 'dataloader'
import { buildSchema, graphql } from 'graphql'

export const schema = buildSchema(`
  scalar DateTime
  scalar EmailAddress
  scalar NonNegativeInt

  enum Role {
    ADMIN
    EDITOR
    VIEWER
  }

  interface Node {
    id: ID!
  }

  type User implements Node {
    id: ID!
    name: String!
    email: EmailAddress
    role: Role!
    posts(limit: Int = 10): [Post!]!
    bio: String
    reputation: Int!
  }

  type Post implements Node {
    id: ID!
    title: String!
    body: String!
    author: User!
    likes: Int!
    updatedAt: DateTime!
    modifiedAt: DateTime! @deprecated(reason: "use updatedAt instead [2026-09-01]")
  }

  union SearchResult = User | Post

  type File implements Node {
    id: ID!
    name: String!
  }

  type FileEdge {
    cursor: String!
    node: File!
  }

  type PageInfo {
    endCursor: String
    hasNextPage: Boolean!
  }

  type FileConnection {
    edges: [FileEdge!]!
    pageInfo: PageInfo!
    totalCount: Int
  }

  input CreatePostInput {
    title: String!
    body: String!
    authorId: ID!
  }

  interface MutationError {
    code: String!
    message: String!
  }

  type NameInUse implements MutationError {
    code: String!
    message: String!
  }

  type NameTooLong implements MutationError {
    code: String!
    message: String!
  }

  union CreateFolderError = NameInUse | NameTooLong

  type CreateFolderResponse {
    value: File
    errors: [CreateFolderError!]!
  }

  type Mutation {
    createPost(input: CreatePostInput!): Post!
    createFolder(name: String!): CreateFolderResponse!
    likePost(id: ID!): Post!
  }

  type Query {
    user(id: ID!): User
    users: [User!]!
    post(id: ID!): Post
    posts: [Post!]!
    files(first: NonNegativeInt = 2, after: String): FileConnection!
    search(term: String!): [SearchResult!]!
    expensiveReport: String!
  }
`)

const users = [
  { id: '1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'EDITOR', reputation: 98 },
  { id: '2', name: 'Grace Hopper', email: null, role: 'ADMIN', reputation: null },
  { id: '3', name: 'Katherine Johnson', email: 'kj@example.com', role: 'VIEWER', reputation: 88 },
]

const posts = [
  {
    id: '101',
    title: 'On the Analytical Engine',
    body: 'A note about computed programs.',
    authorId: '1',
    likes: 7,
    updatedAt: '2026-01-10T10:00:00Z',
  },
  {
    id: '102',
    title: 'Compilers and Flow-Matic',
    body: 'A practical compiler story.',
    authorId: '2',
    likes: 11,
    updatedAt: '2026-02-14T12:00:00Z',
  },
  {
    id: '103',
    title: 'Orbital Mechanics',
    body: 'Getting the numbers right.',
    authorId: '3',
    likes: 5,
    updatedAt: '2026-03-20T09:30:00Z',
  },
]

const files = [
  { id: 'f1', name: 'schema.graphql' },
  { id: 'f2', name: 'queries.ts' },
  { id: 'f3', name: 'resolvers.ts' },
  { id: 'f4', name: 'loaders.ts' },
]

const folders = new Set(['inbox'])

function clonePost(post) {
  return post && { ...post, __typename: 'Post' }
}

function cloneUser(user) {
  return user && { ...user, __typename: 'User' }
}

function decodeCursor(cursor) {
  if (!cursor) return -1
  const raw = Buffer.from(cursor, 'base64url').toString('utf8')
  return Number(raw.replace('file:', ''))
}

function encodeCursor(index) {
  return Buffer.from(`file:${index}`).toString('base64url')
}

function makeBackend(stats) {
  return {
    userById(id) {
      stats.userFetches += 1
      return cloneUser(users.find((user) => user.id === id))
    },
    usersByIds(ids) {
      stats.userBatchFetches += 1
      const byId = new Map(users.map((user) => [user.id, cloneUser(user)]))
      return ids.map((id) => byId.get(id) ?? null)
    },
    posts() {
      stats.postFetches += 1
      return posts.map(clonePost)
    },
  }
}

function attachUserFields(user) {
  if (!user) return null
  return {
    ...user,
    posts: ({ limit = 10 }, ctx) => ctx.backend.posts()
      .filter((post) => post.authorId === user.id)
      .slice(0, limit)
      .map(attachPostFields),
    bio: () => {
      if (user.id === '2') throw new Error('Profile service timed out')
      return `${user.name} writes about computing.`
    },
  }
}

function attachPostFields(post) {
  if (!post) return null
  return {
    ...post,
    modifiedAt: post.updatedAt,
    author: (_args, ctx) => {
      if (ctx.mode === 'loader') {
        return ctx.loaders.user.load(post.authorId).then(attachUserFields)
      }
      return attachUserFields(ctx.backend.userById(post.authorId))
    },
  }
}

export function createContext({ mode = 'loader' } = {}) {
  const stats = {
    userFetches: 0,
    userBatchFetches: 0,
    postFetches: 0,
  }
  const backend = makeBackend(stats)

  return {
    mode,
    stats,
    backend,
    loaders: {
      user: new DataLoader((ids) => Promise.resolve(backend.usersByIds(ids))),
    },
  }
}

export const rootValue = {
  user: ({ id }, ctx) => attachUserFields(ctx.backend.userById(id)),
  users: (_args, ctx) => users.map(cloneUser).map((user) => attachUserFields(user, ctx)),
  post: ({ id }, ctx) => attachPostFields(ctx.backend.posts().find((post) => post.id === id)),
  posts: (_args, ctx) => ctx.backend.posts().map(attachPostFields),
  files: ({ first = 2, after }) => {
    const start = decodeCursor(after) + 1
    const page = files.slice(start, start + first)
    const endIndex = start + page.length - 1

    return {
      edges: page.map((file, offset) => ({
        cursor: encodeCursor(start + offset),
        node: { ...file, __typename: 'File' },
      })),
      pageInfo: {
        endCursor: page.length ? encodeCursor(endIndex) : null,
        hasNextPage: endIndex < files.length - 1,
      },
      totalCount: files.length,
    }
  },
  search: ({ term }) => {
    const needle = term.toLowerCase()
    return [
      ...users.filter((user) => user.name.toLowerCase().includes(needle)).map(cloneUser),
      ...posts.filter((post) => post.title.toLowerCase().includes(needle)).map(clonePost),
    ]
  },
  expensiveReport: () => 'quarterly-report-ready',
  createPost: ({ input }, ctx) => {
    const post = {
      id: String(200 + posts.length),
      ...input,
      likes: 0,
      updatedAt: new Date('2026-06-08T10:00:00Z').toISOString(),
    }
    return attachPostFields(clonePost(post), ctx)
  },
  createFolder: ({ name }) => {
    if (name.length > 16) {
      return {
        value: null,
        errors: [{
          __typename: 'NameTooLong',
          code: 'NAME_TOO_LONG',
          message: 'Folder names must be 16 characters or fewer.',
        }],
      }
    }
    if (folders.has(name.toLowerCase())) {
      return {
        value: null,
        errors: [{
          __typename: 'NameInUse',
          code: 'NAME_IN_USE',
          message: 'A folder with that name already exists.',
        }],
      }
    }
    folders.add(name.toLowerCase())
    return {
      value: { __typename: 'File', id: `folder:${name}`, name },
      errors: [],
    }
  },
  likePost: ({ id }, ctx) => {
    const post = posts.find((item) => item.id === id)
    if (!post) throw new Error('Post not found')
    post.likes += 1
    return attachPostFields(clonePost(post), ctx)
  },
}

export async function runGraphQL(source, variables, context = createContext()) {
  const result = await graphql({
    schema,
    source,
    rootValue,
    contextValue: context,
    variableValues: variables,
  })

  return { result, context }
}

export function printResult(value) {
  console.log(JSON.stringify(value, null, 2))
}

export function heading(title) {
  console.log(`\n=== ${title} ===`)
}

export function tryThis(items) {
  console.log('\nTry this next:')
  for (const item of items) {
    console.log(`  - ${item}`)
  }
}
