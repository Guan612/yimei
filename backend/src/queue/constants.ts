/**
 * 队列名称常量
 */
export const QUEUE_NAMES = {
  IMAGE_GENERATION: 'image-generation',
  TEXT_GENERATION: 'text-generation',
} as const;

/**
 * 任务类型常量
 */
export const JOB_TYPES = {
  GENERATE_IMAGE: 'generate-image',
  INPAINT_IMAGE: 'inpaint-image',
  GENERATE_TEXT: 'generate-text',
} as const;
