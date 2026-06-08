# GraphQL Workshop Examples

These examples support the workshop. They are intentionally small, in-memory, and runnable from the terminal. They use the real `graphql` execution engine plus `dataloader`, but avoid a full server or frontend app so the concepts stay visible.

## Run

From a parent folder, or from inside an existing clone:

```sh
if [ -d graphql-slides/.git ]; then cd graphql-slides; elif [ -f package.json ] && grep -q '"graphql-slides"' package.json; then :; else git clone https://github.com/salamaashoush/graphql-slides.git graphql-slides && cd graphql-slides; fi
npm ci
npm run examples -- list
```

Run every demo:

```sh
npm run examples
```

Run one concept at a time:

```sh
npm run examples -- list
npm run examples -- shape
npm run examples -- errors
npm run examples -- dataloader
npm run examples -- schema
npm run examples -- production
npm run examples -- client
npm run examples -- inspect dataloader
```

## Workshop Flow

| Time | Lab | Command |
| --- | --- | --- |
| 5 min | Setup and list demos | `npm run examples -- list` |
| 10 min | Query shape, validation, polymorphism | `npm run examples -- shape` |
| 12 min | Resolvers and N+1 | `npm run examples -- dataloader` |
| 12 min | Nullability and errors-as-data | `npm run examples -- errors` |
| 10 min | Schema design: pagination/deprecation | `npm run examples -- schema` |
| 10 min | Production guards | `npm run examples -- production` |
| 15 min | Client cache, codegen, unreleased fields | `npm run examples -- client` |

Use `npm run examples -- inspect <demo>` before a lab to see the file to edit and suggested changes.

## Concept Map

| Presentation concept | Example |
| --- | --- |
| Query shape, variables, aliases, fragments, interfaces, unions, validation | `npm run examples -- shape` |
| Partial `data` + `errors`, nullability bubbling, errors-as-data | `npm run examples -- errors` |
| Resolver tree, `parent/args/context`, N+1, per-request DataLoader | `npm run examples -- dataloader` |
| Cursor pagination, deprecation, introspection | `npm run examples -- schema` |
| Depth/alias/cost guards, 429-style rejection before execution | `npm run examples -- production` |
| Normalized cache, fetch-policy thinking, optimistic update, unreleased-field trap | `npm run examples -- client` |

## How To Use In A Workshop

1. Run the demo once and read the `BROKEN` / `FIXED` headings.
2. Open the file printed in the concept map.
3. Make one of the suggested `Try this next` edits.
4. Rerun the same command and compare output.
5. Tie the output back to the slide before moving on.

## Files

- `lib/workshop-schema.js` contains the shared SDL schema, in-memory data, resolvers, and a `runGraphQL()` helper.
- Each numbered file prints broken and fixed behavior where that contrast matters.

The output is meant to be readable in a terminal or presenter notes. It is not a test suite and it is not intended as production architecture.
