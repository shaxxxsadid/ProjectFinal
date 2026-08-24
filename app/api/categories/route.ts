import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "@/app/lib/mongoose";
import { categoryService, CATEGORY_ERRORS } from "@/app/services/Category.service";

// Коды ошибок сервиса → HTTP статус
function statusFromCode(code?: string): number {
    switch (code) {
        case CATEGORY_ERRORS.NOT_FOUND:
            return 404;
        case CATEGORY_ERRORS.CODE_EXISTS:
        case CATEGORY_ERRORS.HAS_CHILDREN:
        case CATEGORY_ERRORS.HAS_PRODUCTS:
        case CATEGORY_ERRORS.INVALID_PARENT:
        case CATEGORY_ERRORS.INVALID_ATTRIBUTE:
        case CATEGORY_ERRORS.VALIDATION_FAILED:
        case 'INVALID_ID':
            return 400;
        default:
            return 500;
    }
}

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();
        const { searchParams } = request.nextUrl;

        const parentParam = searchParams.get('parent');
        const filter = {
            search: searchParams.get('search') || undefined,
            isActive: searchParams.has('isActive')
                ? searchParams.get('isActive') === 'true'
                : undefined,
            parent: searchParams.has('parent')
                ? (parentParam === '' || parentParam === 'null' ? null : parentParam)
                : undefined,
            level: searchParams.has('level') ? Number(searchParams.get('level')) : undefined,
        };

        const result = await categoryService.getAll(filter);

        if (!result.success) {
            return NextResponse.json(result, { status: statusFromCode(result.code) });
        }

        return NextResponse.json(
            { success: true, data: result.data, total: result.data?.length ?? 0 },
            { status: 200 }
        );
    } catch (error) {
        console.error(`GET /api/categories failed: ${error instanceof Error ? error.message : error}`);
        return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();
        const body = await request.json();

        const result = await categoryService.create(body);

        if (!result.success) {
            return NextResponse.json(result, { status: statusFromCode(result.code) });
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error(`POST /api/categories failed: ${error instanceof Error ? error.message : error}`);
        return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const { _id, id, ...updateData } = body;
        const categoryId = _id || id;

        if (!categoryId) {
            return NextResponse.json({ success: false, error: 'Category id is required' }, { status: 400 });
        }

        const result = await categoryService.update(categoryId, updateData);

        if (!result.success) {
            return NextResponse.json(result, { status: statusFromCode(result.code) });
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error(`PATCH /api/categories failed: ${error instanceof Error ? error.message : error}`);
        return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const categoryId = body._id || body.id;

        if (!categoryId) {
            return NextResponse.json({ success: false, error: 'Category id is required' }, { status: 400 });
        }

        const result = await categoryService.delete(categoryId);

        if (!result.success) {
            return NextResponse.json(result, { status: statusFromCode(result.code) });
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error(`DELETE /api/categories failed: ${error instanceof Error ? error.message : error}`);
        return NextResponse.json({ success: false, error: 'Failed to delete category' }, { status: 500 });
    }
}