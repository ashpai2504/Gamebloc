/**
 * Remove user:password@ from a MongoDB URI by finding the @ that immediately
 * precedes *.mongodb.net. This supports passwords that contain @ (unencoded in
 * the legacy URI string) when combined with MONGODB_USER / MONGODB_PASSWORD.
 */
export function stripCredentialsFromMongoUri(uri: string): string {
  const trimmed = uri.trim();
  const dotNet = trimmed.match(/\.mongodb\.net(\/|\?|$)/i);
  if (!dotNet || dotNet.index === undefined) {
    return trimmed.replace(/^(mongodb(?:\+srv)?:\/\/)[^@]+@/i, "$1");
  }
  const beforeDotNet = trimmed.slice(0, dotNet.index);
  const authDelimiter = beforeDotNet.lastIndexOf("@");
  if (authDelimiter === -1) return trimmed;
  const proto = trimmed.indexOf("//");
  if (proto === -1 || authDelimiter <= proto + 1) return trimmed;
  const hostAndRest = trimmed.slice(authDelimiter + 1);
  return `${trimmed.slice(0, proto + 2)}${hostAndRest}`;
}

/** Build connect options: use separate user/pass so passwords need no URL-encoding. */
export const ERR_DB_URI_PLACEHOLDER = "ENV_DB_URI_PLACEHOLDER";
export const ERR_DB_PASSWORD_MISSING = "ENV_DB_PASSWORD_MISSING";

export function resolveMongoConnection(): {
  uri: string;
  user?: string;
  pass?: string;
} {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("Please define MONGODB_URI in .env.local");
  }

  // Atlas UI shows <db_password> as a hint — it must be replaced with the real password
  if (/<db_password>|<password>/i.test(uri)) {
    throw new Error(ERR_DB_URI_PLACEHOLDER);
  }

  const user = process.env.MONGODB_USER?.trim();
  const passEnv = process.env.MONGODB_PASSWORD;
  if (user && user.length > 0 && (passEnv === undefined || passEnv === "")) {
    throw new Error(ERR_DB_PASSWORD_MISSING);
  }

  const hasSplitAuth =
    user !== undefined &&
    user.length > 0 &&
    passEnv !== undefined &&
    passEnv.length > 0;

  if (hasSplitAuth) {
    return {
      uri: stripCredentialsFromMongoUri(uri),
      user,
      pass: passEnv,
    };
  }

  return { uri };
}
