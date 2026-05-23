require("dotenv").config();
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL ?? ""),
});

async function main() {
    const users = [
        {
            name: "Admin User",
            email: "admin@biolab.ai",
            password: "Admin123!",
            role: "admin",
            department: "Operations",
            institution: "BioLab AI",
        },
        {
            name: "Lab Head",
            email: "head@biolab.ai",
            password: "LabHead123!",
            role: "lab_head",
            department: "Biochemistry",
            institution: "BioLab AI",
        },
        {
            name: "Researcher",
            email: "researcher@biolab.ai",
            password: "Research123!",
            role: "researcher",
            department: "Genomics",
            institution: "BioLab AI",
        },
    ];

    for (const user of users) {
        const existing = await prisma.user.findUnique({ where: { email: user.email } });
        if (existing) continue;
        const createdUser = await prisma.user.create({
            data: {
                name: user.name,
                email: user.email,
                password_hash: await bcrypt.hash(user.password, 12),
                role: user.role,
                department: user.department,
                institution: user.institution,
            },
        });

        // Add some activity logs for each user
        await prisma.activityLog.create({
            data: {
                user_id: createdUser.id,
                action: `joined the lab as ${user.role}`,
                module: "Dashboard",
            },
        });
    }

    // Add some sample activity logs
    const adminUser = await prisma.user.findUnique({ where: { email: "admin@biolab.ai" } });
    if (adminUser) {
        await prisma.activityLog.create({
            data: {
                user_id: adminUser.id,
                action: "uploaded Western Blot protocol",
                module: "Protocol",
            },
        });
        await prisma.activityLog.create({
            data: {
                user_id: adminUser.id,
                action: "published paper summary on CRISPR",
                module: "Papers",
            },
        });
    }

    const researcherUser = await prisma.user.findUnique({ where: { email: "researcher@biolab.ai" } });
    if (researcherUser) {
        await prisma.activityLog.create({
            data: {
                user_id: researcherUser.id,
                action: "marked reagent low for Ethanol",
                module: "Inventory",
            },
        });
        await prisma.activityLog.create({
            data: {
                user_id: researcherUser.id,
                action: "reported anomaly in experiment Delta-12",
                module: "Experiments",
            },
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
