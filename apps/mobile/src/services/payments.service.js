import http from '../api/http';

export const getPaymentHistory = async () => {
  const { data } = await http.get('/service-requests/payments/history');
  return data;
};

