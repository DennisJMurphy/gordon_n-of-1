// Minimal mock for react-native
module.exports = {
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj.ios },
  Share: { share: jest.fn().mockResolvedValue({ action: 'sharedAction' }) },
  Alert: { alert: jest.fn() },
  StyleSheet: { create: (styles: Record<string, unknown>) => styles },
};
