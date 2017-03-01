call grunt build
git add --all
git commit -m %2
git push origin master
call npm version %1 --no-git-tag-version
call bower version %1
git push origin --tags
