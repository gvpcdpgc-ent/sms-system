import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// DELETE Alumnus
export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await prisma.alumni.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting alumni:", error);
        return NextResponse.json({ error: "Failed to delete alumni" }, { status: 500 });
    }
}

// UPDATE Alumnus
export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { rollNumber, name, mobile, passingYear } = body;

        const updatedAlumni = await prisma.alumni.update({
            where: { id: params.id },
            data: {
                rollNumber,
                name,
                mobile,
                passingYear
            },
        });

        return NextResponse.json(updatedAlumni);
    } catch (error) {
        console.error("Error updating alumni:", error);
        return NextResponse.json({ error: "Failed to update alumni" }, { status: 500 });
    }
}
