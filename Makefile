IMPORT_PATH = $(shell echo `pwd` | sed "s|^$(GOPATH)/src/||g")
APP_NAME = $(shell echo $(IMPORT_PATH) | sed 's:.*/::')
APP_VERSION = 0.1
TARGET = ./$(APP_NAME)-$(APP_VERSION)
GO_FILES = $(shell find . -type f -name "*.go")
PID = .pid

build: clean $(TARGET)

clean:
	@rm -rf $(TARGET)

$(TARGET): $(GO_FILES)
	@go build -race -o $@

kill:
	@kill `cat $(PID)` || true

serve: clean restart
	@printf "\n\nWaiting for the file change\n\n"
	@fswatch --event=Updated $(GO_FILES) | xargs -n1 -I{} make restart || make kill

restart: kill $(TARGET)
	@printf "\n\nrestart the app .........\n\n"
	@$(TARGET) -debug & echo $$! > $(PID)
