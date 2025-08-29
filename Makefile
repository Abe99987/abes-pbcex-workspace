# Usage:
#   make pdf2md FILE=./docs/Phase_1_3_4_B.pdf
#   make pdf2md FILE=./docs/Phase_1_3_4_B.pdf MEDIA=1

pdf2md:
	@if [ -z "$(FILE)" ]; then echo "Usage: make pdf2md FILE=./path/to/file.pdf [MEDIA=1]"; exit 1; fi; \
	if [ "$(MEDIA)" = "1" ]; then \
		bash scripts/pdf2md.sh "$(FILE)" --media; \
	else \
		bash scripts/pdf2md.sh "$(FILE)"; \
	fi

