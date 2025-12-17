import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const whereClause: any = {};
        const { role, departmentId } = session.user as any;

        // If HOD, only show history from their department
        if (role === "HOD" && departmentId) {
            whereClause.departmentId = departmentId;
        }

        const history = await prisma.attendanceHistory.findMany({
            where: whereClause,
            orderBy: { date: "desc" },
            include: {
                user: {
                    select: { username: true },
                },
                section: true,
            },
        });
        return NextResponse.json(history);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const history = await prisma.attendanceHistory.create({
            data: {
                year: String(body.year),
                semester: String(body.semester),
                sectionId: String(body.sectionId || body.section),
                departmentId: String(body.departmentId || body.department),
                status: body.status,
                fileName: body.fileName,
                date: body.date,
                details: body.details || "[]",
                downloadedBy: session.user.id,
            },
        });
        return NextResponse.json(history);
    } catch (error) {
        return NextResponse.json({ error: "Failed to log history" }, { status: 500 });
    }
}
