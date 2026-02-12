# useChatPage Hook

这个hook整合了聊天页面的所有业务逻辑，将hooks和UI完全分离。

## 功能

`useChatPage` hook整合了以下功能：

1. **消息管理** - 通过`useChatMessages`处理消息的发送、接收和更新
2. **图片上传** - 通过`useChatImageUpload`处理图片的选择和上传
3. **图片生成** - 通过`useChatImageGeneration`处理AI图片生成
4. **输入处理** - 通过`useChatInput`处理用户输入
5. **URL参数处理** - 自动处理来自URL的初始查询参数
6. **导航和认证** - 处理登录跳转和登出逻辑

## 返回值

```typescript
interface UseChatPageReturn {
  // 消息相关
  messages: any[];
  streaming: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;

  // 图片相关
  images: any[];
  selectedImage: string | null;
  currentImage: any;
  generatingMsgIds: Set<string>;
  lightboxUrl: string | null;
  setSelectedImage: (id: string) => void;
  setLightboxUrl: (url: string | null) => void;

  // 输入相关
  input: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  handleTextareaInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  createKeyDownHandler: (onSend: () => void) => (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;

  // 图片上传相关
  pendingImage: any;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePendingImage: () => void;
  triggerFileSelect: () => void;

  // 操作相关
  handleSend: (text?: string, imageUrlsOverride?: string[]) => Promise<void>;
  handleLogout: () => void;
}
```

## 使用示例

```tsx
import { useChatPage } from "@/hooks/chat";

function ChatPageContent() {
  const {
    messages,
    streaming,
    messagesEndRef,
    images,
    selectedImage,
    currentImage,
    lightboxUrl,
    setSelectedImage,
    setLightboxUrl,
    input,
    textareaRef,
    handleTextareaInput,
    createKeyDownHandler,
    pendingImage,
    fileInputRef,
    handleImageSelect,
    removePendingImage,
    handleSend,
  } = useChatPage();

  return (
    <div>
      {/* 使用返回的值和函数渲染UI */}
    </div>
  );
}
```

## 内部实现

hook内部协调了以下子hooks：

- `useChatMessages` - 消息管理
- `useChatImageUpload` - 图片上传
- `useChatImageGeneration` - 图片生成
- `useChatInput` - 输入处理

所有的业务逻辑都封装在这个hook中，UI组件只需要接收props并渲染即可。

## 优势

1. **关注点分离** - UI和业务逻辑完全分离
2. **可测试性** - hook可以独立测试
3. **可复用性** - 可以在不同的UI实现中复用相同的逻辑
4. **可维护性** - 业务逻辑集中在一处，易于理解和修改
