import mongoose from "mongoose";
import { UserModel } from "./models";

/** Session may lack `user.id` on older JWTs; resolve Mongo id from email when needed. */
export async function resolveSessionUserId(session: {
  user?: { id?: string; email?: string | null };
}): Promise<string | null> {
  let userId = session.user?.id as string | undefined;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    return userId;
  }
  const email = session.user?.email?.toLowerCase().trim();
  if (!email) return null;
  const doc = await UserModel.findOne({ email }).select("_id").lean();
  return doc?._id ? String(doc._id) : null;
}
