import { Router } from 'express';
import { verifyAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler as h } from '../middleware/errorHandler.js';
import {
  getAllBookingsAdmin, getAllConsultationsAdmin, getDashboardStats,
  updateBooking, deleteBooking, bulkDeleteBookings, deleteConsultation,
  getServicesAdmin, createService, updateService, deleteService, approveBooking,
  getQuizMapAdmin, updateQuizMap
} from '../controllers/admin.controller.js';
import { createBookingAdmin, bulkUpdateStatus } from '../controllers/adminBookings.controller.js';
import { login, verifyLogin } from '../controllers/adminAuth.controller.js';
import { getSettingsAdmin, saveSettingsAdmin, sendTestNotification } from '../controllers/settings.controller.js';
import { getCustomerMeta, saveCustomerMeta } from '../controllers/crm.controller.js';
import {
  listGiftCardsAdmin, createGiftCardAdmin, spendGiftCard, undoGiftUse,
  extendGiftCard, resendGiftCard, voidGiftCard
} from '../controllers/adminGiftCards.controller.js';
import { getConsentsAdmin, deleteConsent } from '../controllers/consent.controller.js';
import { getCustomersAdmin } from '../controllers/user.controller.js';
import { getTrashAdmin, restoreFromTrash, deleteFromTrash } from '../controllers/trash.controller.js';
import { getAuditLog } from '../utils/audit.js';
import { downloadBackup } from '../utils/backup.js';
import { login, verifyLogin, forgotPassword, resetPassword, changePassword } from '../controllers/adminAuth.controller.js';

const router = Router();

router.post('/login', h(login));
router.post('/login/verify', h(verifyLogin));
router.post('/forgot', h(forgotPassword));
router.post('/reset', h(resetPassword));
router.use(verifyAdmin); // iske neeche sab routes admin token maangte hain
router.post('/password', h(changePassword));
router.get('/stats', h(getDashboardStats));
router.get('/backup', h(downloadBackup));
router.get('/settings', h(getSettingsAdmin));
router.put('/settings', h(saveSettingsAdmin));
router.post('/notifications/test', h(sendTestNotification));
router.get('/bookings', h(getAllBookingsAdmin));
router.post('/bookings', h(createBookingAdmin));
router.post('/bookings/bulk-delete', h(bulkDeleteBookings));
router.post('/bookings/bulk-status', h(bulkUpdateStatus));
router.patch('/bookings/:id/approve', h(approveBooking));
router.patch('/bookings/:id', h(updateBooking));
router.delete('/bookings/:id', h(deleteBooking));
router.get('/consultations', h(getAllConsultationsAdmin));
router.delete('/consultations/:id', h(deleteConsultation));
router.get('/quiz-map', h(getQuizMapAdmin));
router.put('/quiz-map', h(updateQuizMap));
router.get('/services', h(getServicesAdmin));
router.post('/services', h(createService));
router.patch('/services/:id', h(updateService));
router.delete('/services/:id', h(deleteService));
router.get('/consents', h(getConsentsAdmin));
router.delete('/consents/:id', h(deleteConsent));
router.get('/customers', h(getCustomersAdmin));
router.get('/customer-meta', h(getCustomerMeta));
router.put('/customers/:email/meta', h(saveCustomerMeta));
router.get('/gift-cards', h(listGiftCardsAdmin));
router.post('/gift-cards', h(createGiftCardAdmin));
router.post('/gift-cards/:id/use', h(spendGiftCard));
router.delete('/gift-cards/:id/uses/:rid', h(undoGiftUse));
router.patch('/gift-cards/:id', h(extendGiftCard));
router.post('/gift-cards/:id/resend', h(resendGiftCard));
router.post('/gift-cards/:id/void', h(voidGiftCard));
router.get('/trash', h(getTrashAdmin));
router.post('/trash/:id/restore', h(restoreFromTrash));
router.delete('/trash/:id', h(deleteFromTrash));
router.get('/audit-log', h(getAuditLog));

export default router;