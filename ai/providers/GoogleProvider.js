import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { BaseProvider } from "./BaseProvider.js";

export class GoogleProvider extends BaseProvider {
getClient() {
return createGoogleGenerativeAI({
apiKey: this.config.apiKey,
});
}
}