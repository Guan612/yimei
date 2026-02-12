import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { useChatPage } from "@/hooks/chat";
import { ChatMessages, ChatInput, Canvas, Lightbox } from "@/components/chat";

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
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat Sidebar */}
        <div className="w-130 flex-shrink-0 flex flex-col border-r border-[var(--warm-gray-light)]/20 bg-white/60">
          <ChatMessages
            messages={messages}
            messagesEndRef={messagesEndRef}
            onSend={handleSend}
            setLightboxUrl={setLightboxUrl}
          />
          <ChatInput
            input={input}
            textareaRef={textareaRef}
            fileInputRef={fileInputRef}
            pendingImage={pendingImage}
            streaming={streaming}
            handleTextareaInput={handleTextareaInput}
            createKeyDownHandler={createKeyDownHandler}
            handleImageSelect={handleImageSelect}
            removePendingImage={removePendingImage}
            handleSend={() => handleSend()}
          />
        </div>

        {/* Right: Canvas */}
        <Canvas
          images={images}
          currentImage={currentImage}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          setLightboxUrl={setLightboxUrl}
        />
      </div>

      {/* Lightbox */}
      <Lightbox lightboxUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  )
}

function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-[var(--cream)]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-[var(--rose-gold)] to-[var(--rose-gold-light)] flex items-center justify-center animate-pulse">
            <span className="text-white text-lg font-light">A</span>
          </div>
          <p className="text-[var(--warm-gray)] text-xs">加载中...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}


export const Route = createFileRoute("/_app/chat")({
  component: ChatPage,
});
