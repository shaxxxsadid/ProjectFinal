import { connectToDatabase } from "@/app/lib/mongoose";
import { usersService } from "@/app/services/Users.service";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { AuthOptions } from "../../auth/[...nextauth]/route";
import { IAvatar } from "@/types/dbData";
import sharp from "sharp";
import mongoose from "mongoose"; // ✅ Добавили для валидации ObjectId

// ✅ Допустимые MIME-типы
const VALID_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg"] as const;
type ValidMimeType = typeof VALID_MIME_TYPES[number];

// ✅ Лимиты
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const AVATAR_MAX_DIMENSION = 512; // Макс. сторона аватара

// 🎨 Настройки качества для Sharp
const SHARP_SETTINGS = {
  jpeg: {
    quality: 95,
    progressive: true,
    mozjpeg: true,
    chromaSubsampling: "4:4:4" as const,
  },
  png: {
    compressionLevel: 6,
    adaptiveFiltering: true,
    palette: false,
    quality: 100,
  },
} as const;

/**
 * 🔍 Валидация и нормализация MIME-типа
 */
function normalizeMimeType(mime: string): ValidMimeType | null {
  const normalized = mime.toLowerCase();
  if (normalized === "image/jpg") return "image/jpeg";
  if (VALID_MIME_TYPES.includes(normalized as ValidMimeType)) {
    return normalized as ValidMimeType;
  }
  return null;
}

/**
 * 🖼️ Обработка изображения через Sharp
 */
async function processImage(
  buffer: Buffer,
  mimeType: ValidMimeType
): Promise<Buffer> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  // Ресайз если нужно (опционально)
  if (metadata.width && metadata.height) {
    const maxSide = Math.max(metadata.width, metadata.height);
    if (maxSide > AVATAR_MAX_DIMENSION) {
      image.resize(AVATAR_MAX_DIMENSION, AVATAR_MAX_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }
  }

  // Коррекция ориентации по EXIF
  image.rotate();

  if (mimeType === "image/jpeg") {
    return await image.jpeg(SHARP_SETTINGS.jpeg).toBuffer();
  } else {
    return await image.png(SHARP_SETTINGS.png).toBuffer();
  }
}

/**
 * 📥 Парсинг data:URL в Buffer + MIME
 */
function parseDataUrl(dataUrl: string): { buffer: Buffer; mimeType: string } | null {
  try {
    const parts = dataUrl.split(",");
    if (parts.length !== 2) return null;
    
    const meta = parts[0];
    const base64Data = parts[1];
    const mimeMatch = meta.match(/data:([^;]+);base64/);
    
    if (!mimeMatch || !base64Data) return null;
    
    return {
      buffer: Buffer.from(base64Data, "base64"),
      mimeType: mimeMatch[1],
    };
  } catch {
    return null;
  }
}

/**
 * 📤 Конвертация буфера в base64 data:URL для ответа
 */
