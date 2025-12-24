/*first creat  a row in job run then make the http request. the order is important to avoid data loss if thereis an is
and we might never have logged that a jobwas tried to run. like this we store it first and log if fail or success.
use axios for http request , meaninng axios is our externall agent, 
whereas prisma is our internal agen that connects db and express(baxkend)

CREATE RUN ENTRY =>RUN JOB=>UPDATE RUN ENTRY WITH RESULT (SUCCESS OR FAILURE)
*/ 


const prisma = require("../db");
const axios = require("axios");
async function executeJob(job) {

  //create a new jobRun entry, row in jobRun table
  const start = new Date();
  let run = await prisma.jobRun.create({ // run cannot be const as we update it later
    data: {
      jobId: job.id,
      status: 'running',
      statusCode: null,
      responseSnippet: null,
      errorMessage: null,
      startedAt: start,
      finishedAt: start,
    },
  });
  try {// Execute the HTTP request using axios and capture the response
    let response = await axios({
      method: job.method,
      url: job.url,
      data: job.body || undefined,
      timeout: 10000,
    });

    const finished = new Date();

// snippet of response body
    let snippet = '';
    if(typeof response.data === 'string'){
        snippet = response.data.slice(0, 200); //  create substring     
    }else{
        snippet = JSON.stringify(response.data).slice(0, 200);
    }
    
    // Update the jobrun entry with success details
    run = await prisma.jobRun.update({
      where: { id: run.id },
      data: {   

        status: 'success',
        statusCode: response.status,
        responseSnippet: snippet,       
        finishedAt: finished,

        },
    });

    // Update the job's lastRunAt
    await prisma.job.update({
      where: { id: job.id },
      data: { lastRunAt: finished },
    });
    console.log(`Job ${job.id} executed successfully.`);
  } catch (error) {
    const finished = new Date();
    console.error(`Error executing job ${job.id}:`, error.message);

    const statusCode = error.response ? error.response.status : null;

    // Update the job run with failure details
       await prisma.jobRun.update({
        where: { id: run.id },  
        data: {
            status: 'failed',
            statusCode: statusCode,
            errorMessage: error.message.slice(0, 400),
            finishedAt: finished,
        },
    });
//update the job's lastRunAt even on failure to know when it was last tried
    await prisma.job.update({
      where: { id: job.id },
      data: { lastRunAt: finished },
    });
  }
}
module.exports = { executeJob };
