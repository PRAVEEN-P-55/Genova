import { Router } from 'express';
import multer from 'multer';
import { CONFIG } from '../config/index.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

import * as authController from '../controllers/authController.js';
import * as samplesController from '../controllers/samplesController.js';
import * as taxonomyController from '../controllers/taxonomyController.js';
import * as biodiversityController from '../controllers/biodiversityController.js';
import * as alertsController from '../controllers/alertsController.js';
import * as predictionsController from '../controllers/predictionsController.js';
import * as assistantController from '../controllers/assistantController.js';
import * as reportsController from '../controllers/reportsController.js';

const upload = multer({ dest: CONFIG.UPLOAD_DIR });
export const apiRouter = Router();

// 1. Auth routes
apiRouter.post('/auth/login', authController.login);
apiRouter.get('/auth/me', authMiddleware, authController.getCurrentUser);
apiRouter.get('/auth/demo-users', authController.getDemoUsers);

// 2. Samples routes
apiRouter.get('/samples', samplesController.getAllSamples);
apiRouter.get('/samples/:id', samplesController.getSampleById);
apiRouter.get('/samples/:id/status', samplesController.getSampleStatus);
apiRouter.post('/samples/upload', optionalAuthMiddleware, upload.single('file'), samplesController.uploadSample);

// 3. Taxonomy routes
apiRouter.get('/taxonomy/:sampleId', taxonomyController.getSampleTaxonomy);
apiRouter.get('/taxonomy/species/:id', taxonomyController.getSpeciesDetail);

// 4. Biodiversity routes
apiRouter.get('/biodiversity/dashboard', biodiversityController.getBiodiversityDashboard);
apiRouter.get('/biodiversity/sites', biodiversityController.getAllSites);

// 5. Alerts routes
apiRouter.get('/alerts', alertsController.getAllAlerts);
apiRouter.post('/alerts/:id/acknowledge', optionalAuthMiddleware, alertsController.acknowledgeAlert);
apiRouter.post('/alerts/:id/resolve', optionalAuthMiddleware, alertsController.resolveAlert);

// 6. Predictions routes
apiRouter.get('/predictions/:siteId', predictionsController.getSitePrediction);
apiRouter.post('/predictions/simulate', predictionsController.simulateScenario);

// 7. AI Assistant / RAG routes
apiRouter.post('/assistant/chat', optionalAuthMiddleware, assistantController.chatWithAssistant);
apiRouter.get('/assistant/history', optionalAuthMiddleware, assistantController.getChatHistory);

// 8. Reports routes
apiRouter.get('/reports', reportsController.getAllReports);
apiRouter.post('/reports/generate', optionalAuthMiddleware, reportsController.generateReport);
