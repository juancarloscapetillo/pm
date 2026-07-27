import { runReminderCycle } from "../src/lib/escalation";
import { prisma } from "../src/lib/prisma";

runReminderCycle()
  .then((result) => {
    console.log("Ciclo de recordatorios ejecutado:", result);
  })
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
