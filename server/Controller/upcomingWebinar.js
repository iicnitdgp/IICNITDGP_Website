const WebinarModel = require('../model/Webinar');


function getCurrentDateTime() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const upcomingWebinar = async(req,res)=>{

    try{

    const webinar = await WebinarModel.find({   
            $or: [
                { isActive: true },
                { isActive: { $exists: false } }
            ],     
            date: { $gte: getCurrentDateTime() }
        }).sort({ date: 1 }).limit(1);
    
    // console.log(webinar)
    res.status(200).json(webinar);

    }catch(error){
        console.log(error);
        res.status(500).json({
            'status':'failed',
            'message':'failed to find latest events'
        })
    }


}

module.exports = upcomingWebinar;