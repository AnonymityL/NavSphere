/**
 * 环境类型
 */
export type EnvType = 'TEST' | 'PRE' | 'PROD';

/**
 * 分类
 */
export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order?: number;
}

/**
 * 项目
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  icon?: string;
  order?: number;
}

/**
 * 项目环境
 */
export interface ProjectEnv {
  projectId: string;
  env: EnvType;
  url: string;
  description?: string;
  enabled: boolean;
}

/**
 * 通用链接
 */
export interface Link {
  id: string;
  name: string;
  url: string;
  description?: string;
  categoryId?: string;
  icon?: string;
  order?: number;
  enabled: boolean;
}

/**
 * 导航项（项目 × 环境的展开结果）
 */
export interface NavigationItem {
  id: string; // 组合 ID: `${projectId}-${env}`
  projectId: string;
  projectName: string;
  projectDescription?: string;
  categoryId: string;
  env: EnvType;
  url: string;
  envDescription?: string;
  icon?: string;
  enabled: boolean;
  order: number; // 排序权重：PROD > PRE > TEST
}

/**
 * 分类块（聚合后的数据结构）
 */
export interface CategoryBlock {
  category: Category;
  items: NavigationItem[];
}

/**
 * Zod Schemas
 */
import { z } from 'zod';

export const EnvTypeSchema = z.enum(['TEST', 'PRE', 'PROD']);

export const CategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0).optional()
});

export const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().min(1),
  icon: z.string().optional(),
  order: z.number().int().min(0).optional()
});

export const ProjectEnvSchema = z.object({
  projectId: z.string().min(1),
  env: EnvTypeSchema,
  url: z.string().url(),
  description: z.string().optional(),
  enabled: z.boolean().default(true)
});

export const LinkSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0).optional(),
  enabled: z.boolean().default(true)
});

export const NavigationItemSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  projectName: z.string().min(1),
  projectDescription: z.string().optional(),
  categoryId: z.string().min(1),
  env: EnvTypeSchema,
  url: z.string().url(),
  envDescription: z.string().optional(),
  icon: z.string().optional(),
  enabled: z.boolean(),
  order: z.number().int()
});
