import { prisma } from '../../config/db.js';
import slugify from 'slugify'; // TODO: I need to install this or mock it

export const getAllBlogs = async (filters: any) => {
  const { page = 1, limit = 10, category, published = true } = filters;
  const skip = (page - 1) * limit;

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

  return {
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getBlogBySlug = async (slug: string) => {
  const blog = await prisma.blog.findUnique({
    where: { slug },
    include: { user: { select: { name: true, avatar: true, bio: true } } },
  });
  if (!blog) throw { statusCode: 404, message: 'Blog not found' };
  return blog;
};

export const createBlog = async (userId: string, data: any) => {
  let slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  // ensure slug uniqueness
  const existing = await prisma.blog.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  return prisma.blog.create({
    data: {
      ...data,
      slug,
      authorId: userId,
    },
  });
};

export const updateBlog = async (id: string, userId: string, role: string, data: any) => {
  const blog = await prisma.blog.findUnique({ where: { id } });
  if (!blog) throw { statusCode: 404, message: 'Blog not found' };
  
  if (blog.authorId !== userId && role !== 'ADMIN') {
    throw { statusCode: 403, message: 'Forbidden' };
  }

  let slug = blog.slug;
  if (data.title) {
    slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existing = await prisma.blog.findFirst({ where: { slug, id: { not: id } } });
    if (existing) slug = `${slug}-${Date.now()}`;
    data.slug = slug;
  }

  return prisma.blog.update({
    where: { id },
    data,
  });
};

export const deleteBlog = async (id: string) => {
  await prisma.blog.delete({ where: { id } });
  return null;
};

export const getFeaturedBlogs = async () => {
  return prisma.blog.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { user: { select: { name: true, avatar: true } } },
  });
};

export const getCategories = async () => {
  const categories = await prisma.blog.groupBy({
    by: ['category'],
    where: { published: true },
    _count: { category: true },
  });
  return categories.map(c => ({ name: c.category, count: c._count.category }));
};
