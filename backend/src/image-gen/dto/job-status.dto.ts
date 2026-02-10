import { ApiProperty } from '@nestjs/swagger';

export class JobStatusResponseDto {
  @ApiProperty({ description: '任务ID' })
  jobId: string;

  @ApiProperty({
    description: '任务状态',
    enum: ['waiting', 'active', 'completed', 'failed', 'delayed', 'paused'],
  })
  status: string;

  @ApiProperty({ description: '任务进度 (0-100)', example: 50 })
  progress: number;

  @ApiProperty({ description: '任务结果（完成时）', required: false })
  result?: any;

  @ApiProperty({ description: '错误信息（失败时）', required: false })
  error?: string;

  @ApiProperty({ description: '任务创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '任务开始处理时间', required: false })
  processedAt?: Date;

  @ApiProperty({ description: '任务完成时间', required: false })
  finishedAt?: Date;
}

export class SubmitJobResponseDto {
  @ApiProperty({ description: '任务ID' })
  jobId: string;

  @ApiProperty({ description: '提示信息' })
  message: string;
}
