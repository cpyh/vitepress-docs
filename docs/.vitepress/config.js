import { readdirSync, existsSync } from 'fs';
import { resolve } from 'path';

// 1. 核心工具函数：获取单个项目的首页文件（优先 index.md，其次 README.md）
const getProjectHomeFile = (projectDir) => {
  const projectPath = resolve(__dirname, `../../docs/${projectDir}`);
  if (existsSync(resolve(projectPath, 'index.md'))) {
    return 'index.md';
  } else if (existsSync(resolve(projectPath, 'README.md'))) {
    return 'README.md';
  }
  return null; // 无首页文件时返回 null
};

// 2. 工具函数：获取 docs 下的所有有效项目目录（排除隐藏目录 + 有首页文件的目录）
const getValidProjectDirs = () => {
  const docsDir = resolve(__dirname, '../../docs');
  return readdirSync(docsDir, { withFileTypes: true })
    .filter(dirent => {
      // 条件1：是目录 + 不隐藏；条件2：有首页文件（index.md 或 README.md）
      if (!dirent.isDirectory() || dirent.name.startsWith('.')) return false;
      return !!getProjectHomeFile(dirent.name);
    })
    .map(dirent => dirent.name);
};

// 3. 自动生成导航栏（导航名用「项目名」，链接指向项目首页）
// 自动生成导航栏（优化为下拉菜单）
const generateNav = () => {
  const nav = [{ text: '总首页', link: '/' }];
  const projectDirs = getValidProjectDirs();

  // 项目少于3个时，直接平铺展示
  if (projectDirs.length <= 2) {
    projectDirs.forEach(dir => {
      const navText = dir.replace(/[-_]/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      nav.push({ text: navText, link: `/${dir}/` });
    });
  } 
  // 项目多于3个时，收纳到下拉菜单
  else {
    nav.push({
      text: '项目列表',
      items: projectDirs.map(dir => ({
        text: dir.replace(/[-_]/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        link: `/${dir}/`
      }))
    });
  }

  return nav;
};

// 4. 自动生成侧边栏（优先首页，再按文件名排序其他 md 文件）
const generateSidebar = () => {
  const sidebar = {};
  const projectDirs = getValidProjectDirs();
  
  // 处理每个项目的侧边栏
  projectDirs.forEach(dir => {
    const projectPath = resolve(__dirname, `../../docs/${dir}`);
    const homeFile = getProjectHomeFile(dir);
    const homeText = `${dir.replace(/[-_]/g, ' ')} 首页`; // 侧边栏首页名称
    
    // 扫描项目下的所有 md 文件（排除首页文件）
    const mdFiles = readdirSync(projectPath)
      .filter(file => {
        return file.endsWith('.md') && file !== homeFile;
      })
      // 按文件名排序（可选：也可按修改时间/自定义规则）
      .sort()
      .map(file => ({
        text: file.replace('.md', '') // 侧边栏文字 = 去掉后缀的文件名
                  .replace(/[-_]/g, ' ')
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' '),
        link: `/${dir}/${file}` // 侧边栏链接 = 项目目录 + 文件名
      }));
    
    // 组装侧边栏：首页 + 其他文档
    sidebar[`/${dir}/`] = [
      { text: homeText, link: `/${dir}/` }, // 项目首页（路由无文件名）
      ...mdFiles
    ];
  });
  
  // 站点总首页的侧边栏（简单配置）
  sidebar['/'] = [{ text: '总首页', link: '/' }];
  
  return sidebar;
};

// VitePress 核心配置
export default {
  title: '多项目文档中心',
  description: '自动生成导航，每个项目独立首页',
  base: '/vitepress-docs/', // 替换成你的仓库名
  themeConfig: {
    nav: generateNav(), // 自动导航
    sidebar: generateSidebar(), // 自动侧边栏
    sidebarMenuLabel: '本项目文档', // 侧边栏标题（可选）
    outlineTitle: '目录', // 大纲标题（可选）
  },
  // 可选：忽略非 md 文件，提升构建速度
  ignoreDeadLinks: true
};