import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import {
  CategorySchema,
  ProjectSchema,
  ProjectEnvSchema,
  LinkSchema,
  type Category,
  type Project,
  type ProjectEnv,
  type Link
} from '../src/types/index';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 读取并解析 YAML 文件
 */
function loadYaml<T>(filePath: string): T {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return yaml.load(fileContent) as T;
}

/**
 * 校验分类数据
 */
function validateCategories(categories: unknown[]): ValidationResult {
  const errors: string[] = [];

  try {
    const parsed = CategorySchema.array().safeParse(categories);
    if (!parsed.success) {
      parsed.error.errors.forEach((err) => {
        errors.push(`Category validation error: ${err.path.join('.')} - ${err.message}`);
      });
      return { valid: false, errors };
    }

    // 检查 ID 唯一性
    const ids = parsed.data.map((c) => c.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate category IDs: ${duplicateIds.join(', ')}`);
    }
  } catch (error) {
    errors.push(`Failed to parse categories: ${error}`);
    return { valid: false, errors };
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 校验项目数据
 */
function validateProjects(projects: unknown[]): ValidationResult {
  const errors: string[] = [];

  try {
    const parsed = ProjectSchema.array().safeParse(projects);
    if (!parsed.success) {
      parsed.error.errors.forEach((err) => {
        errors.push(`Project validation error: ${err.path.join('.')} - ${err.message}`);
      });
      return { valid: false, errors };
    }

    // 检查 ID 唯一性
    const ids = parsed.data.map((p) => p.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate project IDs: ${duplicateIds.join(', ')}`);
    }

    // 检查 name 唯一性
    const names = parsed.data.map((p) => p.name);
    const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      errors.push(`Duplicate project names: ${duplicateNames.join(', ')}`);
    }
  } catch (error) {
    errors.push(`Failed to parse projects: ${error}`);
    return { valid: false, errors };
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 校验项目环境数据
 */
function validateProjectEnvs(envs: unknown[], categoryIds: string[], projectIds: string[]): ValidationResult {
  const errors: string[] = [];

  try {
    const parsed = ProjectEnvSchema.array().safeParse(envs);
    if (!parsed.success) {
      parsed.error.errors.forEach((err) => {
        errors.push(`ProjectEnv validation error: ${err.path.join('.')} - ${err.message}`);
      });
      return { valid: false, errors };
    }

    // 检查 projectId 是否存在
    const invalidProjectIds = parsed.data
      .map((e) => e.projectId)
      .filter((id) => !projectIds.includes(id));
    if (invalidProjectIds.length > 0) {
      errors.push(`ProjectEnv references non-existent projectIds: ${[...new Set(invalidProjectIds)].join(', ')}`);
    }

    // 检查 projectId + env 组合唯一性
    const combinations = parsed.data.map((e) => `${e.projectId}-${e.env}`);
    const duplicateCombinations = combinations.filter((combo, index) => combinations.indexOf(combo) !== index);
    if (duplicateCombinations.length > 0) {
      errors.push(`Duplicate projectId-env combinations: ${[...new Set(duplicateCombinations)].join(', ')}`);
    }
  } catch (error) {
    errors.push(`Failed to parse project-envs: ${error}`);
    return { valid: false, errors };
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 校验链接数据
 */
function validateLinks(links: unknown[], categoryIds: string[]): ValidationResult {
  const errors: string[] = [];

  try {
    const parsed = LinkSchema.array().safeParse(links);
    if (!parsed.success) {
      parsed.error.errors.forEach((err) => {
        errors.push(`Link validation error: ${err.path.join('.')} - ${err.message}`);
      });
      return { valid: false, errors };
    }

    // 检查 ID 唯一性
    const ids = parsed.data.map((l) => l.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate link IDs: ${duplicateIds.join(', ')}`);
    }

    // 检查 categoryId 是否存在（如果指定了）
    const linksWithCategory = parsed.data.filter((l) => l.categoryId);
    const invalidCategoryIds = linksWithCategory
      .map((l) => l.categoryId!)
      .filter((id) => !categoryIds.includes(id));
    if (invalidCategoryIds.length > 0) {
      errors.push(`Link references non-existent categoryIds: ${[...new Set(invalidCategoryIds)].join(', ')}`);
    }
  } catch (error) {
    errors.push(`Failed to parse links: ${error}`);
    return { valid: false, errors };
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 主校验函数
 */
function main() {
  console.log('🔍 开始校验数据文件...\n');

  const dataDir = path.join(process.cwd(), 'data');
  const allErrors: string[] = [];

  // 读取所有数据文件
  try {
    const categories = loadYaml<Category[]>(path.join(dataDir, 'categories.yaml'));
    const projects = loadYaml<Project[]>(path.join(dataDir, 'projects.yaml'));
    const projectEnvs = loadYaml<ProjectEnv[]>(path.join(dataDir, 'project-envs.yaml'));
    const links = loadYaml<Link[]>(path.join(dataDir, 'links.yaml'));

    // 校验各个文件
    console.log('📂 校验 categories.yaml...');
    const categoryResult = validateCategories(categories);
    if (!categoryResult.valid) {
      allErrors.push(...categoryResult.errors);
    } else {
      console.log('  ✅ categories.yaml 校验通过');
    }

    console.log('\n📂 校验 projects.yaml...');
    const projectResult = validateProjects(projects);
    if (!projectResult.valid) {
      allErrors.push(...projectResult.errors);
    } else {
      console.log('  ✅ projects.yaml 校验通过');
    }

    console.log('\n📂 校验 project-envs.yaml...');
    const categoryIds = categories.map((c) => c.id);
    const projectIds = projects.map((p) => p.id);
    const envResult = validateProjectEnvs(projectEnvs, categoryIds, projectIds);
    if (!envResult.valid) {
      allErrors.push(...envResult.errors);
    } else {
      console.log('  ✅ project-envs.yaml 校验通过');
    }

    console.log('\n📂 校验 links.yaml...');
    const linkResult = validateLinks(links, categoryIds);
    if (!linkResult.valid) {
      allErrors.push(...linkResult.errors);
    } else {
      console.log('  ✅ links.yaml 校验通过');
    }

    // 校验项目的 categoryId 是否都存在
    console.log('\n📂 校验项目的外键关系...');
    const invalidCategoryIds = projects
      .map((p) => p.categoryId)
      .filter((id) => !categoryIds.includes(id));
    if (invalidCategoryIds.length > 0) {
      allErrors.push(`Projects reference non-existent categoryIds: ${[...new Set(invalidCategoryIds)].join(', ')}`);
    } else {
      console.log('  ✅ 所有项目的 categoryId 都有效');
    }
  } catch (error) {
    allErrors.push(`Failed to read data files: ${error}`);
  }

  // 输出结果
  console.log('\n' + '='.repeat(60));
  if (allErrors.length === 0) {
    console.log('✅ 所有数据文件校验通过！');
    process.exit(0);
  } else {
    console.error('❌ 数据校验失败！\n');
    allErrors.forEach((error, index) => {
      console.error(`  ${index + 1}. ${error}`);
    });
    console.error(`\n共 ${allErrors.length} 个错误`);
    process.exit(1);
  }
}

main();
