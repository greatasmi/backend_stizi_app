import { Response } from 'express';
import Stamp from '../models/Stamp';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid';

export const createStamp = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, latitude, longitude } = req.body;

    if (!name || !description || !latitude || !longitude) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const qrCode = uuidv4();

    const stamp = await Stamp.create({
      name,
      description,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      qrCode,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, stamp });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getNearbyStamps = async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const stamps = await Stamp.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude as string), parseFloat(latitude as string)],
          },
          $maxDistance: parseInt(radius as string),
        },
      },
    }).populate('createdBy', 'name phoneNumber');

    res.status(200).json({ success: true, stamps });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const collectStamp = async (req: AuthRequest, res: Response) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({ message: 'QR code is required' });
    }

    const stamp = await Stamp.findOne({ qrCode });

    if (!stamp) {
      return res.status(404).json({ message: 'Stamp not found' });
    }

    if (stamp.collectedBy.includes(req.user._id)) {
      return res.status(400).json({ message: 'Stamp already collected' });
    }

    stamp.collectedBy.push(req.user._id);
    await stamp.save();

    const user = await User.findById(req.user._id);
    if (user) {
      user.stamps.push(stamp._id);
      await user.save();
    }

    res.status(200).json({ success: true, message: 'Stamp collected successfully', stamp });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getMyStamps = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id).populate('stamps');
    res.status(200).json({ success: true, stamps: user?.stamps || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};