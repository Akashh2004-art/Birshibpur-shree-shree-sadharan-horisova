import { Request, Response } from 'express';
import { Event } from '../models/eventModel';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const createEvent = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  try {
    const { title, startDate, endDate, description } = req.body;
    if (!title || !startDate || !endDate || !description) {
      return res.status(400).json({ success: false, error: 'সব তথ্য পূরণ করুন' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'একটি ছবি আপলোড করুন' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'temple_events',
      resource_type: 'auto'
    });

    fs.unlinkSync(req.file.path);

    const event = await Event.create({
      title,
      startDate,
      endDate,
      description,
      imageUrl: result.secure_url,
      imagePublicId: result.public_id
    });

    return res.status(201).json({ success: true, message: 'ইভেন্ট সফলভাবে তৈরি হয়েছে', data: event });
  } catch (error) {
    console.error('❌ Error creating event:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ success: false, error: 'সার্ভার এ একটি সমস্যা হয়েছে' });
  }
};

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    return res.status(500).json({ success: false, error: 'ইভেন্ট লোড করতে সমস্যা হয়েছে' });
  }
};

export const updateEvent = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  try {
    const { title, startDate, endDate, description } = req.body;
    const { id } = req.params;

    if (!title || !startDate || !endDate || !description) {
      return res.status(400).json({ success: false, error: 'সব তথ্য পূরণ করুন' });
    }

    const existingEvent = await Event.findById(id);
    if (!existingEvent) {
      return res.status(404).json({ success: false, error: 'Event খুঁজে পাওয়া যায়নি' });
    }

    let imageUrl = existingEvent.imageUrl;
    let imagePublicId = existingEvent.imagePublicId;

    if (req.file) {
      await cloudinary.uploader.destroy(imagePublicId); // delete old image

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'temple_events',
        resource_type: 'auto'
      });
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
      fs.unlinkSync(req.file.path);
    }

    existingEvent.title = title;
    existingEvent.startDate = startDate;
    existingEvent.endDate = endDate;
    existingEvent.description = description;
    existingEvent.imageUrl = imageUrl;
    existingEvent.imagePublicId = imagePublicId;

    await existingEvent.save();

    return res.status(200).json({ success: true, message: 'ইভেন্ট আপডেট সফল হয়েছে', data: existingEvent });
  } catch (error) {
    console.error('❌ Update Error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ success: false, error: 'সার্ভার সমস্যা হয়েছে' });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ success: false, error: 'ইভেন্ট খুঁজে পাওয়া যায়নি' });
    }

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(event.imagePublicId);

    // Delete from MongoDB
    await Event.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: 'ইভেন্ট সফলভাবে মুছে ফেলা হয়েছে' });
  } catch (error) {
    console.error('❌ Delete Error:', error);
    return res.status(500).json({ success: false, error: 'সার্ভার সমস্যা হয়েছে' });
  }
};

// ✅ FIXED: End date ke 11:59:59 PM porjonto extend kora holo
export const getUpcomingEvents = async (req: Request, res: Response) => {
  try {
    // Current date/time 
    const now = new Date();
    
    // Today's date at 11:59:59 PM
    const todayEndOfDay = new Date();
    todayEndOfDay.setHours(23, 59, 59, 999);
    
    // Events jekhane endDate >= today's start (00:00:00)
    // Mane ajo theke future e jegulo ache
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const events = await Event.find({ 
      endDate: { $gte: todayStart } 
    }).sort({ startDate: 1 });
    
    return res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error('❌ Error fetching upcoming events:', error);
    return res.status(500).json({ success: false, error: 'Upcoming events load করতে সমস্যা হয়েছে' });
  }
};

// ✅ FIXED: Past events ke properly filter kora holo
export const getPastEvents = async (req: Request, res: Response) => {
  try {
    // Yesterday's end time (23:59:59)
    const yesterdayEnd = new Date();
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);
    
    // Events jekhane endDate < today's start (00:00:00)
    // Mane ajker age je gulo shesh hoye geche
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const events = await Event.find({ 
      endDate: { $lt: todayStart } 
    }).sort({ endDate: -1 });
    
    return res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error('❌ Error fetching past events:', error);
    return res.status(500).json({ success: false, error: 'Past events load করতে সমস্যা হয়েছে' });
  }
};

export const getEventCount = async (req: Request, res: Response) => {
  try {
    const count = await Event.countDocuments(); // MongoDB theke total event count
    return res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('❌ Event count আনতে সমস্যা হয়েছে:', error);
    return res.status(500).json({ success: false, error: 'ইভেন্ট সংখ্যা লোড করতে সমস্যা হয়েছে' });
  }
};