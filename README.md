# Pheromind: The Autonomous Development System

Pheromind is an autonomous development system that translates your strategic vision into production-ready applications. It operates as a local AI engine, powering agents directly within your IDE.

You are the architect; the swarm is your workshop.

## How It Works

Pheromind now runs as a local server engine. When you interact with an agent in a compatible IDE (like Roo Code), the IDE sends your request to the local engine. The engine orchestrates the entire workflow—calling the LLM, using tools to read and write files, analyzing your code, and running commands—before returning the final result to your IDE.

## Installation & Setup

### Step 1: Install Dependencies

Clone the repository and install the required packages.
```bash
git clone https://github.com/randy888chan/Stigmergy.git
cd Stigmergy
npm install
