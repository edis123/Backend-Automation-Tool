const prisma = require("./db");
const express = require("express");
const router = require("./routes/jobs");
const { startScheduler } = require("./jobs/scheduler");
const { checkStatusJobsAtStart } = require("./jobs/scheduler");
const application = express();

application.use(express.json());
application.use("/jobs", router);

application.get("/health", (request, response) => {
  response.json({ status: "ok", message: "BAT Server is running  {}" });
  console.log("BAT Server is running  {}");
});

application.listen(3000, async () => {
  console.log("Server started on http://localhost:3000");

  try {
    await checkStatusJobsAtStart();

    startScheduler();
  } catch (error) {
    console.error("Failed to connect to the database:", error);
  }
});
