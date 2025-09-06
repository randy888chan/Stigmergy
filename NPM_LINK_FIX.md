# NPM Link Permission Issue Fix

## Problem
When trying to run `npm link` in the Stigmergy repository, the following error occurred:
```
npm error code EACCES
npm error syscall rename
npm error path /usr/local/lib/node_modules/@randy888chan/stigmergy
npm error dest /usr/local/lib/node_modules/@randy888chan/.stigmergy-D6mm41LJ
npm error errno -13
npm error Error: EACCES: permission denied, rename '/usr/local/lib/node_modules/@randy888chan/stigmergy' -> '/usr/local/lib/node_modules/@randy888chan/.stigmergy-D6mm41LJ'
```

## Root Cause
The issue was caused by npm trying to write to the system-wide `/usr/local/lib/node_modules` directory, which requires administrator permissions. This happened because:
1. npm's prefix was set to `/usr/local`
2. The user was using nvm (Node Version Manager) which has its own configuration requirements

## Solution Implemented

### 1. Checked Current npm Configuration
```bash
npm config get prefix
# Output: /usr/local
```

### 2. Configured npm to Use User-Owned Directory
```bash
# Create a global directory in user's home folder
mkdir -p ~/.npm-global

# Configure npm to use this directory
npm config set prefix '~/.npm-global'
```

### 3. Updated PATH Environment Variable
Added the new npm global bin directory to PATH:
```bash
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

### 4. Fixed nvm Configuration Conflict
Since the user was using nvm, we needed to resolve the configuration conflict:
```bash
nvm use --delete-prefix v22.16.0 --silent
npm config delete prefix
npm config set prefix '~/.npm-global'
```

### 5. Successfully Linked the Package
After fixing the configuration, `npm link` completed successfully:
```bash
npm link
# Output: up to date, audited 3 packages in 5s
```

## Verification

### Checked stigmergy command availability:
```bash
which stigmergy
# Output: /Users/user/.npm-global/bin/stigmergy
```

### Tested stigmergy version:
```bash
stigmergy --version
# Output: 2.2.0
```

### Tested cross-directory functionality:
```bash
cd /Users/user/Documents/GitHub/gaming
stigmergy --version
# Output: 2.2.0 (with proper environment loading)
```

## Benefits of This Solution

1. **No Administrator Permissions Required**: The solution uses a user-owned directory instead of system directories
2. **Works with nvm**: Properly configured to work with Node Version Manager
3. **Persistent Configuration**: Changes are saved to npm configuration and shell profile
4. **Cross-Directory Compatibility**: stigmergy command works from any directory
5. **Environment Inheritance**: Properly loads environment configurations from both Stigmergy core and project directories

## Files Modified/Updated

1. **npm configuration**: Updated with `prefix` setting
2. **~/.zshrc**: Added PATH export for npm-global bin directory
3. **nvm configuration**: Resolved conflicts with npm prefix setting

## Troubleshooting Notes

If similar issues occur in the future, check:
1. `npm config get prefix` - Should point to a user-owned directory
2. `which node` - Should show nvm path if using nvm
3. PATH environment variable - Should include npm global bin directory
4. Directory permissions - Ensure user owns the npm global directory