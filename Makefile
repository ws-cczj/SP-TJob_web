# 项目名称
PROJECT_NAME = SP-TJob_web

# 添加伪目标，即使目标名称与文件名相同，也不会因为文件存在而跳过执行以下命令中的一个
.PHONY: dev build install default help

# 默认操作
default: dev

# 打包项目
build:
	@echo "Build project: $(PROJECT_NAME)"
	pnpm run build

# 启动开发服务器
dev:
	@echo "project: $(PROJECT_NAME) server started"
	pnpm run dev

# 清理打包产物
clean:
	rm -rf dist

# 安装依赖
install:
	pnpm install

help:
	@echo "Usage:"
	@echo "  make dev - start local development server"
	@echo "  make build - build project for release deployment"
	@echo "  make preview - preview the build"
	@echo "  make clean - clean the build artifacts"
	@echo "  make install - install dependencies"