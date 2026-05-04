const BACKENDURI=import.meta.env.VITE_BACKEND_URI

const BASE_URL = `${BACKENDURI}/api`;
console.log("BACKENDURI:", BACKENDURI);
console.log("BASE_URL:", BASE_URL);

const Api={
    AuditionSubmit: {
        url: `${BASE_URL}/audition`,
        method: "POST"
    },
    AuditionFetch: {
        url: `${BASE_URL}/audition`,
        method: "GET"
    },
    AuditionUpdateStatus: {
        url: `${BASE_URL}/audition/:id`,
        method: "PUT"
    },
    AuditionConfigGet: {
        url: `${BASE_URL}/audition/config`,
        method: "GET"
    },
    AuditionConfigUpdate: {
        url: `${BASE_URL}/audition/config`,
        method: "PUT"
    },
    IdeaSubmission:{
        url:`${BASE_URL}/ideasubmission`,
        method:"POST"
    },
    EnquirySubmission:{
        url:`${BASE_URL}/enquirysubmission`,
        method:"POST"
    },
    WebinarFetch:{
        url:`${BASE_URL}/webinars`,
        method:"GET"
    },
    EventFetch:{
        url:`${BASE_URL}/events`,
        method:"GET"
    },
    EventCreate:{
        url:`${BASE_URL}/events`,
        method:"POST"
    },
    EventUpdate:{
        url:`${BASE_URL}/events/:id`,
        method:"PUT"
    },
    EventClose:{
        url:`${BASE_URL}/events/:id/close`,
        method:"PATCH"
    },
    EventById:{
        url:`${BASE_URL}/events/:id`,
        method:"GET"
    },
    EventRegistrationSubmit:{
        url:`${BASE_URL}/events/:eventId/registrations`,
        method:"POST"
    },
    EventRegistrationsByEvent:{
        url:`${BASE_URL}/events/:eventId/registrations`,
        method:"GET"
    },
    EventRegistrationPublicList:{
        url:`${BASE_URL}/events/:eventId/registrations/public`,
        method:"GET"
    },
    EventRegistrationApprove:{
        url:`${BASE_URL}/registrations/:id/approve`,
        method:"PATCH"
    },
    EventRegistrationReject:{
        url:`${BASE_URL}/registrations/:id/reject`,
        method:"PATCH"
    },
    WebsiteVisit:{
        url:`${BASE_URL}/website_count`,
        method:"GET"
    },
    Update_count:{
        url:`${BASE_URL}/update_count`,
        method:"GET"
    },
    EventRegistration:{
        url:`${BASE_URL}/eventregistration`,
        method:"POST"
    },
    // Webinar/event management endpoints
    WebinarUpdate:{
        url:`${BASE_URL}/webinars/:id`,
        method:"PUT"
    },
    WebinarDelete:{
        url:`${BASE_URL}/webinars/:id`,
        method:"DELETE"
    },
    CarouselImageFetch:{
        url:`${BASE_URL}/carousel-images`,
        method:"GET"
    },
    CarouselImageSubmit:{
        url:`${BASE_URL}/carousel-images`,
        method:"POST"
    },
    GalleryFetch:{
        url:`${BASE_URL}/gallery`,
        method:"GET"
    },
    GallerySubmit:{
        url:`${BASE_URL}/gallery`,
        method:"POST"
    },
    // Password Reset endpoints
    ForgotPassword:{
        url:`${BASE_URL}/auth/forgot-password`,
        method:"POST"
    },
    VerifyOTP:{
        url:`${BASE_URL}/auth/verify-otp`,
        method:"POST"
    },
    ResetPassword:{
        url:`${BASE_URL}/auth/reset-password`,
        method:"POST"
    }
}

export default Api