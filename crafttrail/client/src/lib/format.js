export const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
export const km = (n) => (n < 1 ? `${Math.round(n * 1000)} m` : `${n} km`);
export const shortDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const todayPlus = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
export const firstName = (n = '') => n.trim().split(' ')[0];
