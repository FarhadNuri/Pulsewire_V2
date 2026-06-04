import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBookmark extends Document {
  userId: mongoose.Types.ObjectId;
  article: {
    title: string;
    description: string;
    url: string;
    image: string;
    source: string;
    publishedAt: string;
    category: string;
  };
  notes?: string;
  tags: string[];
  createdAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    article: {
      title: { type: String, required: true },
      description: { type: String },
      url: { type: String, required: true },
      image: { type: String },
      source: { type: String },
      publishedAt: { type: String },
      category: { type: String },
    },
    notes: { type: String },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

BookmarkSchema.index({ userId: 1, createdAt: -1 });
BookmarkSchema.index({ userId: 1, 'article.category': 1 });

const Bookmark: Model<IBookmark> = mongoose.models.Bookmark || mongoose.model<IBookmark>('Bookmark', BookmarkSchema);

export default Bookmark;
