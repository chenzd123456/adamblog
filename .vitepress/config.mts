import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'
import markdownItPangu from 'markdown-it-pangu'
import footnote from 'markdown-it-footnote'
import { RSSOptions, RssPlugin } from 'vitepress-plugin-rss'
import { imageCompressPlugin } from './plugins/image-compress'
import { relatedPostsPlugin } from './plugins/related-posts'
import { readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'
import matter from 'gray-matter'
import { MermaidMarkdown, MermaidPlugin } from 'vitepress-plugin-mermaid'

// 导入主题的配置
import { blogTheme } from './blog-theme'

const SITE_URL = 'https://adamblog.thiz.top'
const SITE_NAME = 'Adam的博客'

// RSS 订阅源配置
const RSS: RSSOptions = {
  title: SITE_NAME,
  baseUrl: SITE_URL,
  description: 'Adam的技术博客，分享编程、AI工具、流体仿真、信创等技术实践与学习心得',
  copyright: `Copyright © 2024-${new Date().getFullYear()} Adam`,
}

// 从 ./series/*.md 读取系列索引数据（frontmatter）
function loadSeriesData(): { id: string; name: string; description: string; articles: { title: string; link: string; order: number }[] }[] {
  const seriesDir = resolve(process.cwd(), 'series')
  const result: { id: string; name: string; description: string; articles: { title: string; link: string; order: number }[] }[] = []

  let files: string[]
  try {
    files = readdirSync(seriesDir)
  } catch {
    console.error('[series] 无法读取 ./series/ 目录')
    return result
  }

  for (const file of files) {
    if (!file.endsWith('.md') || file === 'index.md') continue

    try {
      const filePath = resolve(seriesDir, file)
      const content = readFileSync(filePath, 'utf-8')
      const { data: frontmatter } = matter(content)

      if (frontmatter.id && frontmatter.articles) {
        result.push({
          id: frontmatter.id,
          name: frontmatter.name || frontmatter.id,
          description: frontmatter.description || '',
          articles: frontmatter.articles,
        })
      }
    } catch (error) {
      console.error(`[series] 无法加载 ${file}:`, error)
    }
  }

  return result
}

// 预计算系列列表，注入到主题配置中
const precomputedSeriesList = loadSeriesData()

console.log(`[series] 预计算 ${precomputedSeriesList.length} 个系列`)

export default defineConfig({
  // 继承博客主题(@sugarat/theme)
  extends: blogTheme,

  lang: 'zh-cn',
  title: SITE_NAME,
  description: 'Adam的技术博客，分享编程、AI工具、流体仿真等技术实践与学习心得',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'author', content: 'Adam' }],
  ],

  themeConfig: {
    outline: {
      level: [2, 3],
      label: '目录'
    },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '相关文章',
    lastUpdatedText: '上次更新于',

    logo: '/images/avataaars.png',

    // 注入预计算的系列列表
    seriesList: precomputedSeriesList,

    nav: [
      { text: '首页', link: '/' },
      { text: '系列', link: '/series/' },
      { text: '关于', link: '/about' },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/adam-ikari' }
    ],

    editLink: {
      pattern: 'https://github.com/adam-ikari/adamblog/edit/main/:path',
      text: '在 GitHub 上编辑此页'
    },

    footer: {
      message: 'Released under the MIT License. · <a href="/terms">服务条款</a> · <a href="/privacy">隐私政策</a> · 客服邮箱：<a href="mailto:adam@moemail.app">adam@moemail.app</a>',
      copyright: `Copyright © 2024-${new Date().getFullYear()} Adam`
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    }
  },

  srcDir: '.',
  srcExclude: ['node_modules', 'convert.mjs', 'fix-paths.mjs', 'docs', 'CLAUDE.md', 'AGENTS.md', 'BRAIN.md'],

  lastUpdated: true,

  sitemap: {
    hostname: SITE_URL,
    lastmodDateOnly: true,
  },

  vite: {
    assetsInclude: ['**/*.JPG', '**/*.jpg', '**/*.png', '**/*.gif', '**/**/*.svg', '**/*.webp'],
    plugins: [RssPlugin(RSS), imageCompressPlugin(), relatedPostsPlugin(), MermaidPlugin()],
  },

  cleanUrls: true,

  markdown: {
    config(md) {
      md.use(mathjax3)
      md.use(markdownItPangu)
      md.use(footnote)
      md.use(MermaidMarkdown)
    },
  },

  transformPageData(pageData) {
    const relativePath = pageData.relativePath
    const isHome = relativePath === 'index.md'
    const isPost = relativePath.startsWith('posts/')

    // 为文章页面注入系列导航数据（prev/next）
    // 规则：根据 posts/xxx.md 的相对路径，去匹配 series/xxx.json 中 articles[].link
    // 用数组索引决定 prev/next，不再依赖 frontmatter.seriesOrder
    if (isPost) {
      const postSeries = pageData.frontmatter?.series

      if (postSeries) {
        const seriesIds = Array.isArray(postSeries) ? postSeries : [postSeries]
        // 文章路径：posts/xxx.md → /posts/xxx
        const postLink = '/' + relativePath.replace(/\.md$/, '')
        const seriesNav: { id: string; name: string; order: number; prev?: string; next?: string }[] = []

        for (let i = 0; i < seriesIds.length; i++) {
          const sid = seriesIds[i]
          if (!sid) continue

          // 查找系列数据（支持 series-xxx 和 xxx 两种前缀写法）
          const seriesData = precomputedSeriesList.find(
            s => s.id === sid || (typeof sid === 'string' && s.id === sid.replace(/^series-/, ''))
          )
          if (!seriesData) continue

          // 按 JSON 数组顺序排列，数组索引 + 1 作为 order
          const articles = seriesData.articles
          const currentIndex = articles.findIndex(a => a.link === postLink)
          if (currentIndex === -1) continue

          const order = currentIndex + 1
          const prev = currentIndex > 0 ? articles[currentIndex - 1].link : undefined
          const next = currentIndex < articles.length - 1 ? articles[currentIndex + 1].link : undefined

          seriesNav.push({ id: sid, name: seriesData.name, order, prev, next })
        }

        if (seriesNav.length > 0) {
          pageData.frontmatter.seriesNav = seriesNav
        }

        // 系列文章不在首页文章列表中显示
        pageData.frontmatter.hidden = true
      }
    }

    // 生成规范 URL
    const canonicalPath = relativePath
      .replace(/\.md$/, '')
      .replace(/\/index$/, '/')
    const canonicalUrl = `${SITE_URL}/${canonicalPath}`

    // 页面标题
    const title = pageData.frontmatter.layout === 'home'
      ? SITE_NAME
      : `${pageData.title} | ${SITE_NAME}`

    // 页面描述
    const description = pageData.description || pageData.frontmatter.description || 'Adam的技术博客，分享编程、AI工具、流体仿真等技术实践与学习心得'

    // 注入 head 标签
    pageData.frontmatter.head ??= []
    const head = pageData.frontmatter.head

    // Open Graph
    const ogImage = `${SITE_URL}/images/avataaars.png`
    head.push(['meta', { property: 'og:title', content: title }])
    head.push(['meta', { property: 'og:description', content: description }])
    head.push(['meta', { property: 'og:url', content: canonicalUrl }])
    head.push(['meta', { property: 'og:site_name', content: SITE_NAME }])
    head.push(['meta', { property: 'og:type', content: isHome ? 'website' : 'article' }])
    head.push(['meta', { property: 'og:locale', content: 'zh_CN' }])
    head.push(['meta', { property: 'og:image', content: ogImage }])

    // Twitter Card
    head.push(['meta', { name: 'twitter:card', content: 'summary_large_image' }])
    head.push(['meta', { name: 'twitter:title', content: title }])
    head.push(['meta', { name: 'twitter:description', content: description }])
    head.push(['meta', { name: 'twitter:image', content: ogImage }])

    // Canonical URL
    head.push(['link', { rel: 'canonical', href: canonicalUrl }])

    // JSON-LD 结构化数据
    if (isPost) {
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': pageData.title,
        'description': description,
        'author': {
          '@type': 'Person',
          'name': 'Adam',
          'url': SITE_URL,
        },
        'publisher': {
          '@type': 'Person',
          'name': 'Adam',
        },
        'url': canonicalUrl,
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
        'image': `${SITE_URL}/images/avataaars.png`,
      }
      if (pageData.frontmatter.date) {
        jsonLd.datePublished = pageData.frontmatter.date
      }
      head.push(['script', { type: 'application/ld+json' }, JSON.stringify(jsonLd)])

      // 面包屑结构化数据：首页 > (系列) > 文章
      const itemList: any[] = [{
        '@type': 'ListItem',
        position: 1,
        name: SITE_NAME,
        item: SITE_URL,
      }]
      const postSeries = pageData.frontmatter?.series
      const firstSeries = Array.isArray(postSeries) ? postSeries[0] : postSeries
      if (firstSeries) {
        // 获取系列名称：从 series.json 中查找
        let seriesName = '系列'
        try {
          const seriesData = precomputedSeriesList.find(s => s.id === firstSeries || s.id === firstSeries.replace(/^series-/, ''))
          seriesName = seriesData?.name || firstSeries
        } catch {
          seriesName = firstSeries
        }
        itemList.push({
          '@type': 'ListItem',
          position: 2,
          name: seriesName,
          item: `${SITE_URL}/series/${firstSeries}`,
        })
        itemList.push({
          '@type': 'ListItem',
          position: 3,
          name: pageData.title,
          item: canonicalUrl,
        })
      } else {
        itemList.push({
          '@type': 'ListItem',
          position: 2,
          name: pageData.title,
          item: canonicalUrl,
        })
      }
      head.push(['script', { type: 'application/ld+json' }, JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: itemList,
      })])
    } else if (isHome) {
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': SITE_NAME,
        'description': description,
        'url': SITE_URL,
      }
      head.push(['script', { type: 'application/ld+json' }, JSON.stringify(jsonLd)])
    }
  },

  buildEnd(siteConfig) {
    // 注入系列数据到主题配置（供 DynamicSeriesList 等组件使用）
    if (siteConfig.site?.themeConfig) {
      siteConfig.site.themeConfig.seriesList = precomputedSeriesList
    }

    console.log(`[series] 已加载 ${precomputedSeriesList.length} 个系列`)
  },
})
