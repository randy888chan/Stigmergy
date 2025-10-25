// database/migrations/001-initial-schema.js
import { logger } from "../src/utils/logger.js";

export const description = "Initial schema setup for core project entities";

/**
 * @param {import('neo4j-driver').Driver} driver
 */
export async function up(driver) {
  const session = driver.session();
  try {
    logger.info("Applying migration: 001-initial-schema");
    logger.info("Creating constraints for Project nodes...");
    await session.run(
      "CREATE CONSTRAINT project_name_unique IF NOT EXISTS FOR (p:Project) REQUIRE p.name IS UNIQUE"
    );

    logger.info("Creating constraints for CodeNode nodes...");
    await session.run(
      "CREATE CONSTRAINT codenode_path_unique IF NOT EXISTS FOR (c:CodeNode) REQUIRE c.path IS UNIQUE"
    );

    logger.info("Creating constraints for Agent nodes...");
    await session.run(
      "CREATE CONSTRAINT agent_id_unique IF NOT EXISTS FOR (a:Agent) REQUIRE a.id IS UNIQUE"
    );

    logger.info("Creating full-text search index on CodeNode...");
    await session.run(`
      CREATE FULLTEXT INDEX codeNodeTextIndex IF NOT EXISTS FOR (n:CodeNode) ON EACH [n.content, n.summary]
    `);

    logger.info("Successfully applied migration: 001-initial-schema");
  } catch (error) {
    logger.error(`Error applying migration 001-initial-schema: ${error.message}`);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * @param {import('neo4j-driver').Driver} driver
 */
export async function down(driver) {
  const session = driver.session();
  try {
    logger.info("Reverting migration: 001-initial-schema");

    logger.info("Dropping full-text search index on CodeNode...");
    await session.run("DROP INDEX codeNodeTextIndex IF EXISTS");

    logger.info("Dropping constraint for Agent nodes...");
    await session.run("DROP CONSTRAINT agent_id_unique IF EXISTS");

    logger.info("Dropping constraint for CodeNode nodes...");
    await session.run("DROP CONSTRAINT codenode_path_unique IF EXISTS");

    logger.info("Dropping constraint for Project nodes...");
    await session.run("DROP CONSTRAINT project_name_unique IF EXISTS");

    logger.info("Successfully reverted migration: 001-initial-schema");
  } catch (error) {
    logger.error(`Error reverting migration 001-initial-schema: ${error.message}`);
    throw error;
  } finally {
    await session.close();
  }
}
