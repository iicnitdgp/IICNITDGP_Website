import React from 'react'
// import HackathonCard from '../../component/HackathonCard/HackathonCard'
import styles from './styles/Hackathon.module.scss'
import Card from '../../component/CollaborationCard/Card' // Reusing Card component

const hackathons = [
    {
        name: "Smart India Hackathon",
        link: "https://www.sih.gov.in/",
        photo:"https://i0.wp.com/opportunitycell.com/wp-content/uploads/2022/03/SIH2.png?fit=327%2C345&ssl=1"
    },
    {
        name: "MSME Idea Hackathon",
        link: "https://my.msme.gov.in/inc/",
        photo:"https://res.cloudinary.com/fh8avphd/image/upload/v1789817575/msme_logo.png"
    },
    {
        name: "Smart Bengal Hackathon",
        link: "https://sbh.rcciit.org.in/",
        photo:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGWbtNf8kZhtJXDn8DO7osFLAaHs2zjadEgA&s"
    }
];

const Hackathon = () => {
    return (
        <div className={styles.container}>
            <div className={styles.heading}>
                <p className={styles.head}>
                    HACKATHONS{" "}
                    <span
                        style={{
                            background: "var(--primary)",
                            WebkitBackgroundClip: "text",
                            color: "transparent",
                        }}
                    >
                        FOR YOU
                    </span>
                </p>
                <div className={styles.bottomLine}></div>
            </div>
            <div className={styles.grid}>
                {hackathons.map((hackathon, index) => (
                    <Card key={index} name={hackathon.name} link={hackathon.link} photo={hackathon.photo} />
                ))}
            </div>
        </div>
    )
}

export default Hackathon