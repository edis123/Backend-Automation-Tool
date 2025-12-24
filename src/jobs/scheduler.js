const prisma = require("../db");
const { executeJob } = require("./executor");

async function isJobDue(job, now) {
  if (!job.active) {
    return false;
  }
  if (!job.lastRunAt) {
    //never run before
    return true;
  }
  // if run before, check if interval has passed
  const nextRun = new Date(
    job.lastRunAt.getTime() + job.intervalSeconds * 1000
  );
  const nowTime = now.getTime();

  return nowTime >= nextRun.getTime(); //job is due if current time is greater than or equal to nextRun time
}

// A JOB CAN BE DUE BUT NOT READDY YET, SINCE RUNNIG TIME MIGHT TAKE LONGER THAN INSTERVALSECONDS
async function jobReady(dueJob) {
  const jobRunning = await prisma.jobRun.findFirst({
    where: { jobId: dueJob.id, status: "running" },
  });

  if (jobRunning) {
    return false;
  }

  return true;
}
// IN CASE THE NODE FAILS RESET THE STATUS OF THE JOBS
async function checkStatusJobsAtStart() {
  const jobsCount = await prisma.job.count();

  console.log(`There ${jobsCount} JOBS in DB.`);

  const stuckJobs = await prisma.jobRun.findMany({
    where: { status: "running" },
  });
  console.log(`${stuckJobs.length}:  stuck jobs`);

 
    const fixed = await prisma.jobRun.updateMany({
      where: { status: "running" },
      data: {
        status: "failed",
        errorMessage: "Recovered on startup",
        finishedAt: new Date(),
      },
    });
  
  console.log(`${fixed.count}:  jobs restored`);
}

async function startScheduler() {
  const interval = 5000; // Check every 5 seconds
  console.log("Scheduler started, checking for due jobs every 5 seconds.");

  setInterval(async () => {
    const now = new Date();

    try {
      const jobs = await prisma.job.findMany({
        where: { active: true },
      });

      const dueJobs = jobs.filter((job) => isJobDue(job, now));

      for (const job of dueJobs) {
        const val = await jobReady(job);

        if (!val) {
          console.log(`Skipping job ${job.id} - already running`);
          continue;
        }

        executeJob(job).catch((error) => {
          console.error(`Failed to execute job ${job.id}:`, error);
        });
        console.log(`Executing job ${job.id} (${job.name})...`);
      }
    } catch (error) {
      console.error("Error in scheduler:", error);
    }
  }, interval);
}

module.exports = { startScheduler, checkStatusJobsAtStart };
