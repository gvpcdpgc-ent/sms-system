const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database with new Schema...');

    // 0. Clean up (Optional, but good for reset)
    // In strict mode, we might need to delete in order: History -> Student -> User -> Section -> Dept
    try {
        await prisma.attendanceHistory.deleteMany();
        await prisma.student.deleteMany();
        await prisma.user.deleteMany();
        await prisma.alumni.deleteMany();
        await prisma.section.deleteMany();
        await prisma.department.deleteMany();
    } catch (e) {
        console.log("Cleanup skipped or partial.");
    }

    // 1. Master Data: Departments & Sections
    console.log('Creating Departments & Sections...');
    const cse = await prisma.department.create({ data: { name: 'Computer Science & Engineering', code: 'CSE' } });
    const csm = await prisma.department.create({ data: { name: 'Computer Science & Machine Learning', code: 'CSM' } });

    const sections = [];
    for (const s of ['A', 'B', 'C']) {
        sections.push(await prisma.section.create({ data: { name: s } }));
    }

    // 2. Users
    // Admin (Global)
    const password = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
        data: { username: 'admin', password, role: 'ADMIN', departmentId: null }
    });

    // CSE HOD
    await prisma.user.create({
        data: { username: 'hod_cse', password, role: 'HOD', departmentId: cse.id }
    });

    // CSM HOD
    await prisma.user.create({
        data: { username: 'hod_csm', password, role: 'HOD', departmentId: csm.id }
    });

    // CSE Staff
    await prisma.user.create({
        data: { username: 'staff_cse', password, role: 'USER', departmentId: cse.id }
    });

    // CSM Staff
    await prisma.user.create({
        data: { username: 'staff_csm', password, role: 'USER', departmentId: csm.id }
    });

    // 3. Students
    console.log('Creating Students...');
    const depts = [cse, csm];
    const years = ['1', '2', '3', '4'];

    // Helper to Create Students
    for (const dept of depts) {
        for (const year of years) {
            for (const section of sections) {
                // 5 Students per class
                for (let i = 1; i <= 5; i++) {
                    const roll = `${year}2${section.name}${dept.code}${i.toString().padStart(3, '0')}`;
                    await prisma.student.create({
                        data: {
                            rollNumber: roll,
                            name: `Student ${dept.code} ${year}-${section.name} ${i}`,
                            mobile: '9999999999',
                            year: year,
                            semester: '2', // Only 2nd Sem as requested
                            sectionId: section.id,
                            departmentId: dept.id
                        }
                    });
                }
            }
        }
    }

    // 4. Attendance History (Past 1 Month)
    console.log('Generating History...');
    const today = new Date();
    const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });

    for (let d = 30; d >= 0; d--) {
        const date = new Date();
        date.setDate(today.getDate() - d);

        // Randomly pick a few classes to have reports
        if (Math.random() > 0.5) {
            const dept = depts[Math.floor(Math.random() * depts.length)];
            const section = sections[Math.floor(Math.random() * sections.length)];
            const year = years[Math.floor(Math.random() * years.length)];

            await prisma.attendanceHistory.create({
                data: {
                    date: date,
                    year: year,
                    semester: '2',
                    sectionId: section.id,
                    departmentId: dept.id,
                    status: 'Marked Present',
                    fileName: `${dept.code}_${year}_2_${section.name}_${date.toISOString().split('T')[0]}.xlsx`,
                    downloadedBy: adminUser.id,
                    details: '[]' // Mock details
                }
            });
        }
    }

    // 5. Alumni
    console.log('Creating Alumni...');
    for (const dept of depts) {
        for (let i = 1; i <= 5; i++) {
            await prisma.alumni.create({
                data: {
                    rollNumber: `AL${dept.code}${i}`,
                    name: `Alumni ${dept.code} ${i}`,
                    mobile: '8888888888',
                    passingYear: '2024',
                    departmentId: dept.id
                }
            });
        }
    }

    console.log('Seeding Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
