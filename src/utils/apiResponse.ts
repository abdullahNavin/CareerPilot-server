export const apiResponse = (success: boolean, message: string, data: any = null, pagination: any = null) => {
  const response: any = { success, message };
  if (data) response.data = data;
  if (pagination) response.pagination = pagination;
  return response;
};
