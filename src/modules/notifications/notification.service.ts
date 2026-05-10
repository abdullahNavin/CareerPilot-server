import { prisma } from '../../config/db.js';
import { emitNotification } from '../../services/socket.service.js';

export const getUserNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const createNotification = async (userId: string, title: string, message: string) => {
  const notification = await prisma.notification.create({
    data: { userId, title, message },
  });
  
  // emit real-time event
  emitNotification(userId, notification);
  
  return notification;
};

export const markAsRead = async (id: string, userId: string) => {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) {
    throw { statusCode: 404, message: 'Notification not found' };
  }

  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
};

export const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return null;
};

export const deleteNotification = async (id: string, userId: string) => {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) {
    throw { statusCode: 404, message: 'Notification not found' };
  }

  await prisma.notification.delete({ where: { id } });
  return null;
};
