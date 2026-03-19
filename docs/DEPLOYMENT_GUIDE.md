# 部署到免费平台指南

## 当前临时地址

**https://shopping-rating-roommate-carlos.trycloudflare.com**

> 这是临时地址，每次重启会变化。如需永久固定地址，请按以下步骤操作。

---

## 方案一：部署到 Vercel（推荐）

### 步骤：

1. **注册 GitHub 账号**
   - 访问 https://github.com
   - 注册一个免费账号

2. **上传代码到 GitHub**
   ```bash
   cd /home/z/my-project
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/love-agent.git
   git push -u origin main
   ```

3. **部署到 Vercel**
   - 访问 https://vercel.com
   - 使用 GitHub 账号登录
   - 点击 "New Project"
   - 选择你的 GitHub 仓库
   - 点击 "Deploy"

4. **获得永久地址**
   - 部署完成后，你会获得一个永久地址，如：
   - `https://love-agent-你的用户名.vercel.app`

---

## 方案二：部署到 Railway

### 步骤：

1. **注册 Railway 账号**
   - 访问 https://railway.app
   - 使用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的仓库

3. **配置环境变量**
   - 添加必要的环境变量

4. **获得永久地址**
   - Railway 会提供一个永久域名

---

## 方案三：部署到 Render

### 步骤：

1. **注册 Render 账号**
   - 访问 https://render.com
   - 使用 GitHub 账号登录

2. **创建 Web Service**
   - 点击 "New" → "Web Service"
   - 连接你的 GitHub 仓库

3. **配置**
   - Build Command: `npm run build`
   - Start Command: `npm start`

4. **获得永久地址**
   - Render 会提供一个永久域名

---

## 方案四：使用自己的域名 + Cloudflare Tunnel

### 步骤：

1. **购买域名**
   - 在阿里云、腾讯云、Cloudflare 等平台购买域名
   - 价格约 ¥10-50/年

2. **配置 Cloudflare**
   - 将域名 DNS 托管到 Cloudflare
   - 创建一个命名隧道

3. **运行隧道**
   ```bash
   cloudflared tunnel run love-agent
   ```

4. **获得永久地址**
   - 你的域名，如 `https://love-agent.你的域名.com`

---

## 推荐方案

| 方案 | 优点 | 缺点 |
|------|------|------|
| **Vercel** | 免费、快速、稳定 | 需要注册账号 |
| **Railway** | 免费、功能强大 | 免费额度有限 |
| **Render** | 免费、稳定 | 冷启动较慢 |
| **自定义域名** | 完全控制、永久 | 需要购买域名 |

---

## 当前系统状态

| 指标 | 数据 |
|------|------|
| 知识库 | 4,268条 |
| 训练速度 | 40条/分 |
| 对抗速度 | 20次/分 |
| 书籍数量 | 20本 |

---

## 需要帮助？

如果你需要帮助部署，请提供：
1. 你是否有 GitHub 账号
2. 你是否愿意购买域名

我可以提供更详细的指导。
