import './styles/UpcomingEventCard.scss'

const RecentEventCard = ({popuphandler,name,photo}) => {
  // console.log(photo)
return (

  <div className="recent-event-overlay">
    <aside className="recent-event-card" aria-label="Recent event">
      <button
        className="recent-event-close"
        type="button"
        aria-label="Close recent event"
        onClick={()=>{
          sessionStorage.setItem('latestEventPopUp',true)
          popuphandler(null)
        }
        }
      >
        &times;
      </button>
      
      <img
        src={photo}
        alt={name}
      />
    </aside>
  </div>
);
}
export default RecentEventCard;
