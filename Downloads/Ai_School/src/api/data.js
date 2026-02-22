import api from './api';

export const getCourses = async () => {
  const response = await api.get('/courses');
  return response.data;
};

export const getLeaderboard = async (page = 1, limit = 10) => {
  const response = await api.get(`/leaderboard?page=${page}&limit=${limit}`);
  return response.data;
};

export const getUserStats = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const getWalletBalance = async () => {
  const response = await api.get('/wallet/balance');
  return response.data;
};
