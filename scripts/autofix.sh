# typecheck, build, lint and test
# run claude to fix any issues

EXIT_CODE=0
npm run verify:routes && EXIT_CODE=$? || EXIT_CODE=1

if [ $EXIT_CODE -ne 0 ]; then
    claude --dangerously-skip-permissions "run npm run verify:routes and fix any issues until it works"
fi

EXIT_CODE=0
./scripts/lint.sh && EXIT_CODE=$? || EXIT_CODE=1

if [ $EXIT_CODE -ne 0 ]; then
    claude --dangerously-skip-permissions "run ./scripts/lint.sh and fix any issues until it works"
fi

EXIT_CODE=0
./scripts/test.sh && EXIT_CODE=$? || EXIT_CODE=1

if [ $EXIT_CODE -ne 0 ]; then
    claude --dangerously-skip-permissions "run ./scripts/test.sh and fix any issues until it works"
fi

EXIT_CODE=0
npx tsx ./scripts/check-routes.ts && EXIT_CODE=$? || EXIT_CODE=1

if [ $EXIT_CODE -ne 0 ]; then
    claude --dangerously-skip-permissions "run npx tsx ./scripts/check-routes.ts and fix any issues until it works"
fi

EXIT_CODE=0
npx tsx ./scripts/check-route-filenames.ts && EXIT_CODE=$? || EXIT_CODE=1

if [ $EXIT_CODE -ne 0 ]; then
    claude --dangerously-skip-permissions "run npx tsx ./scripts/check-route-filenames.ts and fix any issues until it works"
fi

EXIT_CODE=0
cd py && make typecheck && EXIT_CODE=$? || EXIT_CODE=1
cd ..

if [ $EXIT_CODE -ne 0 ]; then
    claude --dangerously-skip-permissions "run 'cd py && make typecheck' and fix any issues until it works"
fi

npm audit fix

exit $EXIT_CODE