.PHONY: dev start typecheck lint fmt install clean

PORT := 8123

dev: serve

serve:
	cd app && uv run python -m uvicorn app:app --reload --host 0.0.0.0 --port $(PORT)

typecheck:
	@echo "Compiling"
	uv run python -m compileall ./app/
	@echo "Type checking"
	uv run mypy app/

lint:
	uv run ruff check app/

fmt:
	uv run ruff format app/
	uv run ruff check --fix app/

install:
	uv sync

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
