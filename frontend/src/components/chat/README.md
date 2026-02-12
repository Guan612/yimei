# Chat Components

聊天页面的UI组件库，已从主页面中分离出来以提高代码可维护性。

## 组件列表

### ChatMessages
显示聊天消息列表，包括用户消息和AI回复。

**Props:**
- `messages`: 消息数组
- `messagesEndRef`: 滚动到底部的ref
- `onSend`: 发送消息的回调函数
- `setLightboxUrl`: 设置lightbox URL的函数

### ChatInput
聊天输入框组件，支持文本输入和图片上传。

**Props:**
- `input`: 当前输入文本
- `textareaRef`: 文本框ref
- `fileInputRef`: 文件输入ref
- `pendingImage`: 待上传的图片
- `streaming`: 是否正在流式传输
- `handleTextareaInput`: 处理文本输入的函数
- `createKeyDownHandler`: 创建键盘事件处理器
- `handleImageSelect`: 处理图片选择
- `removePendingImage`: 移除待上传图片
- `handleSend`: 发送消息的函数

### Canvas
画布组件，用于显示生成的图片。

**Props:**
- `images`: 图片数组
- `currentImage`: 当前显示的图片
- `selectedImage`: 当前选中的图片ID
- `setSelectedImage`: 设置选中图片的函数
- `setLightboxUrl`: 设置lightbox URL的函数

### Lightbox
图片放大查看组件。

**Props:**
- `lightboxUrl`: 要显示的图片URL
- `onClose`: 关闭lightbox的回调

### ImageProgress
图片生成进度显示组件。

**Props:**
- `loading`: 是否正在加载

## 使用示例

```tsx
import { ChatMessages, ChatInput, Canvas, Lightbox } from "@/components/chat";

function ChatPage() {
  // ... hooks logic

  return (
    <div>
      <ChatMessages {...messagesProps} />
      <ChatInput {...inputProps} />
      <Canvas {...canvasProps} />
      <Lightbox {...lightboxProps} />
    </div>
  );
}
```
