import fs from "fs-extra";
import path from "path";

export async function verify_business_alignment({ business_plan_path, keywords }) {
  try {
    const planContent = await fs.readFile(path.resolve(process.cwd(), business_plan_path), "utf-8");
    const missingKeywords = keywords.filter(
      (k) => !planContent.toLowerCase().includes(k.toLowerCase())
    );

    if (missingKeywords.length > 0) {
      return {
        verified: false,
        feedback: `The document at ${business_plan_path} is missing key business concepts: ${missingKeywords.join(", ")}`,
      };
    }
    return { verified: true, feedback: "All key business concepts are present." };
  } catch (error) {
    return { verified: false, feedback: `Error reading business plan: ${error.message}` };
  }
}
