# 会议助手 - 后端接口需求

## 通信架构

```
┌─────────────────┐     IPC      ┌─────────────┐   executeJS   ┌─────────────────┐
│  meeting.html   │ ──────────▶  │   main.js   │ ───────────▶  │ webview (chat)  │
│  (会议窗口)      │ ◀──────────  │   (主进程)   │ ◀───────────  │  复用登录态      │
└─────────────────┘              └─────────────┘               └─────────────────┘
```

**说明：** 通过 JSBridge 在主窗口 webview 中发起 API 请求，复用当前登录用户的 Cookie/Token 权限。

---

## 后端接口规格

### 1. 创建会议

```
POST /api/meeting/create
```

**请求：**
```json
{
  "title": "会议标题（可选）"
}
```

**响应：**
```json
{
  "meetingId": "meeting_xxx",
  "status": "created"
}
```

---

### 2. 提交音频片段

```
POST /api/meeting/{meetingId}/audio
Content-Type: multipart/form-data
```

**请求：**
| 字段 | 类型 | 说明 |
|------|------|------|
| audio | Blob | webm/opus 格式音频 |
| sequence | number | 片段序号 |
| timestamp | number | 时间戳(ms) |

**响应：**
```json
{
  "speaker": "张三",
  "transcript": "识别出的文字内容...",
  "summary": "实时更新的摘要（可选）"
}
```

---

### 3. 结束会议

```
POST /api/meeting/{meetingId}/end
```

**请求：** 空

**响应：**
```json
{
  "finalSummary": "完整会议摘要",
  "duration": 3600,
  "transcriptUrl": "完整转录文件下载地址（可选）"
}
```

---

## JSBridge 实现方案

### Web 端（需后端注入或前端配合）

在 chat.ecnu.edu.cn 页面中暴露：

```javascript
window.ChatECNU = {
  meeting: {
    create: async (title) => { /* fetch /api/meeting/create */ },
    submitAudio: async (meetingId, formData) => { /* fetch /api/meeting/{id}/audio */ },
    end: async (meetingId) => { /* fetch /api/meeting/{id}/end */ }
  }
};
```

### Electron 端调用示例

```javascript
// main.js
async function callWebAPI(method, ...args) {
  const webview = mainWindow.webContents;
  const result = await webview.executeJavaScript(
    `window.ChatECNU.meeting.${method}(${JSON.stringify(args).slice(1, -1)})`
  );
  return result;
}

// IPC 处理
ipcMain.handle('meeting-create', async (event, title) => {
  return await callWebAPI('create', title);
});
```

---

## 音频规格

| 参数 | 值 |
|------|-----|
| 格式 | audio/webm;codecs=opus |
| 采样率 | 16000 Hz |
| 码率 | 64 kbps |
| 切片间隔 | 5 秒 |

---

## 错误码

| Code | 说明 |
|------|------|
| 401 | 未登录/登录过期 |
| 403 | 无权限 |
| 404 | 会议不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

