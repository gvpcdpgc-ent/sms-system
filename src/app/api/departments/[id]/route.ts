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
        const sectionConnect = body.sectionIds ? body.sectionIds.map((id: string) => ({ id })) : [];

        const department = await prisma.department.update({
            where: { id: params.id },
            data: {
                name: body.name,
                code: body.code,
                sections: {
                    set: sectionConnect // Replace existing links with new list
                }
            },
            include: { sections: true }
        });
        return NextResponse.json(department);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
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
        await prisma.department.delete({
            where: { id: params.id },
        });
        return NextResponse.json({ message: "Department deleted successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to delete department. It may have associated students or users." },
            { status: 500 }
        );
    }
}
