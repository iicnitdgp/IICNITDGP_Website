// import React, { useState, useEffect } from 'react';
// import EventCard from './../../component/ReadMore/readmore';
// // import newsData from '../../data/SchoolMedia.json';
// import Events from './../../../public/data/events.json';
// import styles from './styles/events.module.scss';
// import GradientText from '../../component/Core/TextStyle';
// import API from '../../common/api';
// import PageLoading from '../../layouts/PageLoading/Loading';

// const NewsEvent = () => {
//     const [newsList, setNewsList] = useState([]);
//     const [loading, setLoading] = useState(true);

//     const fetchNewsData = async () => {
//         setLoading(true);
//         const response= await fetch(API.WebinarFetch.url, {
//             method: API.WebinarFetch.method,
//             mode: "cors",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//         });
//         if (response.ok) {
//             const data = await response.json();
//             setNewsList(data.reverse());
//         } else {
//             console.error("Failed to fetch news data");
//         }
//         setLoading(false);
//     }
//     useEffect(() => {
//         fetchNewsData();
//     }, []);


//     return (
//         <>
//             <center className={styles.newsTitle}>

//                     <div >Our <span style={{
//                         background: "var(--primary)",
//                         WebkitBackgroundClip: "text",
//                         color: "transparent",
//                     }}>Events</span></div>
//                     <div className={styles.bottomLine}></div>

//             </center>
//             {loading ? <PageLoading /> : <div className={styles.newsContainer}>

//                 {newsList.map((news, index) => (
//                     <EventCard
//                         key={index}
//                         image={news.photo}
//                         title={news.name}
//                         date={news.date}
//                         time={news.time ? news.time : new Date().toLocaleTimeString()}
//                         content={news.details}
//                     />
//                 ))}
//             </div>}
//         </>
//     );
// };

// export default NewsEvent;


import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import EventCard from './../../component/ReadMore/readmore';
import styles from './styles/events.module.scss';
import GradientText from '../../component/Core/TextStyle';
import API from '../../common/api';
import PageLoading from '../../layouts/PageLoading/Loading';
import Loader from './../../layouts/Loader/Loader'; // Import the loader component

