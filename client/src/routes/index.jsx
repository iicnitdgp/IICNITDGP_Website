import { createBrowserRouter } from 'react-router-dom';
import App from '../App.jsx';
// import Headroom from "react-headroom";
import Home from './../pages/Home/Home.jsx';
import Guidelines from './../pages/Guidelines/Guidelines.jsx';
import Team from './../pages/Team/Team.jsx';
import FAQ from './../pages/FAQ/FAQ.jsx';
import Error from './../layouts/Error/Error.jsx';
import Gallery from '../pages/Gallery/Gallery.jsx';
import Login from '../authentication/Login/Login.jsx';
import Profile from '../pages/Profile/Profile.jsx';
import ProtectedRoute from '../component/ProtectedRoute/ProtectedRoute.jsx';
import Activity from '../pages/Activity/Activity.jsx';
import Collaboration from '../pages/Collaboration/Collaboration.jsx';
import Ai2Summit from '../pages/Ai2Summit/Ai2Summit.jsx'
import Hackathon from '../pages/Hackathon/Hackathon.jsx';
import Audition from '../components/Audition/audition.jsx';
import EventRegistrationPage from '../pages/EventRegistration/EventRegistration.jsx';
import ScrollToTop from '../helper/ScrollToTop';

const router = createBrowserRouter([
    {
        path: "/",
        element: <ScrollToTop><App /></ScrollToTop>,
        children: [
            {
                path: '/',
                element: <Home />
            },

            {
                path: '/guidelines',
                element: <Guidelines />
            },
            {
                path: '/team',
                element: <Team />
            },
            {
                path: '/faq',
                element: <FAQ />
            },
            {
                path: '/gallery',
                element: <Gallery />
            },
            {
                path: '/activity',
                element: <Activity />
            },
            {
                path: '/collaboration',
                element: <Collaboration />
            },
            {
                path: '/ai2summit',
                element: <Ai2Summit />
            },
            {
                path: '/hackathon',
                element: <Hackathon />
            },
            {
                path: '/login',
                element: <Login />
            },
            {
                path: '/profile',
                element: (
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                )
            },
            {
                path: '/audition',
                element: <Audition />
            },
            {
                path: '/event/registration/:eventId',
                element: <EventRegistrationPage />
            },
            {
                path: '*',
                element: <Error />
            }
        ],
        
    }
]);

export default router;