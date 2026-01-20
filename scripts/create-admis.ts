import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", status: "ACTIVE", mustChangePassword: false },
    create: { email, passwordHash, role: "ADMIN", status: "ACTIVE", mustChangePassword: false },
  });

  console.log("Admin ready:", user.email);
}

main().finally(() => prisma.$disconnect());
