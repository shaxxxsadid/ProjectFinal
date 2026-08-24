import { CategoryAttribute, ICategory } from "@/types/dbData";
import mongoose, { Model, Schema } from "mongoose";

const attributesSchema = new Schema<CategoryAttribute>(
  {
    name: {
      type: String,
      required: [true, 'Attribute name is required'],
      trim: true,
      maxlength: [100, 'Attribute name cannot exceed 100 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['string', 'number', 'boolean', 'date'],
        message: 'Attribute type must be one of: string, number, boolean, date',
      },
      required: [true, 'Attribute type is required'],
    },
    unit: {
      type: String,
      trim: true,
      maxlength: [50, 'Attribute unit cannot exceed 50 characters'],
    },
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

// Основная схема категории.
// Иерархия строится через parent, а level вычисляется автоматически.
const categorySchema = new Schema<ICategory>(
  {
    code: {
      type: String,
      required: [true, 'Category code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [50, 'Category code cannot exceed 50 characters'],
      match: [
        /^[A-Z0-9_-]+$/,
        'Category code can only contain uppercase letters, numbers, underscores, and hyphens',
      ],
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Category description cannot exceed 500 characters'],
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    level: {
      type: Number,
      default: 1,
      required: true,
      min: [1, 'Category level must be at least 1'],
    },
    attributes: {
      type: [attributesSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => { // eslint-disable-line
        ret._id = ret._id.toString();
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/**
 * Перед валидацией автоматически вычисляем level из цепочки parent.
 * Заодно не даём создать ссылку категории на саму себя или цикл.
 */
categorySchema.pre('validate', async function () {
  const rawParent = this.parent as unknown as { _id?: unknown } | string | null | undefined;
  const parentId =
    rawParent && typeof rawParent === 'object' && '_id' in rawParent
      ? rawParent._id
      : rawParent;

  if (!parentId) {
    this.level = 1;
    return;
  }

  if (String(parentId) === String(this._id)) {
    throw new Error('Category cannot be its own parent');
  }

  const CategoryModel = mongoose.model<ICategory>('Category');
  const visited = new Set<string>([String(this._id)]);
  let currentId: unknown = parentId;
  let computedLevel = 1;

  while (currentId) {
    const currentIdString = String(currentId);

    if (visited.has(currentIdString)) {
      throw new Error('Category hierarchy cannot contain cycles');
    }
    visited.add(currentIdString);

    const current = await CategoryModel.findById(currentId)
      .select('_id parent')
      .lean() as { _id: unknown; parent?: unknown } | null;

    if (!current) {
      throw new Error('Parent category not found');
    }

    computedLevel += 1;
    currentId = current.parent ?? null;
  }

  this.level = computedLevel;
});

categorySchema.virtual('parentName').get(function (
  this: ICategory & { parent?: { name: string } }
) {
  return this.parent ? (this.parent as { name: string }).name : null;
});

categorySchema.index({ parent: 1, level: 1, isActive: 1 });

const Category =
  (mongoose.models.Category as Model<ICategory>) ||
  mongoose.model<ICategory>('Category', categorySchema);

export default Category;
