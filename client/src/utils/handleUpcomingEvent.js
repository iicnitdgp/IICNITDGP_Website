import API from "../common/api.js"
const response = async () => {
const res = await fetch(API.UpcomingEvent.url, {
    method: API.UpcomingEvent.method,
    mode: "cors",
    headers: {
    "Content-Type": "application/json",
    },
});
if (res.ok) {
    const data = await res.json();
    return data;
} else {
    console.error("Failed to fetch upcoming events");
    return null;
}
}


async function handleUpcomingEvents(){
    
    const sessiondata =await sessionStorage.getItem('latestEventPopUp');    
    if(sessiondata == null || sessiondata == false){
        const data = await response();
        return data;
    }
    else{
        return null;
    }

}

export default handleUpcomingEvents;





