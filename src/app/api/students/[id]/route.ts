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
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, departmentId: userDeptId } = session.user as any;
    if (role !== "ADMIN" && role !== "HOD") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await request.json();

        // Check if student exists and belongs to department if HOD
        if (role === "HOD") {
            const existingStudent = await prisma.student.findUnique({
                where: { id: params.id },
                select: { departmentId: true }
            });

            if (!existingStudent) {
                return NextResponse.json({ error: "Student not found" }, { status: 404 });
            }

            if (existingStudent.departmentId !== userDeptId) {
                return NextResponse.json({ error: "You can only update students of your department" }, { status: 403 });
            }

            // Also prevent moving student to another department
            if (body.departmentId && body.departmentId !== userDeptId) {
                return NextResponse.json({ error: "You cannot move students to another department" }, { status: 403 });
            }
        }

        const student = await prisma.student.update({
            where: { id: params.id },
            data: body,
        });
        return NextResponse.json(student);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, departmentId: userDeptId } = session.user as any;
    if (role !== "ADMIN" && role !== "HOD") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        // Check scoping for HOD
        if (role === "HOD") {
            const existingStudent = await prisma.student.findUnique({
                where: { id: params.id },
                select: { departmentId: true }
            });

            if (!existingStudent) {
                return NextResponse.json({ error: "Student not found" }, { status: 404 });
            }

            if (existingStudent.departmentId !== userDeptId) {
                return NextResponse.json({ error: "You can only delete students of your department" }, { status: 403 });
            }
        }

        await prisma.student.delete({
            where: { id: params.id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
    }
}
