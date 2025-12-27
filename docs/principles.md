# Principles of Implementation

## e: The Economics of Software (Value & Money)

* **e1: Value = Money.** I make money by delivering value to customers and taking a share of that value. Everything I do must serve this goal.
* **e2: Code is Inventory, Features are Revenue.** Code is a cost (liability) that must be maintained. Features in the hands of users are revenue. I optimize for shipping features, not writing code.
* **e3: Velocity is the Primary Metric.** The faster I turn ideas into working software, the faster I capture value. Perfectionism is economic malpractice.
* **e4: Features are Hypotheses.** Every new feature is a hypothesis. I write the minimum code necessary to test the hypothesis.
* **Momentum over Perfection.** A working, ugly feature builds momentum. A perfect, unfinished feature kills it.
* **Imperfect Action.** Rapid, imperfect shipping outperforms perfect planning. Real-world usage is the only valid validation.
* **Sunk Cost Fallacy.** If a feature isn't being used, I delete the code. I do not keep it around "just in case."
* **Power Law of Value.** The majority of utility comes from a minority of features. I do not waste time on the "long tail" or secondary UI details; "good enough" is sufficient.

## b: "Boring is Fast" (Technology Strategy)

* **Stability is Velocity:** I use boring tech because stability lets me move fast. If I don't have to learn a new framework every 6 months, I can exploit my deep knowledge for decades.
* **The Lindy Effect:** I use technologies that have survived the filter of time (SQL, HTTP, HTML, Postgres).
* **Dependency Skepticism:** Every `npm install` is a marriage. I check the maintenance status, the size, and the "boringness" of a package before marrying it.
* **Vendor Independence:** I avoid cloud-specific services (AWS Lambda, Vercel KV) in favor of standard containers. This preserves my ability to deploy anywhere (Hetzner, DigitalOcean, bare metal).
* **The "2005" Mental Model:** I prefer the simplicity of the early web (Request → Loader → HTML). I reject the complexity of modern meta-frameworks in favor of web standards.
* **Be Embarrassed:** It is okay if the stack isn't "cool." In fact, I should be a bit embarrassed by how simple/boring it is, as long as it delivers.

## c: Cognitive Capacity & Architecture

* **Cognitive Bottleneck:** My working memory is the scarcest resource. "Clever" code exhausts this resource. "Boring" code preserves it for domain logic.
* **The "No API" Dogma:** Frontend and Backend are a single mental unit. The Client is just a View; the Database is the State; the URL is the Source of Truth.
* **Server Actions > API Endpoints:** I do not create generic REST endpoints. I create specific functions that handle specific user intents (Form Actions).
* **Scale is a Distraction:** I architect strictly for the first 10 concurrent users. This is a psychological constraint to prevent over-engineering.
* **YAGNI (You Ain't Gonna Need It):** I do not implement soft-deletes, multi-tenancy, or localization until a paying customer demands it. These features complicate every query for zero immediate gain.
* **The "Bus Factor" of 1:** I write code as if I will be hit by a bus (or simply forget everything in 3 months). The code must be readable by a stranger (or my future self).
* **Co-location is King:** I put related things (loaders, actions, components, types) in a single file to minimize context switching.
* **Uniformity:** Explicit duplication (WET) is better than premature abstraction. I prefer doing the same thing the same way every time to reduce decision fatigue.

## d: Data & State Philosophy

* **One DB to Rule Them All:** I use Postgres for *everything* (Data, Auth, Background Jobs).
* **Foreign Keys Enforce Reality:** I rely on the database engine to enforce data integrity, not application logic. The database is the final arbiter of truth.
* **Normalization until Pain:** I normalize data to avoid inconsistency. I only denormalize when performance metrics prove it is necessary.
* **Seed Data is Documentation:** The `seed.ts` file is the truest documentation of the data model. If I can't spin up a populated dev environment in one command, the project is broken.

## a: The Agentic Workflow

* **Division of Labor:** I focus on the hard parts (architecture, complex logic) and let AI agents handle the grunt work, boilerplate, and easy features.
* **Robot-Readability:** I make design choices that help Agents. "Boring" code, explicit configuration (no magic), and strong types provide the best context/feedback for LLMs.
* **Explicit > Implicit:** I prefer explicit routing (`routes.ts`) over file-system routing because it reduces hallucinations and is easier for machines to read.
* **Types as Feedback:** I use TypeScript not for purity, but as a fast feedback loop for both myself and the Agent.

## i: Tactical Implementation Rules

* **Ice-Cone Testing:** I embrace "Ice-Cone" testing (heavy on Playwright E2E, light/none on Unit tests) because E2E tests verify actual value and are less brittle to change.
* **Python as a Specialist:** Python is a first-class citizen but *only* for AI/Compute tasks (RPC, not REST). All web logic stays in TypeScript.
* **No Custom CSS:** I use Tailwind and Shadcn exclusively to eliminate design decisions and CSS maintenance.
* **Admin via CLI:** User provisioning happens via CLI/SSH (`manage-users.ts`). The UI is for the customer, not for me to manage the system.
* **Secrets Management:** Secrets live in `.env` files and environment variables. They are never hardcoded.
* **Full Files:** When generating code, I output the full file. Partial diffs are error-prone for agents and humans alike.

## p: Communication & Professionalism

* **No Fluff:** I hate fluff. Get to the point.
* **Scientific & Critical:** I value the scientific method and precise language.
* **Documentation is for "Why", not "How":** The code explains *how* it works. The comments/docs explain *why* I made this specific decision (business context, constraints).
* **Assume Competence:** The target audience (and my future self) is an experienced developer. I do not over-explain basic concepts.