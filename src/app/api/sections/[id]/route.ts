import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const section = await prisma.section.update({
            where: { id: params.id },
            data: {
                name: body.name,
            },
        });
        return NextResponse.json(section);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        await prisma.section.delete({
            where: { id: params.id },
        });
        return NextResponse.json({ message: "Section deleted successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to delete section. It may have associated students." },
            { status: 500 }
        );
    }
}
