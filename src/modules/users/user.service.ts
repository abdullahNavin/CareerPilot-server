import { prisma } from '../../config/db.js';
import { Role } from '@prisma/client';

export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true },
  });

  if (!user) throw { statusCode: 404, message: 'User not found' };
  
  // Omit password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const updateUser = async (id: string, data: any) => {
  const { name, bio, ...profileData } = data;
  
  const user = await prisma.user.update({
    where: { id },
    data: {
      name,
      bio,
      profile: {
        upsert: {
          create: profileData,
          update: profileData,
        },
      },
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
  // Mock upload implementation
  const mockUrl = `https://mock-cloudinary.com/avatar-${id}.png`;
  
  const user = await prisma.user.update({
    where: { id },
    data: { avatar: mockUrl },
  });

  return { avatarUrl: user.avatar };
};

export const getUserAiResults = async (id: string) => {
  return prisma.aIResult.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
  });
};
