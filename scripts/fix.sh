# typecheck, build, lint and test
# run claude to fix any issues

EXIT_CODE=0
./scripts/lint.sh && EXIT_CODE=$? || EXIT_CODE=1

if [ $EXIT_CODE -ne 0 ]; then
    claude --dangerously-skip-permissions "run ./scripts/lint.sh and fix any issues until it works"
fi
