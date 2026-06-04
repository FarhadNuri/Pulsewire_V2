import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReadingHistory extends Document {
  userId: mongoose.Types.ObjectId;
  article: {
    title: string;
    url: string;
    category: string;
    source: string;
  };
  readAt: Date;
  readDuration?: number; 
}

const ReadingHistorySchema = new Schema<IReadingHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    article: {
      title: { type: String, required: true },
      url: { type: String, required: true },
      category: { type: String },
      source: { type: String },
    },
    readAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    readDuration: { type: Number },
  },
  {
    timestamps: false,
  }
);


ReadingHistorySchema.index({ userId: 1, readAt: -1 });
ReadingHistorySchema.index({ userId: 1, 'article.category': 1 });

const ReadingHistory: Model<IReadingHistory> = 
  mongoose.models.ReadingHistory || mongoose.model<IReadingHistory>('ReadingHistory', ReadingHistorySchema);

export default ReadingHistory;
