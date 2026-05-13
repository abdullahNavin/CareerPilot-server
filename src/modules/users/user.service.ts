import { prisma } from '../../config/db.js';
import { uploadFile } from '../../services/cloudinary.service.js';

export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
  });
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true },
  });

  if (!user) throw { statusCode: 404, message: 'User not found' };
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const updateUser = async (id: string, data: any) => {
  const { name, bio, education, skills, experience, github, linkedin, portfolio } = data;

  const profileData: any = {};
  if (education !== undefined) profileData.education = education;
  if (skills !== undefined) profileData.skills = skills;
  if (experience !== undefined) profileData.experience = experience;
  if (github !== undefined) profileData.github = github;
  if (linkedin !== undefined) profileData.linkedin = linkedin;
  if (portfolio !== undefined) profileData.portfolio = portfolio;

  const userUpdateData: any = {};
  if (name !== undefined) userUpdateData.name = name;
  if (bio !== undefined) userUpdateData.bio = bio;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...userUpdateData,
      profile: Object.keys(profileData).length > 0
        ? { upsert: { create: profileData, update: profileData } }
        : undefined,
    },
    include: { profile: true },
  });

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const deleteUser = async (id: string) => {
  await prisma.user.delete({ where: { id } });
  return null;
};

export const uploadAvatar = async (id: string, file: any) => {
  let avatarUrl: string;

  if (file?.buffer) {
    // Real upload via Cloudinary service
    avatarUrl = await uploadFile(file.buffer as Buffer, file.originalname, 'avatar', id);
  } else {
    // Fallback mock for when multer is not configured
    avatarUrl = `https://mock-cloudinary.com/avatars/${id}-${Date.now()}.png`;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { avatar: avatarUrl },
  });

  return { avatarUrl: user.avatar };
};

export const getUserAiResults = async (id: string) => {
  return prisma.aIResult.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
  });
};

