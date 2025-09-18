import vm from "vm";
import fs from "fs";
import path from "path";

export async function execute({ command, agentConfig }) {
  if (!command) throw new Error("No command provided.");
  
  // Security check: only allow permitted commands
  const permitted = (agentConfig.permitted_shell_commands || []).some((p) =>
    new RegExp("^" + p.replace(/\*/g, ".*") + "$").test(command)
  );
  
  if (!permitted)
    throw new Error(
      `Security policy violation: Command "${command}" not permitted for @${agentConfig.alias}.`
    );

  try {
    // Create a more secure sandbox environment
    const sandbox = {
      // Allow access to common JavaScript globals
      console: {
        log: (...args) => {
          // Capture console output
          sandbox.__output__ += args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ') + '\n';
        }
      },
      Math,
      Date,
      String,
      Number,
      Boolean,
      Array,
      Object,
      RegExp,
      JSON,
      // Add a limited file system access (read-only)
      fs: {
        readFileSync: (filePath, encoding = 'utf8') => {
          // Only allow reading files within the current working directory
          const resolvedPath = path.resolve(filePath);
          const cwd = process.cwd();
          
          // Security check: ensure the file is within the current working directory
          if (!resolvedPath.startsWith(cwd)) {
            throw new Error(`Access denied: ${filePath} is outside the allowed directory`);
          }
          
          return fs.readFileSync(filePath, encoding);
        },
        existsSync: (filePath) => {
          const resolvedPath = path.resolve(filePath);
          const cwd = process.cwd();
          
          // Security check: ensure the file is within the current working directory
          if (!resolvedPath.startsWith(cwd)) {
            return false;
          }
          
          return fs.existsSync(filePath);
        }
      },
      path,
      __output__: ''
    };

    // Remove potentially dangerous globals
    const forbiddenGlobals = [
      'process', 'require', 'module', 'exports', 'global', '__dirname', '__filename',
      'eval', 'Function', 'setTimeout', 'setInterval', 'setImmediate',
      'clearTimeout', 'clearInterval', 'clearImmediate'
    ];
    
    // Create a script from the command
    const script = new vm.Script(command);
    
    // Create a context with the sandbox
    const context = vm.createContext(sandbox);
    
    // Remove forbidden globals from the context
    for (const globalName of forbiddenGlobals) {
      context[globalName] = undefined;
    }
    
    // Execute the script with a timeout
    const result = script.runInContext(context, { timeout: 5000 });
    
    // Return the captured output and result
    return `OUTPUT:
${sandbox.__output__}

RESULT:
${result !== undefined ? JSON.stringify(result, null, 2) : 'undefined'}`;
  } catch (error) {
    // Handle timeout errors specifically
    if (error.message.includes('Script execution timed out')) {
      return `EXECUTION FAILED: Command execution timed out after 5 seconds`;
    }
    return `EXECUTION FAILED: ${error.message}`;
  }
}