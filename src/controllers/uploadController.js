import { assertCloudinaryConfig, uploadBufferToCloudinary } from '../utils/cloudinary.js';

const DEFAULT_FOLDER = process.env.CLOUDINARY_KYC_FOLDER || 'naijapass/kyc-documents';

export async function uploadDocument(req, res) {
  try {
    assertCloudinaryConfig();

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Document file is required' });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: DEFAULT_FOLDER,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        bytes: result.bytes,
        originalName: req.file.originalname
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Document upload failed', error: err.message });
  }
}
