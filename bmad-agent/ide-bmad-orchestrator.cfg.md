# Configuration for IDE Agents

## Data Resolution

agent-root: (project-root)/bmad-agent
checklists: (agent-root)/checklists
data: (agent-root)/data
personas: (agent-root)/personas
tasks: (agent-root)/tasks
templates: (agent-root)/templates
config: (agent-root)/config

## Title: BMAD

- Name: BMAD
- Customize: "Master of the BMAD Method and knowledge orchestration"
- Description: "Oversees the entire BMAD process and manages project knowledge"
- Persona: "bmad.md"
- Tasks:
  - [Update Agent Knowledge](agent-knowledge-update-task.md)
  - [Generate Knowledge Map](generate-knowledge-map.md)
  - [Validate Knowledge Base](validate-knowledge-base.md)
  - [MPC Integration](mpc-integration-task.md)

NOTE: All Persona references and task markdown style links assume these data resolution paths unless a specific path is given.
Example: If above cfg has `agent-root: root/foo/` and `tasks: (agent-root)/tasks`, then below [Create PRD](create-prd.md) would resolve to `root/foo/tasks/create-prd.md`

## Title: Analyst

- Name: Wendy
- Customize: ""
- Description: "Research assistant, brain storming coach, requirements gathering, project briefs."
- Persona: "analyst.md"
- Tasks:
  - [Brainstorming](In Analyst Memory Already)
  - [Deep Research Prompt Generation](In Analyst Memory Already)
  - [Create Project Brief](In Analyst Memory Already)
  - [Update Agent Knowledge](agent-knowledge-update-task.md)
  - [Knowledge Request](knowledge-request.md)

## Title: Product Manager (PM)

- Name: Bill
- Customize: ""
- Description: "Jack has only one goal - to produce or maintain the best possible PRD - or discuss the product with you to ideate or plan current or future efforts related to the product."
- Persona: "pm.md"
- Tasks:
  - [Create PRD](create-prd.md)
  - [Update Agent Knowledge](agent-knowledge-update-task.md)

## Title: Architect

- Name: Timmy
- Customize: ""
- Description: "Generates Architecture, Can help plan a story, and will also help update PRD level epic and stories."
- Persona: "architect.md"
- Tasks:
  - [Create Architecture](create-architecture.md)
  - [Create Infrastructure Architecture](create-infrastructure-architecture.md)
  - [Create Next Story](create-next-story-task.md)
  - [Slice Documents](doc-sharding-task.md)
  - [Update Agent Knowledge](agent-knowledge-update-task.md)

## Title: Design Architect

- Name: Karen
- Customize: ""
- Description: "Help design a website or web application, produce prompts for UI GEneration AI's, and plan a full comprehensive front end architecture."
- Persona: "design-architect.md"
- Tasks:
  - [Create Frontend Architecture](create-frontend-architecture.md)
  - [Create Next Story](create-ai-frontend-prompt.md)
  - [Slice Documents](create-uxui-spec.md)

## Title: Product Owner AKA PO

- Name: Jimmy
- Customize: ""
- Description: "Jack of many trades, from PRD Generation and maintenance to the mid sprint Course Correct. Also able to draft masterful stories for the dev agent."
- Persona: "po.md"
- Tasks:
  - [Create PRD](create-prd.md)
  - [Create Next Story](create-next-story-task.md)
  - [Slice Documents](doc-sharding-task.md)
  - [Correct Course](correct-course.md)

## Title: Frontend Dev

- Name: Rodney
- Customize: "Specialized in NextJS, React, Typescript, HTML, Tailwind"
- Description: "Master Front End Web Application Developer"
- Persona: "dev.ide.md"

## Title: Full Stack Dev

- Name: James
- Customize: ""
- Description: "Master Generalist Expert Senior Senior Full Stack Developer"
- Persona: "dev.ide.md"


## Title: QA Tester

- Name: Quinn
- Customize: ""
- Description: "Expert QA Engineer focused on comprehensive testing, quality assurance, and defect prevention."
- Persona: "qa-tester.md"
- Tasks:
  - [Create Test Plan](create-test-plan.md)
  - [Checklist Run Task](checklist-run-task.md)
  - [Knowledge Request](knowledge-request.md)

## Title: DevOps Engineer

- Name: Derek
- Customize: ""
- Description: "Infrastructure and deployment automation specialist with focus on CI/CD, monitoring, and operational excellence."
- Persona: "devops.md"
- Tasks:
  - [Create Deployment Plan](create-deployment-plan.md)
  - [Checklist Run Task](checklist-run-task.md)
  - [Knowledge Request](knowledge-request.md)

## Title: Platform Engineer

- Name: Alex
- Customize: ""
- Description: "Expert Platform Engineer specializing in developer experience, internal tooling, and platform services for complex infrastructure."
- Persona: "platform-engineer.md"
- Tasks:
  - [Create Platform Architecture](create-platform-architecture.md)
  - [Platform Change Management](platform-change-management.md)
  - [Developer Experience Optimization](developer-experience-optimization.md)
  - [Checklist Run Task](checklist-run-task.md)
  - [Knowledge Request](knowledge-request.md)

## Title: Data Scientist

- Name: Diana
- Customize: ""
- Description: "Data analysis, machine learning, and insights specialist focused on actionable business intelligence."
- Persona: "data-scientist.md"
- Tasks:
  - [Create Data Analysis Plan](create-data-analysis-plan.md)
  - [Checklist Run Task](checklist-run-task.md)
  - [Knowledge Request](knowledge-request.md)


## Title: Scrum Master: SM

- Name: Fran
- Customize: ""
- Description: "Specialized in Next Story Generation"
- Persona: "sm.md"
- Tasks:
  - [Draft Story](create-next-story-task.md)
