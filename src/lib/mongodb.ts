import mongoose from 'mongoose';

const rawMongoUri = process.env.MONGODB_URI?.trim() || '';
const hasMongoUriAssignmentPrefix =
  /^MONGODB_URI\s*=\s*/i.test(rawMongoUri);
const normalizedMongoUri = hasMongoUriAssignmentPrefix
  ? rawMongoUri.replace(/^MONGODB_URI\s*=\s*/i, '').trim()
  : rawMongoUri;
const MONGODB_URI = normalizedMongoUri.replace(
  /^(["'])(.*)\1$/,
  '$2'
);

export function getMongoConfigurationDiagnostics() {
  const dbName = process.env.MONGODB_DB?.trim();
  const embeddedSchemeOffset = rawMongoUri.search(
    /mongodb(?:\+srv)?:\/\//i
  );

  return {
    uriPresent: MONGODB_URI.length > 0,
    uriSchemeValid: /^mongodb(?:\+srv)?:\/\//i.test(MONGODB_URI),
    uriLength: MONGODB_URI.length,
    rawUriLength: rawMongoUri.length,
    uriWrappedInQuotes: /^(['"]).*\1$/.test(rawMongoUri),
    hasMongoUriAssignmentPrefix,
    embeddedSchemeOffset,
    dbNameVariablePresent: Boolean(dbName),
    effectiveDbName: dbName || 'fco_billing',
  };
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache =
  global.mongooseCache ||
  (global.mongooseCache = {
    conn: null,
    promise: null,
  });

export default async function connectDB() {
  if (!MONGODB_URI) {
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const dbName =
      process.env.MONGODB_DB?.trim() || 'fco_billing';

    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName,
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    if (
      error instanceof Error &&
      error.name === 'MongoParseError'
    ) {
      console.error(
        'MongoDB rejected connection configuration:',
        getMongoConfigurationDiagnostics()
      );
    }
    throw error;
  }

  return cached.conn;
}
