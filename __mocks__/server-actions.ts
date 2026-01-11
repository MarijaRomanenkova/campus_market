// Mock server actions
export const calculateInvoiceTotal = jest.fn().mockResolvedValue({ total: 100 });
export const createInvoice = jest.fn().mockResolvedValue({ id: 'mock-invoice-id' });
export const signUpUser = jest.fn().mockResolvedValue({ success: true });
export const signInWithCredentials = jest.fn().mockResolvedValue({ success: true });
export const signOutUser = jest.fn().mockResolvedValue({});
export const updateProfile = jest.fn().mockResolvedValue({ success: true });
export const verifyEmail = jest.fn().mockResolvedValue({ success: true });
export const resetPassword = jest.fn().mockResolvedValue({ success: true }); 
