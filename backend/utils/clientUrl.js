export const clientUrl = () =>
  String(process.env.CLIENT_URL || '').split(',')[0].trim().replace(/\/$/, '');

