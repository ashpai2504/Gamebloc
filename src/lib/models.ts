import mongoose, { Schema, Document, Model } from "mongoose";

// ---------- User Model ----------
export interface IFavoriteTeam {
  teamId: string;
  name: string;
  shortName: string;
  logo: string;
}

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  avatar?: string;
  bio?: string;
  provider: "credentials" | "google";
  favoriteTeams: IFavoriteTeam[];
  hiddenActivityTeams: string[]; // team names to hide from activity display
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false, // Don't return password by default
    },
    avatar: {
      type: String,
      default: "",
    },
    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },
    bio: {
      type: String,
      maxlength: 160,
      default: "",
    },
    favoriteTeams: {
      type: [
        {
          teamId: String,
          name: String,
          shortName: String,
          logo: String,
        },
      ],
      default: [],
      validate: {
        validator: (v: any[]) => v.length <= 3,
        message: "You can select up to 3 favorite teams",
      },
    },
    hiddenActivityTeams: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// ---------- Message Model ----------
export interface IMessage extends Document {
  gameId: string;
  userId: mongoose.Types.ObjectId;
  username: string;
  userAvatar?: string;
  content: string;
  type: "text" | "reaction";
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    gameId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    userAvatar: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ["text", "reaction"],
      default: "text",
    },
  },
  { timestamps: true }
);

// Compound index for efficient querying
MessageSchema.index({ gameId: 1, createdAt: -1 });

// ---------- Cached Game Model (for storing fetched game data) ----------
export interface ICachedGame extends Document {
  externalId: string;
  sport: string;
  leagueId: string;
  data: Record<string, unknown>;
  lastFetched: Date;
}

const CachedGameSchema = new Schema<ICachedGame>({
  externalId: {
    type: String,
    required: true,
    unique: true,
  },
  sport: {
    type: String,
    required: true,
  },
  leagueId: {
    type: String,
    required: true,
  },
  data: {
    type: Schema.Types.Mixed,
    required: true,
  },
  lastFetched: {
    type: Date,
    default: Date.now,
  },
});

CachedGameSchema.index({ sport: 1, leagueId: 1 });
CachedGameSchema.index({ lastFetched: 1 }, { expireAfterSeconds: 300 }); // TTL: 5 minutes

// ---------- OTP Model ----------
export interface IOtp extends Document {
  userId: mongoose.Types.ObjectId;
  code: string;
  purpose: "password_change";
  expiresAt: Date;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ["password_change"],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL — auto-delete when expired
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ---------- DM Conversation Model ----------
export interface IDMConversation extends Document {
  key: string; // sorted userId1_userId2 for uniqueness
  participants: mongoose.Types.ObjectId[];
  lastMessage?: string;
  lastMessageAt: Date;
  lastSenderId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DMConversationSchema = new Schema<IDMConversation>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    lastSenderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

DMConversationSchema.index({ participants: 1 });
DMConversationSchema.index({ lastMessageAt: -1 });

// ---------- DM Message Model ----------
export interface IDMMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderUsername: string;
  senderAvatar?: string;
  content: string;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const DMMessageSchema = new Schema<IDMMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "DMConversation",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderUsername: {
      type: String,
      required: true,
    },
    senderAvatar: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    readBy: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
  },
  { timestamps: true }
);

DMMessageSchema.index({ conversationId: 1, createdAt: -1 });

// ---------- Export Models ----------
export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export const MessageModel: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export const CachedGameModel: Model<ICachedGame> =
  mongoose.models.CachedGame ||
  mongoose.model<ICachedGame>("CachedGame", CachedGameSchema);

export const OtpModel: Model<IOtp> =
  mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);

export const DMConversationModel: Model<IDMConversation> =
  mongoose.models.DMConversation ||
  mongoose.model<IDMConversation>("DMConversation", DMConversationSchema);

export const DMMessageModel: Model<IDMMessage> =
  mongoose.models.DMMessage ||
  mongoose.model<IDMMessage>("DMMessage", DMMessageSchema);
