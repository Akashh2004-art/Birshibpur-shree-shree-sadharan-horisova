import { Request, Response } from 'express';
import { Gallery } from '../models/galleryModel';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import cloudinary from '../config/cloudinary.config';
import { UploadApiResponse } from 'cloudinary';

const unlinkAsync = promisify(fs.unlink);

// Multer configuration for temporary file storage before Cloudinary upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/temp');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename for temporary storage
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `temp-${uniqueSuffix}${ext}`);
  }
});

// File filter for images and videos
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|avi|mov|wmv|flv|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('শুধুমাত্র ছবি এবং ভিডিও ফাইল আপলোড করা যাবে'));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: fileFilter,
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (filePath: string, resourceType: 'image' | 'video' = 'image'): Promise<UploadApiResponse> => {
  try {
    console.log('☁️ Uploading to Cloudinary:', filePath);
    
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: resourceType,
      folder: 'temple-gallery', // Create a folder in Cloudinary
      use_filename: true,
      unique_filename: true,
    });
    
    console.log('✅ Cloudinary upload successful:', result.secure_url);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary upload failed:', error);
    throw error;
  }
};

// Get all gallery items
export const getAllGallery = async (req: Request, res: Response) => {
  try {
    const { category, type, page = 1, limit = 20 } = req.query;
    
    // Build filter object
    const filter: any = {};
    if (category) filter.category = category;
    if (type) filter.type = type;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    const galleryItems = await Gallery.find(filter)
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('uploadedBy', 'name email');

    const total = await Gallery.countDocuments(filter);

    // Frontend expects direct array
    res.status(200).json(galleryItems);
  } catch (error: any) {
    console.error('গ্যালারি ডাটা পেতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'গ্যালারি ডাটা পেতে ত্রুটি হয়েছে',
      error: error.message,
    });
  }
};

// Upload new media to Cloudinary
export const uploadMedia = async (req: Request, res: Response) => {
  try {
    console.log('📤 Upload request received');
    console.log('📁 File:', req.file);
    console.log('📝 Body:', req.body);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'কোন ফাইল আপলোড করা হয়নি',
      });
    }

    const { title, category, type } = req.body;

    // Validate required fields
    if (!title || !category) {
      // Delete temporary file if validation fails
      if (req.file.path) {
        await unlinkAsync(req.file.path).catch(console.error);
      }
      
      return res.status(400).json({
        success: false,
        message: 'শিরোনাম এবং ক্যাটাগরি আবশ্যক',
      });
    }

    // Determine type based on mimetype if not provided
    const mediaType = type || (req.file.mimetype.startsWith('video') ? 'video' : 'image');
    
    try {
      // Upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(
        req.file.path, 
        mediaType as 'image' | 'video'
      );

      // Create new gallery item with Cloudinary URL
      const newGalleryItem = new Gallery({
        url: cloudinaryResult.secure_url, // Use Cloudinary URL
        title: title.trim(),
        category,
        type: mediaType,
        fileSize: req.file.size,
        filename: cloudinaryResult.public_id, // Store Cloudinary public_id instead of local filename
        mimetype: req.file.mimetype,
        cloudinaryId: cloudinaryResult.public_id, // Store for future deletion
        uploadedBy: (req as any).user?.uid || (req as any).admin?.id,
      });

      const savedItem = await newGalleryItem.save();

      // Delete temporary file after successful Cloudinary upload
      await unlinkAsync(req.file.path).catch(console.error);

      console.log('✅ Media uploaded successfully to Cloudinary:', savedItem._id);

      // Return the saved item
      res.status(201).json(savedItem);

    } catch (cloudinaryError) {
      console.error('❌ Cloudinary upload failed:', cloudinaryError);
      
      // Delete temporary file on Cloudinary error
      if (req.file.path) {
        await unlinkAsync(req.file.path).catch(console.error);
      }
      
      res.status(500).json({
        success: false,
        message: 'ক্লাউডিনারিতে আপলোড করতে ত্রুটি হয়েছে',
        error: cloudinaryError,
      });
    }

  } catch (error: any) {
    console.error('মিডিয়া আপলোড ত্রুটি:', error);
    
    // Clean up temporary file on error
    if (req.file && req.file.path) {
      await unlinkAsync(req.file.path).catch(console.error);
    }

    res.status(500).json({
      success: false,
      message: 'মিডিয়া আপলোড করতে ত্রুটি হয়েছে',
      error: error.message,
    });
  }
};

// Delete media from Cloudinary and database
export const deleteMedia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const galleryItem = await Gallery.findById(id);
    
    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        message: 'মিডিয়া আইটেম পাওয়া যায়নি',
      });
    }

    try {
      // Delete from Cloudinary if cloudinaryId exists
      if (galleryItem.cloudinaryId) {
        console.log('🗑️ Deleting from Cloudinary:', galleryItem.cloudinaryId);
        await cloudinary.uploader.destroy(galleryItem.cloudinaryId, {
          resource_type: galleryItem.type === 'video' ? 'video' : 'image'
        });
        console.log('✅ Deleted from Cloudinary successfully');
      }
    } catch (cloudinaryError) {
      console.error('⚠️ Failed to delete from Cloudinary:', cloudinaryError);
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Delete from database
    await Gallery.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'মিডিয়া সফলভাবে মুছে ফেলা হয়েছে',
    });
  } catch (error: any) {
    console.error('মিডিয়া মুছে ফেলার ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'মিডিয়া মুছে ফেলতে ত্রুটি হয়েছে',
      error: error.message,
    });
  }
};

// Get single gallery item
export const getGalleryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const galleryItem = await Gallery.findById(id).populate('uploadedBy', 'name email');
    
    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        message: 'মিডিয়া আইটেম পাওয়া যায়নি',
      });
    }

    res.status(200).json({
      success: true,
      data: galleryItem,
    });
  } catch (error: any) {
    console.error('গ্যালারি আইটেম পেতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'গ্যালারি আইটেম পেতে ত্রুটি হয়েছে',
      error: error.message,
    });
  }
};

// Update gallery item
export const updateGalleryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, category } = req.body;

    const galleryItem = await Gallery.findById(id);
    
    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        message: 'মিডিয়া আইটেম পাওয়া যায়নি',
      });
    }

    // Update fields
    if (title) galleryItem.title = title.trim();
    if (category) galleryItem.category = category;

    const updatedItem = await galleryItem.save();

    res.status(200).json({
      success: true,
      message: 'মিডিয়া আইটেম সফলভাবে আপডেট হয়েছে',
      data: updatedItem,
    });
  } catch (error: any) {
    console.error('মিডিয়া আইটেম আপডেট ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'মিডিয়া আইটেম আপডেট করতে ত্রুটি হয়েছে',
      error: error.message,
    });
  }
};

// Get gallery statistics
export const getGalleryStats = async (req: Request, res: Response) => {
  try {
    const stats = await Gallery.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
        },
      },
    ]);

    const typeStats = await Gallery.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalItems = await Gallery.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        categoryStats: stats,
        typeStats,
        totalItems,
      },
    });
  } catch (error: any) {
    console.error('গ্যালারি পরিসংখ্যান পেতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'গ্যালারি পরিসংখ্যান পেতে ত্রুটি হয়েছে',
      error: error.message,
    });
  }
};