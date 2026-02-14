const Resource = require('../models/Resource');
const { uploadToCloudinary } = require('../middleware/cloudinary'); // Import the utility
const cloudinary = require('cloudinary').v2; // Needed for deletion

// @desc    Create a new resource
// @route   POST /api/resources
// @access  Private/Admin
exports.createResource = async (req, res) => {
    try {
        const { title, description, category, type, tags } = req.body;

        // 1. Handle Files (from Multer)
        const thumbnailFile = req.files?.thumbnail ? req.files.thumbnail[0] : null;
        const contentFile = req.files?.file ? req.files.file[0] : null;

        let contentData = { url: req.body.contentUrl || "", publicId: "" };
        let thumbData = { url: "", publicId: "" };

        // 2. Upload Content (Video/PDF) to Cloudinary
        if (contentFile) {
            const result = await uploadToCloudinary(contentFile.path, `resources/${type}s`);
            if (result) {
                contentData.url = result.secure_url;
                contentData.publicId = result.public_id;
            }
        }

        // 3. Upload Thumbnail to Cloudinary
        if (thumbnailFile) {
            const result = await uploadToCloudinary(thumbnailFile.path, 'resources/thumbnails');
            if (result) {
                thumbData.url = result.secure_url;
                thumbData.publicId = result.public_id;
            }
        }

        // 4. Validate Content (Must have either a file upload OR a link)
        if (!contentData.url) {
            return res.status(400).json({ success: false, error: "Content URL or File is required" });
        }

        // 5. Create Database Entry
        const resource = await Resource.create({
            title,
            description,
            category,
            type,
            contentUrl: contentData.url,
            contentPublicId: contentData.publicId,
            thumbnail: thumbData.url,
            thumbnailPublicId: thumbData.publicId,
            // Parse tags from "tag1, tag2" string to Array
            tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        });

        res.status(201).json({ success: true, data: resource });

    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private/Admin
exports.updateResource = async (req, res) => {
    try {
        let resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ success: false, error: 'Resource not found' });
        }

        let updateData = { ...req.body };

        // Handle Tags Update
        if (updateData.tags && typeof updateData.tags === 'string') {
            updateData.tags = updateData.tags.split(',').map(t => t.trim());
        }

        // Handle New Thumbnail Upload
        if (req.files?.thumbnail) {
            // Delete old thumbnail from cloud
            if (resource.thumbnailPublicId) {
                await cloudinary.uploader.destroy(resource.thumbnailPublicId);
            }
            // Upload new
            const result = await uploadToCloudinary(req.files.thumbnail[0].path, 'resources/thumbnails');
            updateData.thumbnail = result.secure_url;
            updateData.thumbnailPublicId = result.public_id;
        }

        // Handle New Content File Upload
        if (req.files?.file) {
            // Delete old content from cloud
            if (resource.contentPublicId) {
                await cloudinary.uploader.destroy(resource.contentPublicId, { 
                    resource_type: resource.type === 'video' ? 'video' : 'image' 
                });
            }
            // Upload new
            const result = await uploadToCloudinary(req.files.file[0].path, `resources/${updateData.type || resource.type}s`);
            updateData.contentUrl = result.secure_url;
            updateData.contentPublicId = result.public_id;
        }

        resource = await Resource.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: resource });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private/Admin
exports.deleteResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({ success: false, error: 'Resource not found' });
        }

        // 1. Delete Content from Cloudinary
        if (resource.contentPublicId) {
            await cloudinary.uploader.destroy(resource.contentPublicId, {
                resource_type: resource.type === 'video' ? 'video' : 'image'
            });
        }

        // 2. Delete Thumbnail from Cloudinary
        if (resource.thumbnailPublicId) {
            await cloudinary.uploader.destroy(resource.thumbnailPublicId);
        }

        // 3. Delete from DB
        await resource.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Keep existing Getters
exports.getAllResources = async (req, res) => {
    try {
        const { category, tag, search } = req.query;
        let query = {};

        if (category && category !== 'All') {
            query.category = category;
        }
        if (tag) {
            query.tags = { $in: [tag] };
        }
        if (search) {
             query.title = { $regex: search, $options: 'i' };
        }

        const resources = await Resource.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: resources.length, data: resources });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getResourceById = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });

        resource.views += 1;
        await resource.save();
        res.status(200).json({ success: true, data: resource });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};