const NewsEvent = () => {
    const [newsList, setNewsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming'); // 'upcoming' or 'past'
    const [error, setError] = useState(null);

    const fetchNewsData = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching from:', API.WebinarFetch.url);
            const response = await fetch(API.WebinarFetch.url, {
                method: API.WebinarFetch.method,
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                // Sort events by date (newest first for display)
                const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
                setNewsList(sortedData);
            } else {
                const errorText = await response.text();
                console.error('Response error:', response.status, errorText);
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error("Error fetching events:", error);
            if (error.message.includes('fetch')) {
                setError('Cannot connect to server. Make sure the backend is running on port 8000.');
            } else {
                setError(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNewsData();
    }, []);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const filteredNews = newsList.filter((event) => {
        // Handle different date formats
        let eventDate;
        try {
            // Try to parse the date - handle various formats
            eventDate = new Date(event.date);
            
            // If invalid date, try alternative parsing
            if (isNaN(eventDate.getTime())) {
                // Handle formats like "14th December 2020" or "2024-10-09"
                const dateStr = event.date.toString();
                eventDate = new Date(dateStr.replace(/(\d+)(st|nd|rd|th)/, '$1'));
            }
            
            eventDate.setHours(0, 0, 0, 0);
        } catch (error) {
            console.warn('Invalid date format for event:', event.name, event.date);
            return false;
        }

        return filter === 'upcoming' ? eventDate >= now : eventDate < now;
    });

    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                // Return original string if can't parse
                return dateStr;
            }
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateStr;
        }
    };

    const getEventStatus = (event) => {
        const now = new Date();
        const eventDate = new Date(event.date);
        
        if (event.registrationDeadline) {
            const regDeadline = new Date(event.registrationDeadline);
            if (now > regDeadline) {
                return { status: 'Registration Closed', className: styles.statusClosed };
            }
        }
        
        if (eventDate > now) {
            return { status: 'Upcoming', className: styles.statusUpcoming };
        } else {
            return { status: 'Completed', className: styles.statusCompleted };
        }
    };

    const handleDownloadEvent = (event) => {
        const eventData = [
            {
                "Event Name": event.name || "N/A",
                "Category": event.category || "webinar",
                "Date": formatDate(event.date) || "N/A",
                "Time": event.time || "N/A",
                "Location": event.location || "Online",
                "Registration Deadline": event.registrationDeadline ? formatDate(event.registrationDeadline) : "N/A",
                "Max Participants": event.maxParticipants || "N/A",
                "Contact Email": event.contactEmail || "N/A",
                "Contact Phone": event.contactPhone || "N/A",
                "Details": event.details || "N/A"
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(eventData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Event Details");
        
        const safeName = (event.name || "Event").replace(/[^a-z0-9]/gi, '_').toLowerCase();
        XLSX.writeFile(workbook, `${safeName}_details.xlsx`);
    };

    if (loading) return <Loader />;
    
    if (error) {
        return (
            <>
                <center className={styles.newsTitle}>
                    <div>
                        Our <span style={{
                            background: "var(--primary)",
                            WebkitBackgroundClip: "text",
                            color: "transparent",
                        }}>Events</span>
                    </div>
                    <div className={styles.bottomLine}></div>
                </center>
                <div className={styles.errorContainer}>
                    <p>🔧 Events data is currently unavailable</p>
                    <p className={styles.errorSubtext}>Backend server is not running. Events will be displayed once the server is connected.</p>
                    <button onClick={fetchNewsData} className={styles.retryButton}>
                        Retry Connection
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <center className={styles.newsTitle}>
                <div>
                    Our <span style={{
                        background: "var(--primary)",
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                    }}>Events</span>
                </div>
                <div className={styles.bottomLine}></div>
            </center>

            <div className={styles.filterTabs}>
                <button
                    onClick={() => setFilter('upcoming')}
                    className={filter === 'upcoming' ? styles.active : ''}
                >
                    Upcoming Events ({newsList.filter(e => {
                        const eventDate = new Date(e.date);
                        eventDate.setHours(0, 0, 0, 0);
                        return eventDate >= now;
                    }).length})
                </button>
                <button
                    onClick={() => setFilter('past')}
                    className={filter === 'past' ? styles.active : ''}
                >
                    Past Events ({newsList.filter(e => {
                        const eventDate = new Date(e.date);
                        eventDate.setHours(0, 0, 0, 0);
                        return eventDate < now;
                    }).length})
                </button>
            </div>

            <div className={styles.newsContainer}>
                {filteredNews.length > 0 ? (
                    filteredNews.map((event, index) => {
                        const eventStatus = getEventStatus(event);
                        
                        return (
                            <div key={event._id || index} className={styles.eventCard}>
                                <div className={styles.eventHeader}>
                                    <div className={`${styles.eventStatus} ${eventStatus.className}`}>
                                        {eventStatus.status}
                                    </div>
                                    <span className={styles.eventCategory}>
                                        {event.category || 'webinar'}
                                    </span>
                                </div>

                                <div className={styles.eventInfo}>
                                    <h3 className={styles.eventTitle}>{event.name}</h3>
                                    
                                    <div className={styles.eventMeta}>
                                        <div className={styles.metaItem}>
                                            📅 {formatDate(event.date)}
                                        </div>
                                        {event.time && (
                                            <div className={styles.metaItem}>
                                                🕒 {event.time}
                                            </div>
                                        )}
                                        <div className={styles.metaItem}>
                                            📍 {event.location || 'Online'}
                                        </div>
                                        {event.registrationDeadline && (
                                            <div className={styles.metaItem}>
                                                ⏰ Reg. Deadline: {formatDate(event.registrationDeadline)}
                                            </div>
                                        )}
                                        {event.maxParticipants && (
                                            <div className={styles.metaItem}>
                                                👥 Max: {event.maxParticipants} participants
                                            </div>
                                        )}
                                        {event.contactEmail && (
                                            <div className={styles.metaItem}>
                                                📧 <a href={`mailto:${event.contactEmail}`}>{event.contactEmail}</a>
                                            </div>
                                        )}
                                        {event.contactPhone && (
                                            <div className={styles.metaItem}>
                                                📞 <a href={`tel:${event.contactPhone}`}>{event.contactPhone}</a>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {filter === 'past' && (
                                        <button 
                                            onClick={() => handleDownloadEvent(event)} 
                                            className={styles.downloadBtn}
                                        >
                                            📊 Download Details
                                        </button>
                                    )}
                                </div>

                                <EventCard
                                    image={event.photo}
                                    title={event.name}
                                    date={event.date}
                                    time={event.time || 'TBA'}
                                    content={event.details}
                                />
                            </div>
                        );
                    })
                ) : (
                    <div className={styles.noEvents}>
                        <p>No {filter} events found.</p>
                        {filter === 'upcoming' && (
                            <p className={styles.noEventsSubtext}>
                                Check back later for new events or view past events.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default NewsEvent;
