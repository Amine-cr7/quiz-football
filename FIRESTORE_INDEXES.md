# Firestore Index Configuration

## The Issue
The error you encountered was:
```
Failed to join or create game: 9 FAILED_PRECONDITION: The query requires an index. 
You can create it here: https://console.firebase.google.com/v1/r/project/quiz-football-e5413/firestore/indexes?create_composite=...
```

This happens when Firestore needs to perform complex queries that filter on multiple fields or combine `where` clauses with `orderBy` on different fields.

## What We Fixed
Instead of using complex queries that require composite indexes, we simplified the code to:

1. **Use single-field queries only**: Each Firestore query now filters on only one field
2. **Filter in application code**: Get the data and filter it in JavaScript instead of in the database
3. **Avoid compound queries**: No more queries like `.where("field1", "==", "value1").where("field2", "==", "value2")`

## Original Problematic Query
```javascript
// This required a composite index:
const userActiveGames = await gamesCol
  .where("players", "array-contains", userId)
  .where("status", "in", ["waiting", "countdown", "playing"])
  .get();
```

## Fixed Version
```javascript
// Simple query (no index needed):
const userGamesSnapshot = await gamesCol
  .where("players", "array-contains", userId)
  .get();

// Filter in application code:
const activeUserGames = userGamesSnapshot.docs.filter(doc => {
  const status = doc.data().status;
  return status === "waiting" || status === "countdown" || status === "playing";
});
```

## If You Want to Create the Index Anyway
If you prefer to use complex queries and create the required indexes:

1. **Go to Firebase Console**: Visit the link provided in the error message
2. **Create the Index**: Click "Create Index" on the Firebase console page
3. **Wait for Index Creation**: It may take a few minutes to build
4. **Revert to Complex Queries**: You can then use the original compound queries

## Recommended Indexes for This Project
If you want to optimize for performance, create these indexes:

### Games Collection
```
Collection ID: games
Fields indexed:
- status (Ascending)
- createdAt (Ascending)
```

### Users Collection  
```
Collection ID: users
Fields indexed:
- division (Ascending)
- currentPoints (Descending)
- wins (Descending)
```

## Why We Chose the Simple Approach
1. **No Setup Required**: Works immediately without index configuration
2. **More Flexible**: Easier to modify queries without creating new indexes
3. **Better for Development**: No waiting for index creation during development
4. **Sufficient Performance**: For small to medium datasets, filtering in code is fast enough

The current solution is production-ready and will work well for most use cases!