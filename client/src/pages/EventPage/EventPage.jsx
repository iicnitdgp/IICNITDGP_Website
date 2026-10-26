import React from 'react';
import Internship from '../../section/Internship/Internship';
import IdeathonEvent from '../../section/IdeathonEvent/IdeathonEvent';
import EventSection from '../../section/Event/event';
import styles from './styles/EventPage.module.scss';
import Hackathonsec from '../../section/Hackathon/Hackathon'
import Ai2Summit from '../Ai2Summit/Ai2Summit';
const EventPage = () => {
    const [activeTab, setActiveTab] = React.useState('Events');

    return (
        <div className={styles.activityWrapper} id="activity">

            <center className={styles.newsTitle}>
                <div>
                    Our <span style={{
                        background: "var(--primary)",
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                    }}>Activity</span>
                </div>
                <div className={styles.bottomLine}></div>
            </center>

            <div className={styles.tabHeader}>
                <button
                    className={activeTab === 'Events' ? styles.active : ''}
                    onClick={() => setActiveTab('Events')}
                >
                    Events
                </button>
                <button
                    className={activeTab === 'Internship' ? styles.active : ''}
                    onClick={() => setActiveTab('Internship')}
                >
                    Internship
                </button>
                <button
                    className={activeTab === 'Hackathon' ? styles.active : ''}
                    onClick={() => setActiveTab('Hackathon')}
                >
                    Hackathon
                </button>
                <button
                    className={activeTab === 'AI2_Summit' ? styles.active : ''}
                    onClick={() => setActiveTab('AI2_Summit')}
                >
                    Ai2 Summit
                </button>

            </div>

            <div className={styles.tabContent}>
                {activeTab === 'Internship' && <Internship />}
                {activeTab === 'Hackathon' && <Hackathonsec/>}
                {activeTab === 'Events' && <EventSection />}
                {activeTab === 'AI2_Summit' && <Ai2Summit/>}
            </div>
        </div>
    );
};

export default EventPage;
