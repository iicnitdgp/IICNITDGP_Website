import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loadUserFromStorage } from './store/slices/authSlice';
import UpcomingEventCard from './component/UpcomingEventCard/UpcomingEventCard.jsx';
import TopHeader from './layouts/TopHeader/topHeader.jsx'
import Header from './layouts/Header/header.jsx'
import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Footer from './layouts/Footer/Footer.jsx';
import Loading from './layouts/Loading/Loading.jsx';
import API from './common/api.js';
import './styles/globalStars.scss';
import ReadMore from './component/ReadMore/readmore.jsx';
import handleUpcomingEvents from './utils/handleUpcomingEvent.js';


const App = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [popupdata,setpopupdata] = useState(null);

  const dispatch = useDispatch();

  useEffect(()=>{
    
    const fetchevent = async()=>{
    try {
      const latestevent = await handleUpcomingEvents();
      if(latestevent!=null){
        setpopupdata(latestevent[0])
      }
    } catch (error) {
      console.error('Failed to fetch upcoming events:', error);
        }
    };
    fetchevent();
  },[]);


  // Load authentication state on app initialization
  useEffect(() => {
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  const response = async () => {
    const res = await fetch(API.Update_count.url, {
      method: API.Update_count.method,
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res.ok) {
      const data = await res.json();
      console.log("Website visit count updated successfully:", data);
    } else {
      console.error("Failed to fetch website visit data");
    }
  }

  useEffect(() => {
    response();
  }, []);

  useEffect(() => {
    const hasRotated = sessionStorage.getItem('rotationDone');

    if (!hasRotated) {
      setIsLoading(true);

      const timer = setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem('rotationDone', 'true'); 
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);



  return (
    <div>
      {/* Global subtle star background */}
      <div className="global-stars-container"></div>
      
      
      {isLoading ? (
        <Loading />
      ) : (
        <div>
           <ToastContainer />
           {/* <TopHeader /> */}
           <div className="sticky-header">
           <Header />
           </div>
           <Outlet />
           <Footer />
           {
            popupdata && (
              <UpcomingEventCard
                popuphandler = {setpopupdata}
                name= {popupdata.name}
                photo = {popupdata.photo} 
              ></UpcomingEventCard>
            )
           }
         </div>
      )}
    </div>

  );
};

export default App;
