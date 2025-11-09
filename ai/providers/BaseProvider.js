export class BaseProvider {
constructor(config) {
if (this.constructor === BaseProvider) {
throw new Error("Abstract classes can't be instantiated.");
}
this.config = config;
}
getClient() {
throw new Error("Method 'getClient()' must be implemented.");
}
}