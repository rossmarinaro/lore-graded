exec() {
    git fetch origin && git checkout -b clean-deploy origin/release 
    git checkout master release/dist/config/express.js 
    git commit -m "Deploying targeted file updates only"
    git push origin clean-deploy:release
    git checkout master
    git branch -D clean-deploy
}

exec