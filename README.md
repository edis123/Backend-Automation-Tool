BACKEND AUTOMATION TOOL (BAT)

Backend Automation Tool (BAT) is a backend application that manages and executes scheduled HTTP jobs in a controlled and observable way.
The system allows users to define jobs that run at configurable intervals, track execution history, handle failures, and prevent overlapping executions.


TECH STACK

The application is built using:
Express – web framework responsible for routing and API endpoints.
Prisma – ORM that connects the application to the database and manages schema and queries.
PostgreSQL – relational database used to store jobs and execution history.
Axios – used to perform HTTP requests during job execution.
Nodemon – used during development for automatic server restarts.
Prisma acts as the middle layer between Express and PostgreSQL, allowing the application to define database models and perform queries in a structured and type-safe way.


CORE COMPNENTS

The main logic of the application is handled by four files:
executor.js
scheduler.js
jobs.js
index.js



EXECUTOR

The executor is responsible for running individual jobs.
When a job is executed:
A new entry is created in the JobRun table with status running.
An HTTP request is performed using Axios.

The JobRun entry is updated based on the result:
success if the request succeeds,
failed if an error occurs.

The job’s lastRunAt field is updated even on failure, so execution history is preserved.
This ensures every execution attempt is tracked and visible.


SCHEDULER

The scheduler runs in the background and periodically checks which jobs should be executed.

A job is considered due when:
It is marked as active.
It has never run before or current time exceeds lastRunAt + intervalSeconds.

A job is considered ready when:
There is no existing JobRun with status running for that job.
This prevents overlapping executions.

On application startup, the scheduler also performs a status check to recover any jobs that were left in a running state due to an unexpected crash.


JOBS (ROUTES)

The jobs module defines all API routes related to job management, including:

Creating jobs,
Listing jobs,
Updating jobs,
Deleting jobs,

Fetching execution history (JobRun records),
This module handles both standard CRUD operations and job-specific queries.



INDEX

The index file is the main entry point of the application.
Establishes a connection to the database.
Performs a startup status check for job executions.
Starts the Express server.
Launches the scheduler loop.
This ensures the system starts in a clean and consistent state.
