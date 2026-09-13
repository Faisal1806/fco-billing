import mongoose, { Schema, Model } from 'mongoose';

export interface IDocument {
  key: string;
  value: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

const FcoDocument: Model<IDocument> =
  mongoose.models.FcoDocument ||
  mongoose.model<IDocument>('FcoDocument', DocumentSchema);

export default FcoDocument;
