#!/bin/bash

# 1. Run the build in your current project
echo "🔨 Running build..."
npm run build

#copy modified package.json to dist 
cp package.json dist
cp assets/logo.png dist

if [ ! -d "dist" ]; then
  echo "❌ Error: dist directory does not exist."
  exit 1
fi

echo "✅ Build successful. Isolating assets..."

# 2. Get the remote repository URL of your current project
REMOTE_URL=$(git config --get remote.origin.url)

# 3. Create a pristine, temporary directory outside your project structure
TMP_DIR=$(mktemp -d)

# 4. Copy ONLY the contents of your dist folder to the temp directory
cp -R dist/* "$TMP_DIR"

# 5. Move into the temp directory and turn it into its own isolated Git repo
cd "$TMP_DIR"
git init
git checkout -b release

# 6. Commit every file directly at the root level
git add .
git commit -m "deploy: static build $(date +'%Y-%m-%d %H:%M:%S')"

# 7. Force push directly to the remote release branch
echo "🚀 Pushing isolated files straight to remote release branch..."
git remote add origin "$REMOTE_URL"
git push origin release --force

# 8. Clean up the temporary folder from your machine
rm -rf "$TMP_DIR"

echo "🎉 Deployment complete! The remote release branch has been cleanly updated."
