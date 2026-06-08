import { heading, printResult, runGraphQL, tryThis } from './lib/workshop-schema.js'

heading('FIXED: nullable field error lets partial data survive')

const nullableField = await runGraphQL(`
  query NullableFieldError {
    user(id: "2") {
      id
      name
      bio
    }
  }
`)

printResult(nullableField.result)

heading('BROKEN: over-non-null field returns null and nulls the parent')

const nonNullField = await runGraphQL(`
  query NonNullBubble {
    user(id: "2") {
      id
      name
      reputation
    }
  }
`)

printResult(nonNullField.result)

heading('BROKEN: expected business failure as a thrown GraphQL error')

printResult({
  mutation: 'createFolder(name: "inbox")',
  problem: 'If this is thrown into top-level errors[], the UI loses typed handling.',
  clientFallback: 'String-match an error message like "folder exists".',
})

heading('FIXED: expected mutation failure modeled as typed data')

const expectedFailure = await runGraphQL(`
  mutation CreateFolder {
    createFolder(name: "inbox") {
      value {
        id
        name
      }
      errors {
        __typename
        ... on MutationError {
          code
          message
        }
      }
    }
  }
`)

printResult(expectedFailure.result)

tryThis([
  'Change user(id: "2") to user(id: "1") in the bio query and rerun.',
  'Change createFolder(name: "inbox") to createFolder(name: "notes") and compare value/errors.',
  'Open examples/lib/workshop-schema.js and find reputation: Int!; ask what contract you would publish instead.',
])
