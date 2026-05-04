const express = require("express");
const router = express.Router();

const EnquiryController=require('../Controller/Enquiry')
const IdeaController=require('../Controller/Innovation')
const WebinarController=require('../Controller/Webinar')
const EventController=require('../Controller/Event')
const EventRequestController=require('../Controller/EventRequest')
const Website_countController=require('../Controller/Website_count')
const EventRegistrationController=require('../Controller/EventRegistration')
const CarouselImage=require('../Controller/CarouselImage')
const Gallery=require('../Controller/Gallery')
const Audition=require('../Controller/audition')
const AuditionConfig=require('../Controller/AuditionConfig')
const Azure=require('../Controller/Azure')
const authRoutes = require('./auth')
const UserController = require('../Controller/User')
const authMiddleware = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

// Authentication routes
router.use('/auth', authRoutes);

// Public routes
router.get('/team-members', UserController.getTeamMembers);
router.get('/debug-users', UserController.getAllUsersDebug);

// User routes (protected)
router.get('/user/profile', authMiddleware, UserController.getUserProfile);
router.put('/user/profile', authMiddleware, UserController.updateUserProfile);
router.post('/user/change-password', authMiddleware, UserController.changePassword);

// Admin user management routes
router.post('/admin/users', authMiddleware, UserController.createUser);
router.get('/admin/users', authMiddleware, UserController.getAllUsers);
router.get('/admin/users-management', authMiddleware, UserController.getUsersForManagement);
router.get('/admin/users/:id', authMiddleware, UserController.getUserById);
router.put('/admin/users/:id', authMiddleware, UserController.updateUser);
router.put('/admin/users-management/:id', authMiddleware, UserController.updateUserManagement);
router.delete('/admin/users/:id', authMiddleware, UserController.deleteUser);

// Admin innovation management routes
router.get('/admin/innovations', authMiddleware, IdeaController.getAllInnovations);

//Carousel Image
router.get('/carousel-images', CarouselImage.getCarouselImages);
router.post('/carousel-images', authMiddleware, CarouselImage.submitCarouselImages);

//Gallery
router.get('/gallery', Gallery.getGallery);
router.post('/gallery', authMiddleware, Gallery.submitGallery);

// Webinar/Event routes (using Webinar schema)
router.post('/webinars', authMiddleware, WebinarController.createWebinar);
router.get('/webinars', WebinarController.WebinarFetch);
router.get('/webinars/categories', WebinarController.getWebinarCategories);
router.get('/webinars/:id', WebinarController.getWebinarById);
router.put('/webinars/:id', authMiddleware, WebinarController.updateWebinar);
router.delete('/webinars/:id', authMiddleware, WebinarController.deleteWebinar);

// Dedicated event module
router.get('/events', optionalAuth, EventController.getEvents);
router.post('/events', authMiddleware, EventController.createEvent);
router.get('/events/:id', optionalAuth, EventController.getEventById);
router.put('/events/:id', authMiddleware, EventController.updateEvent);
router.patch('/events/:id/close', authMiddleware, EventController.closeEvent);
router.get('/events/:id/registrations', authMiddleware, EventController.getEventRegistrations);

router.post('/events/:eventId/registrations', EventRequestController.submitRegistration);
router.get('/events/:eventId/registrations/public', EventRequestController.getEventPublicRegistrations);
router.get('/registrations/:id', authMiddleware, EventRequestController.getRegistrationById);
router.patch('/registrations/:id/approve', authMiddleware, EventRequestController.approveRegistration);
router.patch('/registrations/:id/reject', authMiddleware, EventRequestController.rejectRegistration);

// Legacy routes
router.post("/enquirysubmission",EnquiryController.sendEnquiry);
router.post("/ideasubmission",IdeaController.IdeaSubmission);
router.get("/website_count",Website_countController.Website_count);
router.get("/update_count",Website_countController.update_count);
router.post("/eventregistration",EventRegistrationController.EventRegistration);


// Audition config routes (feature toggle) - place BEFORE parameterized routes
router.get('/audition/config', AuditionConfig.getConfig);
router.put('/audition/config', authMiddleware, AuditionConfig.updateConfig);

// Audition routes
router.post("/audition", Audition.createAudition);
router.get("/audition", authMiddleware, Audition.getAllAuditions);
router.put("/audition/:id", authMiddleware, Audition.updateStatus);

// Azure file upload routes
router.post('/azure/upload', Azure.upload.single('file'), Azure.uploadToAzure);
router.get('/azure/test', Azure.testAzureConnection);

module.exports=router