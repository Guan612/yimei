import { inpaintImgApi } from './imagegen';
import { uploadFileApi, getFileUrlApi } from './upload';
import { generateMask, blobToFile } from '@/utils/maskGenerator';
import type { SelectionArea } from '@/store/facesim';
import type { InpaintImageRequest, JobSubmitResponse } from '@/type/imagegen';

/**
 * FaceSim 图片编辑 API
 */

export interface FaceSimEditParams {
  imageFile: File;
  selection: SelectionArea;
  prompt: string;
  negativePrompt?: string;
  configId?: number;
  provider?: 'stability' | 'openai' | 'auto';
  strength?: number;
  steps?: number;
  cfgScale?: number;
}

/**
 * 编辑图片的完整流程（返回 jobId）
 * 1. 上传原始图片
 * 2. 生成遮罩图
 * 3. 上传遮罩图
 * 4. 调用 inpaint API（异步任务）
 * 5. 返回 jobId
 *
 * @param params 编辑参数
 * @returns 任务提交响应
 */
export async function editImageApi(
  params: FaceSimEditParams
): Promise<JobSubmitResponse> {
  const {
    imageFile,
    selection,
    prompt,
    negativePrompt,
    configId,
    provider = 'auto',
    strength,
    steps,
    cfgScale,
  } = params;

  try {
    // 1. 上传原始图片
    const imageId = await uploadFileApi(imageFile);

    // 2. 生成遮罩图
    // 首先需要获取上传后的图片 URL
    const imageUrlRes = await getFileUrlApi(imageId);
    if (imageUrlRes.code !== 0 || !imageUrlRes.data) {
      throw new Error('获取图片 URL 失败');
    }

    const maskBlob = await generateMask(imageUrlRes.data.url, selection);
    const maskFile = blobToFile(maskBlob, 'mask.png');

    // 3. 上传遮罩图
    const maskId = await uploadFileApi(maskFile);

    // 4. 调用 inpaint API
    const inpaintRequest: InpaintImageRequest = {
      imageId,
      maskId,
      prompt,
      negativePrompt,
      configId,
      provider,
      strength,
      steps,
      cfgScale,
    };

    const result = await inpaintImgApi(inpaintRequest);

    if (result.code !== 0 || !result.data) {
      throw new Error(result.msg || '图片编辑任务提交失败');
    }

    return result.data;
  } catch (error) {
    console.error('FaceSim 编辑失败:', error);
    throw error;
  }
}
