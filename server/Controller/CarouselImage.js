const CorouselImageModel=require('../model/carouselImage');
const deleteUploadedFile = require('./deleteUploadedFile.js');

const getCarouselImages=async(req,res)=>{
    try{
        const images=await CorouselImageModel.find();
        res.status(200).json(images);
    }catch(err){
        res.status(500).json({message:err.message});
    }
}
const submitCarouselImages=async(req,res)=>{
    try{
        const images=await CorouselImageModel.create(req.body);
        res.status(200).json(images);
    }catch(err){
        res.status(500).json({message:err.message});
    }
}

const deleteCarouselImages = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        status: 'failed',
        message: 'Image ID is required'
      });
    }
    const image = await CorouselImageModel.findById(req.params.id);

    if (!image) {
      return res.status(404).json({
        status: 'failed',
        message: 'Carousel image not found'
      });
    }
    await CorouselImageModel.findByIdAndDelete(image.id);
    try {
      const deleteImage = await deleteUploadedFile(image.image,'carousel');
      // console.log(deleteImage);
    } catch (fileError) {
      console.error('Failed to delete carousel image file:', fileError);
    }
    return res.status(200).json({
      status: 'success',
      message: 'Carousel image deleted successfully'
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      status: 'failed',
      message: 'Failed to delete carousel image'
    });
  }
};


module.exports={getCarouselImages,submitCarouselImages,deleteCarouselImages};
