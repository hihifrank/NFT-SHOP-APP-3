# 部署指南 / Deployment Guide

## 🚀 项目已成功上传到GitHub

项目地址：https://github.com/hihifrank/NFT-SHOP-APP-3

## 📋 部署清单

### ✅ 已完成的系统集成和部署功能

#### 9.1 CI/CD管道设置
- **GitHub Actions工作流** - 自动化测试、构建和部署
- **Docker配置** - 多阶段构建，生产环境优化
- **Kubernetes部署** - 完整的K8s清单文件
- **部署脚本** - 自动化部署和回滚脚本

#### 9.2 监控和日志系统
- **日志服务** - 结构化JSON格式日志
- **监控服务** - 应用性能监控和指标收集
- **告警系统** - 智能告警规则和外部集成
- **健康检查** - 存活性和就绪性探针
- **Prometheus集成** - 指标导出和Grafana仪表板

#### 9.3 端到端测试
- **完整用户流程测试** - 从注册到优惠券使用
- **跨平台兼容性测试** - 移动应用、Web浏览器和API
- **性能和负载测试** - 响应时间基准和压力测试
- **自动化测试运行器** - 综合测试报告

## 🛠️ 快速部署步骤

### 1. 本地开发环境

```bash
# 克隆项目
git clone https://github.com/hihifrank/NFT-SHOP-APP-3.git
cd NFT-SHOP-APP-3

# 安装依赖
npm install
cd mobile && npm install && cd ..

# 环境配置
cp .env.example .env
# 编辑 .env 文件配置数据库和区块链连接

# 启动开发服务器
npm run dev
```

### 2. Docker部署

```bash
# 构建Docker镜像
npm run docker:build

# 使用Docker Compose启动完整环境
docker-compose up -d

# 启动监控栈
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### 3. Kubernetes部署

```bash
# 应用所有Kubernetes资源
kubectl apply -f k8s/

# 部署到测试环境
npm run deploy:staging

# 部署到生产环境
npm run deploy:production
```

## 📊 监控和观察

### 访问监控界面

- **应用健康检查**: http://localhost:3000/health
- **API文档**: http://localhost:3000/api/docs
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin123)
- **AlertManager**: http://localhost:9093

### 关键指标

- API响应时间和错误率
- 数据库性能
- 区块链交易状态
- 用户参与度指标
- 系统资源使用情况

## 🧪 测试执行

### 运行所有测试

```bash
# 单元测试
npm run test:unit

# 集成测试
npm run test:integration

# 端到端测试
npm run test:e2e

# 性能测试
npm run test:e2e:performance

# 安全测试
npm run test:security
```

### 测试覆盖率

```bash
# 生成测试覆盖率报告
npm run test:coverage
```

## 📱 移动应用部署

### iOS部署

```bash
cd mobile

# 安装iOS依赖
npx pod-install ios

# 运行iOS应用
npm run ios

# 构建生产版本
npm run build:ios
```

### Android部署

```bash
cd mobile

# 运行Android应用
npm run android

# 构建生产版本
npm run build:android
```

## 🔐 安全配置

### 生产环境安全清单

- [ ] 配置HTTPS证书
- [ ] 设置防火墙规则
- [ ] 配置数据库访问控制
- [ ] 设置API速率限制
- [ ] 配置监控告警
- [ ] 备份策略设置

### 环境变量配置

```bash
# 生产环境必需的环境变量
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-jwt-secret
BLOCKCHAIN_PRIVATE_KEY=0x...
IPFS_PROJECT_ID=your-ipfs-id
IPFS_PROJECT_SECRET=your-ipfs-secret
```

## 🚨 故障排除

### 常见问题

1. **数据库连接错误**
   ```bash
   # 检查数据库状态
   pg_isready -h localhost -p 5432
   ```

2. **端口冲突**
   ```bash
   # 检查端口使用情况
   netstat -tulpn | grep :3000
   ```

3. **内存不足**
   ```bash
   # 增加Node.js内存限制
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

### 日志查看

```bash
# 查看应用日志
docker logs hk-retail-nft-api

# 查看Kubernetes Pod日志
kubectl logs -f deployment/hk-retail-nft-api -n hk-retail-nft-platform
```

## 📈 性能优化

### 数据库优化

- 索引优化
- 查询性能调优
- 连接池配置

### 缓存策略

- Redis缓存配置
- API响应缓存
- 静态资源CDN

### 负载均衡

- Kubernetes HPA配置
- 数据库读写分离
- 微服务架构

## 🔄 CI/CD流程

### GitHub Actions工作流

1. **代码推送触发**
2. **自动化测试执行**
3. **安全扫描**
4. **Docker镜像构建**
5. **部署到测试环境**
6. **生产环境部署**（需要手动批准）

### 部署策略

- **蓝绿部署**: 零停机时间部署
- **滚动更新**: 逐步替换实例
- **金丝雀发布**: 小流量测试

## 📞 支持和维护

### 监控告警

- 系统性能告警
- 错误率告警
- 安全事件告警
- 业务指标告警

### 备份策略

- 数据库定期备份
- 配置文件备份
- 代码版本控制

### 更新流程

1. 开发环境测试
2. 测试环境验证
3. 生产环境部署
4. 监控和回滚准备

## 🎯 下一步计划

- [ ] 设置生产环境监控
- [ ] 配置自动化备份
- [ ] 实施安全审计
- [ ] 性能优化调整
- [ ] 用户反馈收集

---

**项目状态**: ✅ 系统集成和部署完成
**GitHub地址**: https://github.com/hihifrank/NFT-SHOP-APP-3
**最后更新**: 2025年1月3日