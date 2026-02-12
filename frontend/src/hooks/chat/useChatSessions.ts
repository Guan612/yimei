import { useState, useEffect, useCallback } from 'react';
import {
  getUserSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
} from '@/api/chat';
import {
  ChatSessionListItem,
  ChatSessionDetail,
} from '@/type/chat';

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSessionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载会话列表
  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserSessions();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载会话列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建新会话
  const handleCreateSession = useCallback(
    async (title?: string, context?: 'facesim' | 'poster' | 'general') => {
      try {
        const newSession = await createSession({ title, context });
        await loadSessions();
        return newSession;
      } catch (err) {
        setError(err instanceof Error ? err.message : '创建会话失败');
        throw err;
      }
    },
    [loadSessions]
  );

  // 更新会话标题
  const handleUpdateSession = useCallback(
    async (sessionId: number, title: string) => {
      try {
        await updateSession(sessionId, { title });
        await loadSessions();
      } catch (err) {
        setError(err instanceof Error ? err.message : '更新会话失败');
        throw err;
      }
    },
    [loadSessions]
  );

  // 删除会话
  const handleDeleteSession = useCallback(
    async (sessionId: number) => {
      try {
        await deleteSession(sessionId);
        await loadSessions();
      } catch (err) {
        setError(err instanceof Error ? err.message : '删除会话失败');
        throw err;
      }
    },
    [loadSessions]
  );

  // 初始加载
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    loading,
    error,
    loadSessions,
    createSession: handleCreateSession,
    updateSession: handleUpdateSession,
    deleteSession: handleDeleteSession,
  };
}

export function useChatSession(sessionId: number | null) {
  const [session, setSession] = useState<ChatSessionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    if (!sessionId) {
      setSession(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getSessionById(sessionId);
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载会话详情失败');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return {
    session,
    loading,
    error,
    reload: loadSession,
  };
}
