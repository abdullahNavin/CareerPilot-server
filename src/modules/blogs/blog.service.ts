import { prisma } from '../../config/db.js';
import { getCache, setCache, delCache, redis } from '../../services/redis.service.js';

// Cache TTLs per PRD section 7.3
const BLOG_LIST_TTL = 10 * 60;   // 10 minutes
const BLOG_DETAIL_TTL = 60 * 60; // 60 minutes

const blogListKey = (q: string) => `cache:blogs:list:${q}`;
const blogDetailKey = (slug: string) => `cache:blogs:detail:${slug}`;

const invalidateBlogCache = async (slug?: string) => {
  if (slug) await delCache(blogDetailKey(slug));
  const keys = await redis.keys('cache:blogs:list:*');
  if (keys.length) await redis.del(...keys);
};

export const getAllBlogs = async (filters: any) => {
  const { page = 1, limit = 10, category, published = true } = filters;

  const cacheKey = blogListKey(JSON.stringify(filters));
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (published !== undefined) where.published = published === 'true' || published === true;
  if (category) where.category = category;

  const [data, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, avatar: true } } },
    }),
    prisma.blog.count({ where }),
  ]);

  const result = {
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };

  await setCache(cacheKey, result, BLOG_LIST_TTL);
  return result;
};

export const getBlogBySlug = async (slug: string) => {
  const cacheKey = blogDetailKey(slug);
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const blog = await prisma.blog.findUnique({
    where: { slug },
    include: { user: { select: { name: true, avatar: true, bio: true } } },
  });
  if (!blog) throw { statusCode: 404, message: 'Blog not found' };

  await setCache(cacheKey, blog, BLOG_DETAIL_TTL);
  return blog;
};

export const createBlog = async (userId: string, data: any) => {
  let slug = (data.slug || data.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const existing = await prisma.blog.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const blog = await prisma.blog.create({
    data: {
      ...data,
      slug,
      authorId: userId,
      thumbnail: data.thumbnail || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
    },
  });

  await invalidateBlogCache();
  return blog;
};

export const updateBlog = async (id: string, userId: string, role: string, data: any) => {
  const blog = await prisma.blog.findUnique({ where: { id } });
  if (!blog) throw { statusCode: 404, message: 'Blog not found' };
  if (blog.authorId !== userId && role !== 'ADMIN') {
    throw { statusCode: 403, message: 'Forbidden' };
  }

  let slug = blog.slug;
  if (data.title || data.slug) {
    slug = String(data.slug || data.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existing = await prisma.blog.findFirst({ where: { slug, id: { not: id } } });
    if (existing) slug = `${slug}-${Date.now()}`;
    data.slug = slug;
  }

  const updated = await prisma.blog.update({
    where: { id },
    data: {
      ...data,
      thumbnail: data.thumbnail === '' ? null : data.thumbnail,
      tags: Array.isArray(data.tags) ? data.tags : data.tags === undefined ? undefined : [],
    },
  });
  await invalidateBlogCache(blog.slug);
  if (data.slug && data.slug !== blog.slug) await invalidateBlogCache(data.slug);
  return updated;
};

export const deleteBlog = async (id: string) => {
  const blog = await prisma.blog.findUnique({ where: { id } });
  if (!blog) throw { statusCode: 404, message: 'Blog not found' };
  await prisma.blog.delete({ where: { id } });
  await invalidateBlogCache(blog.slug);
  return null;
};

export const getFeaturedBlogs = async () => {
  const cacheKey = 'cache:blogs:featured';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const blogs = await prisma.blog.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { user: { select: { name: true, avatar: true } } },
  });

  await setCache(cacheKey, blogs, BLOG_LIST_TTL);
  return blogs;
};

export const getCategories = async () => {
  const cacheKey = 'cache:blogs:categories';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const categories = await prisma.blog.groupBy({
    by: ['category'],
    where: { published: true },
    _count: { category: true },
  });

  const result = categories.map(c => ({ name: c.category, count: c._count.category }));
  await setCache(cacheKey, result, BLOG_LIST_TTL);
  return result;
};