function bufferToDataUrl(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

// ============================================================================
// 🟢 GET — получение аватара
// ============================================================================
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { success: false, error: "User email is required" },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();
    const user = await usersService.getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userAvatar = await usersService.getAvatar(email);

    if (!userAvatar?.data) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "Avatar not found",
      });
    }

    // Нормализация буфера
    const bufferArray = Array.isArray(userAvatar.data)
      ? Buffer.from(userAvatar.data)
      : userAvatar.data instanceof Buffer
      ? userAvatar.data
      : Buffer.from(userAvatar.data?.data || userAvatar.data);

    if (!bufferArray || bufferArray.length === 0) {
      return NextResponse.json({ success: true, data: null });
    }

    const mimeType = userAvatar.type || "image/png";
    const imgSrc = bufferToDataUrl(bufferArray, mimeType);

    return NextResponse.json(
      { success: true, data: imgSrc },
      {
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      }
    );
  } catch (error) {
    console.error("🔴 Avatar GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================================
// 🔵 PUT — обновление аватара
// ============================================================================
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(AuthOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { avatar } = body;

    if (!avatar) {
      return NextResponse.json({ error: "Avatar is required" }, { status: 400 });
    }

    let buffer: Buffer | null = null;
    let mimeType: ValidMimeType = "image/jpeg";

    // ── Вариант 1: data:URL строка ──────────────────────────────────────
    if (typeof avatar === "string" && avatar.startsWith("data:")) {
      const parsed = parseDataUrl(avatar);
      if (!parsed) {
        return NextResponse.json(
          { error: "Invalid data URL format" },
          { status: 400 }
        );
      }
      buffer = parsed.buffer;
      mimeType = normalizeMimeType(parsed.mimeType) || "image/jpeg";
    }
    // ── Вариант 2: объект с данными ─────────────────────────────────────
    else if (typeof avatar === "object" && avatar !== null) {
      const rawData = avatar.data;
      
      if (Array.isArray(rawData)) {
        buffer = Buffer.from(rawData);
      } else if (typeof rawData === "string" && rawData.startsWith("data:")) {
        const parsed = parseDataUrl(rawData);
        if (!parsed) return NextResponse.json({ error: "Invalid avatar data" }, { status: 400 });
        buffer = parsed.buffer;
        mimeType = normalizeMimeType(parsed.mimeType) || "image/jpeg";
      } else if (Buffer.isBuffer(rawData)) {
        buffer = rawData;
      } else {
        return NextResponse.json({ error: "Unsupported avatar data format" }, { status: 400 });
      }
      
      if (avatar.type) {
        const normalized = normalizeMimeType(avatar.type);
        if (normalized) mimeType = normalized;
      }
    } else {
      return NextResponse.json({ error: "Invalid avatar format" }, { status: 400 });
    }

    // ── Валидация буфера ───────────────────────────────────────────────
    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ error: "Avatar data is empty" }, { status: 400 });
    }

    // 🔍 Проверка реального типа файла (защита от подмены)
    // Если file-type не установлен — этот блок можно закомментировать
    try {
      const { fileTypeFromBuffer } = await import("file-type");
      const fileType = await fileTypeFromBuffer(buffer);
      if (fileType?.mime) {
        const detectedMime = normalizeMimeType(fileType.mime);
        if (detectedMime && VALID_MIME_TYPES.includes(detectedMime)) {
          mimeType = detectedMime;
        }
      }
    } catch (e) {
      // file-type не установлен — пропускаем проверку, используем заявленный MIME
      console.warn("⚠️ file-type not available, skipping file type detection");
    }

    if (!VALID_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: `Invalid image format. Supported: PNG, JPG. Got: ${mimeType}` },
        { status: 400 }
      );
    }

    // 📏 Проверка размера
    if (buffer.length > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        {
          error: `Image too large. Max: 5MB. Got: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`,
        },
        { status: 400 }
      );
    }

    // ✨ Обработка через Sharp
    let processedBuffer: Buffer;
    try {
      processedBuffer = await processImage(buffer, mimeType);
    } catch (err) {
      console.error("🔴 Image processing error:", err);
      return NextResponse.json(
        {
          error: `Failed to process image: ${err instanceof Error ? err.message : "Unknown error"}`,
        },
        { status: 400 }
      );
    }

    // 💾 Подготовка объекта аватара
    const targetId = body._id;
    
    // ✅ ВАЛИДАЦИЯ: проверяем, является ли targetId валидным ObjectId
    const isValidObjectId = targetId && mongoose.Types.ObjectId.isValid(targetId);
    
    const avatarObj: IAvatar = {
      fileName: `${targetId || session.user.email}-avatar-${Date.now()}`,
      type: mimeType,
      data: processedBuffer,
    };

    // 🗄️ Сохранение в БД — с безопасной проверкой _id
    try {
      let updatedUser;
      
      if (isValidObjectId) {
        // Обновляем по валидному MongoDB _id
        updatedUser = await usersService.updateUserAvatarById(targetId, avatarObj);
      } else {
        // ⚠️ Если _id не валиден (или это email) — обновляем по email сессии
        if (targetId) {
          console.warn(`⚠️ Invalid ObjectId "${targetId}", falling back to email update`);
        }
        updatedUser = await usersService.updateUserAvatar(session.user.email!, avatarObj);
      }
        
      return NextResponse.json({ success: true, user: updatedUser });
    } catch (dbError) {
      console.error("🔴 MongoDB save error:", dbError);
      return NextResponse.json(
        {
          error: `Failed to save avatar: ${dbError instanceof Error ? dbError.message : "Unknown error"}`,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("🔴 Avatar PUT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update avatar" },
      { status: 500 }
    );
  }
}