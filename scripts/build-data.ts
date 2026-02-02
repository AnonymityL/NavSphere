import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import {
  type Category,
  type Project,
  type ProjectEnv,
  type Link,
  type NavigationItem,
  type CategoryBlock,
  type EnvType
} from '../src/types/index';

/**
 * 读取并解析 YAML 文件
 */
function loadYaml<T>(filePath: string): T {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return yaml.load(fileContent) as T;
}

/**
 * 获取环境的排序权重
 */
function getEnvOrder(env: EnvType): number {
  const orderMap: Record<EnvType, number> = {
    prod: 1,
    staging: 2,
    test: 3
  };
  return orderMap[env];
}

/**
 * 展开项目环境为导航项
 */
function expandNavigationItems(
  projects: Project[],
  projectEnvs: ProjectEnv[]
): NavigationItem[] {
  const items: NavigationItem[] = [];

  for (const project of projects) {
    const envs = projectEnvs.filter((e) => e.projectId === project.id);

    for (const env of envs) {
      items.push({
        id: `${project.id}-${env.env}`,
        projectId: project.id,
        projectName: project.name,
        projectDescription: project.description,
        categoryId: project.categoryId,
        env: env.env,
        url: env.url,
        envDescription: env.description,
        icon: project.icon,
        enabled: env.enabled,
        order: getEnvOrder(env.env)
      });
    }
  }

  return items;
}

/**
 * 按分类分组导航项
 */
function groupByCategory(
  categories: Category[],
  navigationItems: NavigationItem[]
): CategoryBlock[] {
  return categories.map((category) => {
    const items = navigationItems
      .filter((item) => item.categoryId === category.id && item.enabled)
      .sort((a, b) => {
        // 先按环境排序，再按项目名称排序
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        return a.projectName.localeCompare(b.projectName);
      });

    return {
      category,
      items
    };
  })
  .filter((block) => block.items.length > 0) // 移除空分类
  .sort((a, b) => {
    // 按 order 字段排序
    const aOrder = a.category.order ?? 999;
    const bOrder = b.category.order ?? 999;
    return aOrder - bOrder;
  });
}

/**
 * 主构建函数
 */
function build() {
  console.log('🔨 开始构建导航数据...\n');

  const dataDir = path.join(process.cwd(), 'data');

  // 读取所有数据文件
  const categories = loadYaml<Category[]>(path.join(dataDir, 'categories.yaml'));
  const projects = loadYaml<Project[]>(path.join(dataDir, 'projects.yaml'));
  const projectEnvs = loadYaml<ProjectEnv[]>(path.join(dataDir, 'project-envs.yaml'));

  // 展开导航项
  console.log('📦 展开项目环境为导航项...');
  const navigationItems = expandNavigationItems(projects, projectEnvs);
  console.log(`  ✅ 共生成 ${navigationItems.length} 个导航项`);

  // 按分类分组
  console.log('\n📂 按分类分组导航项...');
  const categoryBlocks = groupByCategory(categories, navigationItems);
  console.log(`  ✅ 共生成 ${categoryBlocks.length} 个分类块`);

  // 输出数据摘要
  console.log('\n📊 数据摘要：');
  categoryBlocks.forEach((block) => {
    console.log(`  📁 ${block.category.name}: ${block.items.length} 个导航项`);
  });

  // 保存到文件（供 Astro 构建时使用）
  const outputDir = path.join(process.cwd(), 'src', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, 'navigation.json');
  fs.writeFileSync(outputFile, JSON.stringify({ categoryBlocks }, null, 2));
  console.log(`\n💾 导航数据已保存到: ${outputFile}`);

  return { categoryBlocks, navigationItems };
}

// 运行构建
if (import.meta.url === `file://${process.argv[1]}`) {
  build();
}

export { build };
