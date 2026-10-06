# Toxic Comment Detection — common tasks. Run `make help`.
PY_ML  := .venv-ml/bin/python
PY_API := .venv-api/bin/python

.PHONY: help setup data baseline train-kaggle train-local export sync model api web extension video test lint docker up

help:
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*## "}{printf "  \033[36m%-14s\033[0m %s\n",$$1,$$2}'

setup: ## Create Python venvs and install JS deps
	python3.12 -m venv .venv-ml && .venv-ml/bin/pip install -q -r ml/requirements.txt
	python3.12 -m venv .venv-api && .venv-api/bin/pip install -q -r api/requirements-dev.txt
	pnpm --dir web install && pnpm --dir extension install && pnpm --dir video install

data: ## Download Jigsaw + YouTube data (needs ~/.kaggle/kaggle.json) and build leak-free splits
	mkdir -p ml/data/raw && cd ml/data/raw && ../../../.venv-ml/bin/kaggle competitions download -c jigsaw-toxic-comment-classification-challenge && ../../../.venv-ml/bin/kaggle datasets download -d reihanenamdari/youtube-toxicity-data && for z in *.zip; do unzip -oq $$z; done && for z in *.csv.zip; do unzip -oq $$z; done
	cd ml && ../$(PY_ML) -m toxicity.data

baseline: ## TF-IDF baselines + reproduction of the v1 SMOTE leak
	cd ml && ../$(PY_ML) -m toxicity.baseline

train-kaggle: ## Train on a Kaggle T4 GPU, wait, and download the model to ml/artifacts/kaggle
	cd ml && ../$(PY_ML) kaggle/build_kernel.py && ./kaggle/wait_and_download.sh

train-local: ## Train on this machine (CUDA / Apple MPS / CPU)
	cd ml && ../$(PY_ML) -m toxicity.train

export: ## ONNX export + int8 quantisation + held-out evaluation
	cd ml && ../$(PY_ML) -m toxicity.export

sync: ## Copy the exported model into api/ + extension/, publish metrics to web/ and video/
	$(PY_ML) scripts/sync_artifacts.py

model: ## Download the released model instead of training
	scripts/fetch_model.sh

api: ## Run the API on :8000
	cd api && ../.venv-api/bin/uvicorn app.main:app --reload --port 8000

web: ## Run the website on :3000 (expects the API on :8000)
	pnpm --dir web dev

extension: ## Build the extension into extension/dist (load unpacked in chrome://extensions)
	pnpm --dir extension build

video: ## Render the launch video (needs the API running for demo scores)
	cd video && sh scripts/copy-audio.sh && node scripts/sync-data.mjs && pnpm render

test: ## API tests + extension/Python parity check
	cd api && ../$(PY_API) -m pytest -q

lint: ## Lint everything
	cd api && ../.venv-api/bin/ruff check . && ../.venv-api/bin/ruff format --check .
	pnpm --dir web lint && pnpm --dir web exec tsc --noEmit
	pnpm --dir video typecheck

docker: ## Build the API image
	docker build -t toxic-api api

up: ## Run API + web together with Docker Compose
	docker compose up --build
