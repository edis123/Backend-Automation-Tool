const express = require("express");
const prisma = require("../db");
const { error } = require("node:console");

const router = express.Router();

/**
 * -------------------------
 * RUNS ROUTES (most specific first)
 * -------------------------
 */


// PAUSE A JOB 
router.post("/pause/:id", async(request,response)=>{
   const jobId = parseInt(request.params.id,10);
    try{

         const pausedJob = await prisma.job.findUnique({
            where: {id:jobId,
                active: true,
            },
            

         });

         if(!pausedJob){
            console.log("Job not found, Probably already paused");
            console.error("Error pausing job:", error);
            response.status(500).json({ error: "Failed to pause job" });
        }

        await prisma.job.update({
            where: {id:jobId},
            data: {active:false},
        });

        response.json({message:`Job ${jobId} paused successfully `});
        console.log(`Job ${jobId} paused successfully`);


    }catch(error){
            console.error("Error pausing job:", error);
            response.status(500).json({ error: "Failed to pause job" });
    }

})

// RESUME A JOB

router.post("/resume/:id", async(request, response)=>{
  const jobId = parseInt(request.params.id,10);


  try{
    
     const resumeJob =  await prisma.job.findUnique({
       where:{
           
         id:jobId,
         active:false,

       },
  });


  if(!resumeJob){

    console.log(`Job  ${jobId} is probably active`)
    console.error(`Error `,error)
    response.status(500).json({error: `Failed to resume job ${jobId}`})
  }
 
   await prisma.job.update({

      where:{ id:jobId
      },

     data:{
        active:true,
     }

   })

      response.json({message: `Job ${jobId} resumed successfully`})
      console.log(`Job ${jobId} resumed successfully`)
  }
  catch(error){
    console.error(`Error resuming job${jobId} :`, error);
    response.status(500).json({ error: `Failed to resume job ${jobId}` });
  }
})

// GET JOB RUN DETAILS BY RUN ID
router.get("/:jobId/runs/:id", async (request, response) => {
  try {
    const runId = parseInt(request.params.id, 10);

    const runDetails = await prisma.jobRun.findUnique({
      where: { id: runId },
    });

    if (!runDetails) {
      return response.status(404).json({ error: "Job run not found" });
    }

    response.json(runDetails);
  } catch (error) {
    console.error("Error fetching this run details:", error);
    response.status(500).json({ error: "Failed to fetch this run details" });
  }
});

// GET ALL RUNS FOR A SPECIFIC JOB ID
router.get("/:id/runs", async (request, response) => {
  try {
    const jobId = parseInt(request.params.id, 10);

    const jobRuns = await prisma.jobRun.findMany({
      where: { jobId }, // ✅ FIX: jobId, not id
      take: 20,
      orderBy: { startedAt: "desc" },
    });

    response.json(jobRuns);
  } catch (error) {
    console.error("Error fetching job runs:", error);
    response.status(500).json({ error: "Failed to fetch job runs" });
  }
});



/**
 * -------------------------
 * JOB ROUTES
 * -------------------------
 */



// LIST ALL JOBS
router.get("/", async (request, response) => {
  try {
    const jobs = await prisma.job.findMany();
    response.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    response.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// GET A JOB BY ID
router.get("/:id", async (request, response) => {
  try {
    const jobId = parseInt(request.params.id, 10);

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return response.status(404).json({ error: "Job not found" });
    }

    response.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    response.status(500).json({ error: "Failed to fetch job" });
  }
});

// UPDATE A JOB
router.patch("/:id", async (request, response) => {
  try {
    const jobId = parseInt(request.params.id, 10);
    const update = request.body;

    const job = await prisma.job.update({
      where: { id: jobId },
      data: update,
    });

    response.json(job);
  } catch (error) {
    console.error("Error updating job:", error);
    response.status(500).json({ error: "Failed to update job" });
  }
});

// DELETE A JOB
router.delete("/:id", async (request, response) => {
  try {
    const jobId = parseInt(request.params.id, 10);

    await prisma.job.delete({
      where: { id: jobId },
    });

    response.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    response.status(500).json({ error: "Failed to delete job" });
  }
});

router.post("/", async (request, response) => {
  try {
    const { name, url, method, body, intervalSeconds } = request.body;

    const newJob = await prisma.job.create({
      data: {
        name,
        url,
        method: method || "GET",
        body: body || "",
        intervalSeconds,
        lastRunAt: null, // ✅ Better default: run immediately on first scheduler tick
      },
    });

    response.status(201).json(newJob);
  } catch (error) {
    console.error("Error creating job:", error);
    response.status(500).json({ error: "Failed to create job" });
  }
});


module.exports = router;
