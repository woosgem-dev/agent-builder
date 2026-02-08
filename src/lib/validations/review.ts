import { z } from 'zod';

export const CreateReviewSchema = z.object({
  rating: z
    .number()
    .int('정수만 입력 가능합니다')
    .min(1, '최소 1점입니다')
    .max(5, '최대 5점입니다'),
  comment: z.string().max(2000, '리뷰는 2000자 이내로 작성해주세요').optional(),
});

export const UpdateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(2000).optional(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;
